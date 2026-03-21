package nomenclature

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

// ── Request / response types ──────────────────────────────────────────────────

type MergeRequest struct {
	TargetID uuid.UUID `json:"target_id" binding:"required"`
}

type RenameRequest struct {
	NewCode string `json:"new_code" binding:"required"`
}

type DeleteWithRemapRequest struct {
	TargetID *uuid.UUID `json:"target_id"` // nil = delete without remap (only if no marchés)
}

type ImpactResult struct {
	Code    string          `json:"code"`
	Label   string          `json:"label"`
	Count   int64           `json:"count"`
	Total   float64         `json:"total"`
	Marches []marchePreview `json:"marches"`
}

type marchePreview struct {
	ID          string  `json:"id"`
	Reference   string  `json:"reference"`
	Objet       string  `json:"objet"`
	Montant     float64 `json:"montant"`
	FamilleCode string  `json:"famille_code"`
}

// mergeAuditMeta is stored in audit_logs.metadata for rollback support.
type mergeAuditMeta struct {
	Operation   string    `json:"operation"`           // "merge" | "recode" | "delete_remap"
	FromCode    string    `json:"from_code"`
	ToCode      string    `json:"to_code"`
	FromLabel   string    `json:"from_label"`
	ToLabel     string    `json:"to_label"`
	MarcheIDs   []string  `json:"marche_ids"`
	SourceID    string    `json:"source_id"`
	TargetID    string    `json:"target_id,omitempty"`
	PerformedAt time.Time `json:"performed_at"`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// codeVariants returns the code and common storage variants (some marchés may
// omit the F/S prefix). The list is de-duplicated.
func codeVariants(code string) []string {
	seen := map[string]bool{code: true}
	out := []string{code}
	// Strip common prefixes to catch both "F10" and "10" in old data
	for _, pfx := range []string{"F", "S"} {
		if len(code) > 1 && string(code[0]) == pfx {
			stripped := code[1:]
			if !seen[stripped] {
				seen[stripped] = true
				out = append(out, stripped)
			}
		}
	}
	return out
}

func affectedMarcheIDs(tx *gorm.DB, orgID uuid.UUID, code string) ([]string, error) {
	variants := codeVariants(code)
	type row struct{ ID string }
	var rows []row
	if err := tx.Table("marches").
		Select("id").
		Where("tenant_id = ? AND deleted_at IS NULL AND famille_code IN ?", orgID, variants).
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	ids := make([]string, len(rows))
	for i, r := range rows {
		ids[i] = r.ID
	}
	return ids, nil
}

func writeAuditLog(tx *gorm.DB, orgID uuid.UUID, userID *uuid.UUID, meta mergeAuditMeta) error {
	raw, err := json.Marshal(meta)
	if err != nil {
		return err
	}
	return tx.Create(&models.AuditLog{
		OrganizationID: &orgID,
		UserID:         userID,
		Action:         fmt.Sprintf("nomenclature.%s", meta.Operation),
		ResourceType:   "NomenclatureNode",
		ResourceID:     meta.SourceID,
		Metadata:       raw,
	}).Error
}

// ── GetImpact ─────────────────────────────────────────────────────────────────

// GetImpact returns the list of marchés that reference the given nomenclature
// node's code, without making any changes. Used as a preview before merge /
// recode / delete.
//
// GET /nomenclature/:id/impact
func (h *Handler) GetImpact(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid id"))
		return
	}

	var node NomenclatureNode
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", id, orgID).
		First(&node).Error; err != nil {
		c.JSON(404, models.Err("node not found"))
		return
	}

	variants := codeVariants(node.Code)
	var previews []marchePreview
	h.db.WithContext(c.Request.Context()).
		Table("marches").
		Select("id, reference, objet, montant, famille_code").
		Where("tenant_id = ? AND deleted_at IS NULL AND famille_code IN ?", orgID, variants).
		Order("montant DESC").
		Scan(&previews)

	var total float64
	for _, m := range previews {
		total += m.Montant
	}

	c.JSON(200, models.OK(ImpactResult{
		Code:    node.Code,
		Label:   node.Label,
		Count:   int64(len(previews)),
		Total:   total,
		Marches: previews,
	}))
}

// ── MergeCode ─────────────────────────────────────────────────────────────────

// MergeCode re-maps all marchés from the source node's code to the target
// node's code, then soft-deletes the source node. The operation is atomic and
// fully audited for rollback within 24 h.
//
// POST /nomenclature/:id/merge
// Body: { "target_id": "<uuid>" }
func (h *Handler) MergeCode(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)

	srcID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid id"))
		return
	}

	var req MergeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, models.Err("target_id is required"))
		return
	}

	if srcID == req.TargetID {
		c.JSON(400, models.Err("source and target must be different"))
		return
	}

	ctx := c.Request.Context()
	var src, tgt NomenclatureNode

	if err := h.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", srcID, orgID).First(&src).Error; err != nil {
		c.JSON(404, models.Err("source node not found"))
		return
	}
	if err := h.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", req.TargetID, orgID).First(&tgt).Error; err != nil {
		c.JSON(404, models.Err("target node not found"))
		return
	}

	var affected int64
	var marcheIDs []string

	txErr := h.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Collect IDs before updating (for rollback metadata)
		ids, err := affectedMarcheIDs(tx, orgID, src.Code)
		if err != nil {
			return err
		}
		marcheIDs = ids
		affected = int64(len(ids))

		// Re-map all marché famille_codes
		variants := codeVariants(src.Code)
		if err := tx.Table("marches").
			Where("tenant_id = ? AND deleted_at IS NULL AND famille_code IN ?", orgID, variants).
			Update("famille_code", tgt.Code).Error; err != nil {
			return err
		}

		// Soft-delete source node
		if err := tx.Delete(&src).Error; err != nil {
			return err
		}

		// Audit log
		uid := userID
		return writeAuditLog(tx, orgID, &uid, mergeAuditMeta{
			Operation:   "merge",
			FromCode:    src.Code,
			ToCode:      tgt.Code,
			FromLabel:   src.Label,
			ToLabel:     tgt.Label,
			MarcheIDs:   marcheIDs,
			SourceID:    src.ID.String(),
			TargetID:    tgt.ID.String(),
			PerformedAt: time.Now().UTC(),
		})
	})

	if txErr != nil {
		c.JSON(500, models.Err("merge failed: "+txErr.Error()))
		return
	}

	c.JSON(200, models.OK(gin.H{
		"from_code":       src.Code,
		"from_label":      src.Label,
		"to_code":         tgt.Code,
		"to_label":        tgt.Label,
		"marches_updated": affected,
	}))
}

// ── RecodeNode ────────────────────────────────────────────────────────────────

// RecodeNode changes the code of a node and re-maps all matching marchés to
// use the new code. Used when a code is standardised or corrected.
//
// POST /nomenclature/:id/recode
// Body: { "new_code": "T-BAT2" }
func (h *Handler) RecodeNode(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid id"))
		return
	}

	var req RenameRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.NewCode == "" {
		c.JSON(400, models.Err("new_code is required"))
		return
	}

	ctx := c.Request.Context()
	var node NomenclatureNode
	if err := h.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, orgID).First(&node).Error; err != nil {
		c.JSON(404, models.Err("node not found"))
		return
	}

	if node.Code == req.NewCode {
		c.JSON(400, models.Err("new_code is identical to current code"))
		return
	}

	oldCode := node.Code
	var affected int64
	var marcheIDs []string

	txErr := h.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		ids, err := affectedMarcheIDs(tx, orgID, oldCode)
		if err != nil {
			return err
		}
		marcheIDs = ids
		affected = int64(len(ids))

		variants := codeVariants(oldCode)
		if err := tx.Table("marches").
			Where("tenant_id = ? AND deleted_at IS NULL AND famille_code IN ?", orgID, variants).
			Update("famille_code", req.NewCode).Error; err != nil {
			return err
		}

		if err := tx.Model(&node).Update("code", req.NewCode).Error; err != nil {
			return err
		}

		uid := userID
		return writeAuditLog(tx, orgID, &uid, mergeAuditMeta{
			Operation:   "recode",
			FromCode:    oldCode,
			ToCode:      req.NewCode,
			FromLabel:   node.Label,
			ToLabel:     node.Label,
			MarcheIDs:   marcheIDs,
			SourceID:    node.ID.String(),
			PerformedAt: time.Now().UTC(),
		})
	})

	if txErr != nil {
		c.JSON(500, models.Err("recode failed: "+txErr.Error()))
		return
	}

	c.JSON(200, models.OK(gin.H{
		"old_code":        oldCode,
		"new_code":        req.NewCode,
		"marches_updated": affected,
	}))
}

// ── DeleteWithRemap ───────────────────────────────────────────────────────────

// DeleteWithRemap soft-deletes a node and optionally re-maps its marchés to
// another node before deletion. If marchés exist and no target is provided,
// returns 409 with the impact so the caller can supply a target.
//
// DELETE /nomenclature/:id/remap
// Body (optional): { "target_id": "<uuid>" }
func (h *Handler) DeleteWithRemap(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid id"))
		return
	}

	var req DeleteWithRemapRequest
	_ = c.ShouldBindJSON(&req) // optional body

	ctx := c.Request.Context()
	var node NomenclatureNode
	if err := h.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, orgID).First(&node).Error; err != nil {
		c.JSON(404, models.Err("node not found"))
		return
	}
	if node.IsNational {
		c.JSON(403, models.Err("cannot delete a national nomenclature entry"))
		return
	}

	// Check if marchés exist
	variants := codeVariants(node.Code)
	var count int64
	h.db.WithContext(ctx).Table("marches").
		Where("tenant_id = ? AND deleted_at IS NULL AND famille_code IN ?", orgID, variants).
		Count(&count)

	if count > 0 && req.TargetID == nil {
		// Return impact so the frontend can ask for a remap target
		var previews []marchePreview
		h.db.WithContext(ctx).Table("marches").
			Select("id, reference, objet, montant, famille_code").
			Where("tenant_id = ? AND deleted_at IS NULL AND famille_code IN ?", orgID, variants).
			Order("montant DESC").Scan(&previews)
		c.JSON(409, gin.H{
			"error":  "marchés exist — provide target_id to remap before deletion",
			"impact": ImpactResult{Code: node.Code, Label: node.Label, Count: count, Marches: previews},
		})
		return
	}

	var toCode string
	var tgt NomenclatureNode
	var marcheIDs []string

	txErr := h.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		ids, err := affectedMarcheIDs(tx, orgID, node.Code)
		if err != nil {
			return err
		}
		marcheIDs = ids

		if req.TargetID != nil && count > 0 {
			if err := tx.Where("id = ? AND tenant_id = ?", *req.TargetID, orgID).First(&tgt).Error; err != nil {
				return fmt.Errorf("target node not found")
			}
			toCode = tgt.Code
			if err := tx.Table("marches").
				Where("tenant_id = ? AND deleted_at IS NULL AND famille_code IN ?", orgID, variants).
				Update("famille_code", toCode).Error; err != nil {
				return err
			}
		}

		if err := tx.Delete(&node).Error; err != nil {
			return err
		}

		uid := userID
		return writeAuditLog(tx, orgID, &uid, mergeAuditMeta{
			Operation:   "delete_remap",
			FromCode:    node.Code,
			ToCode:      toCode,
			FromLabel:   node.Label,
			ToLabel:     tgt.Label,
			MarcheIDs:   marcheIDs,
			SourceID:    node.ID.String(),
			TargetID:    func() string {
				if req.TargetID != nil {
					return req.TargetID.String()
				}
				return ""
			}(),
			PerformedAt: time.Now().UTC(),
		})
	})

	if txErr != nil {
		c.JSON(500, models.Err("deletion failed: "+txErr.Error()))
		return
	}

	c.JSON(200, models.OK(gin.H{
		"deleted_code":    node.Code,
		"remapped_to":     toCode,
		"marches_updated": len(marcheIDs),
	}))
}

// ── RollbackOperation ─────────────────────────────────────────────────────────

// RollbackOperation reverses a merge / recode / delete_remap within 24 h.
// It reads the audit log entry, validates the time window, and applies the
// inverse operation inside a transaction.
//
// POST /nomenclature/rollback/:auditId
func (h *Handler) RollbackOperation(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)

	auditID, err := uuid.Parse(c.Param("auditId"))
	if err != nil {
		c.JSON(400, models.Err("invalid audit id"))
		return
	}

	ctx := c.Request.Context()
	var entry models.AuditLog
	if err := h.db.WithContext(ctx).
		Where("id = ? AND organization_id = ?", auditID, orgID).
		First(&entry).Error; err != nil {
		c.JSON(404, models.Err("audit entry not found"))
		return
	}

	if time.Since(entry.CreatedAt) > 24*time.Hour {
		c.JSON(409, models.Err("rollback window expired (24 h)"))
		return
	}

	var meta mergeAuditMeta
	if err := json.Unmarshal(entry.Metadata, &meta); err != nil {
		c.JSON(500, models.Err("could not parse audit metadata"))
		return
	}

	var restored int64

	txErr := h.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if len(meta.MarcheIDs) > 0 {
			res := tx.Table("marches").
				Where("tenant_id = ? AND deleted_at IS NULL AND id IN ? AND famille_code = ?",
					orgID, meta.MarcheIDs, meta.ToCode).
				Update("famille_code", meta.FromCode)
			if res.Error != nil {
				return res.Error
			}
			restored = res.RowsAffected
		}

		// Restore soft-deleted source node for merge / delete_remap
		if meta.Operation == "merge" || meta.Operation == "delete_remap" {
			srcID, parseErr := uuid.Parse(meta.SourceID)
			if parseErr == nil {
				tx.Unscoped().Model(&NomenclatureNode{}).
					Where("id = ? AND tenant_id = ?", srcID, orgID).
					Update("deleted_at", nil)
			}
		}

		// Log the rollback itself
		uid := userID
		return writeAuditLog(tx, orgID, &uid, mergeAuditMeta{
			Operation:   "rollback",
			FromCode:    meta.ToCode,
			ToCode:      meta.FromCode,
			FromLabel:   meta.ToLabel,
			ToLabel:     meta.FromLabel,
			MarcheIDs:   meta.MarcheIDs,
			SourceID:    meta.SourceID,
			PerformedAt: time.Now().UTC(),
		})
	})

	if txErr != nil {
		c.JSON(500, models.Err("rollback failed: "+txErr.Error()))
		return
	}

	c.JSON(200, models.OK(gin.H{
		"reverted_to":     meta.FromCode,
		"marches_updated": restored,
	}))
}

// ── AuditHistory ──────────────────────────────────────────────────────────────

// AuditHistory returns the last N nomenclature propagation operations for the
// current org, ordered newest-first. Used to populate the history panel.
//
// GET /nomenclature/history?limit=20
func (h *Handler) AuditHistory(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	var entries []models.AuditLog
	h.db.WithContext(c.Request.Context()).
		Where("organization_id = ? AND action LIKE 'nomenclature.%'", orgID).
		Order("created_at DESC").
		Limit(30).
		Find(&entries)

	c.JSON(200, models.OK(entries))
}
