package nomenclature

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
)

// orphanResult describes a node that has no associated marchés on the current exercise.
type orphanResult struct {
	NomenclatureNode
	// LastUsedYear is the last year a marché referenced this node (0 = never used).
	LastUsedYear int `json:"last_used_year"`
}

// orphanReport summarises the outcome of a bulk delete/archive operation.
type orphanReport struct {
	Before   int      `json:"before"`   // total orphan nodes before operation
	After    int      `json:"after"`    // total orphan nodes remaining after operation
	Affected int      `json:"affected"` // nodes actually modified
	IDs      []string `json:"ids"`      // affected IDs
}

// ListOrphans returns nomenclature nodes that have zero associated mandats on the
// current exercise (current calendar year). Includes both famille and code nodes.
//
// GET /nomenclature/orphans?year=2024
func (h *Handler) ListOrphans(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	exercise := time.Now().Year()
	if y := c.Query("year"); y != "" {
		var yr int
		if _, err := parseIntStrict(y, &yr); err == nil && yr > 2000 && yr < 2100 {
			exercise = yr
		}
	}

	// 1. Load all nodes for this org.
	var nodes []NomenclatureNode
	if err := h.db.WithContext(ctx).
		Where("tenant_id = ? AND is_archived = false", orgID).
		Order("code").
		Find(&nodes).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch nomenclature"))
		return
	}

	// 2. Aggregate spend per famille_code for the requested exercise.
	type spendRow struct {
		FamilleCode string
		Total       float64
		MaxYear     int
	}
	var spendRows []spendRow
	h.db.WithContext(ctx).
		Table("marches").
		Select("famille_code, COALESCE(SUM(montant),0) as total, MAX(EXTRACT(YEAR FROM date_notification)::int) as max_year").
		Where("tenant_id = ? AND deleted_at IS NULL AND famille_code != '' AND EXTRACT(YEAR FROM date_notification) = ?",
			orgID, exercise).
		Group("famille_code").
		Scan(&spendRows)

	spendByCode := make(map[string]float64, len(spendRows))
	lastYearByCode := make(map[string]int, len(spendRows))
	for _, r := range spendRows {
		spendByCode[r.FamilleCode] = r.Total
		lastYearByCode[r.FamilleCode] = r.MaxYear
	}

	// Also fetch last_used_year regardless of exercise filter.
	type lastRow struct {
		FamilleCode string
		MaxYear     int
	}
	var lastRows []lastRow
	h.db.WithContext(ctx).
		Table("marches").
		Select("famille_code, MAX(EXTRACT(YEAR FROM date_notification)::int) as max_year").
		Where("tenant_id = ? AND deleted_at IS NULL AND famille_code != ''", orgID).
		Group("famille_code").
		Scan(&lastRows)
	lastUsed := make(map[string]int, len(lastRows))
	for _, r := range lastRows {
		lastUsed[r.FamilleCode] = r.MaxYear
	}

	// 3. Build a set of famille codes that have spend on the exercise.
	usedFamilles := make(map[string]bool, len(spendByCode))
	for code, total := range spendByCode {
		if total > 0 {
			usedFamilles[code] = true
		}
	}

	// 4. Mark famille nodes as orphan when unused; code nodes orphan when their
	//    parent famille is also orphan.
	byID := make(map[string]*NomenclatureNode, len(nodes))
	for i := range nodes {
		byID[nodes[i].ID.String()] = &nodes[i]
	}

	familleOrphan := make(map[string]bool) // familleID → orphan?
	for i := range nodes {
		if nodes[i].Type == "famille" && !usedFamilles[nodes[i].Code] {
			familleOrphan[nodes[i].ID.String()] = true
		}
	}

	var orphans []orphanResult
	for i := range nodes {
		n := &nodes[i]
		isOrphan := false
		switch n.Type {
		case "famille":
			isOrphan = familleOrphan[n.ID.String()]
		case "code":
			if n.ParentID != nil && familleOrphan[n.ParentID.String()] {
				isOrphan = true
			}
		case "grande-famille":
			// Orphan if ALL its famille children are orphan
			allOrphan := true
			hasChildren := false
			for j := range nodes {
				if nodes[j].Type == "famille" && nodes[j].ParentID != nil && *nodes[j].ParentID == n.ID {
					hasChildren = true
					if !familleOrphan[nodes[j].ID.String()] {
						allOrphan = false
						break
					}
				}
			}
			isOrphan = hasChildren && allOrphan
		}

		if isOrphan {
			lastYear := 0
			if n.Type == "famille" {
				lastYear = lastUsed[n.Code]
			}
			orphans = append(orphans, orphanResult{
				NomenclatureNode: *n,
				LastUsedYear:     lastYear,
			})
		}
	}

	if orphans == nil {
		orphans = []orphanResult{}
	}

	c.JSON(200, models.OK(gin.H{
		"nodes":    orphans,
		"exercise": exercise,
		"total":    len(orphans),
	}))
}

// BulkDeleteOrphans soft-deletes a list of orphan nodes (national nodes protected).
//
// POST /nomenclature/orphans/delete
// Body: { "ids": ["uuid", ...] }
func (h *Handler) BulkDeleteOrphans(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	var body struct {
		IDs []string `json:"ids" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("ids required"))
		return
	}

	ids := parseUUIDs(body.IDs)
	if len(ids) == 0 {
		c.JSON(400, models.Err("no valid UUIDs provided"))
		return
	}

	// Count orphans before
	var before int64
	h.db.WithContext(ctx).Model(&NomenclatureNode{}).
		Where("tenant_id = ? AND is_archived = false", orgID).Count(&before)

	// Fetch nodes to validate (must belong to org, not national)
	var nodes []NomenclatureNode
	if err := h.db.WithContext(ctx).
		Where("id IN ? AND tenant_id = ? AND is_national = false", ids, orgID).
		Find(&nodes).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch nodes"))
		return
	}

	if len(nodes) == 0 {
		c.JSON(404, models.Err("no eligible nodes found"))
		return
	}

	// Soft-delete
	var affectedIDs []string
	tx := h.db.WithContext(ctx).Begin()
	for i := range nodes {
		if err := tx.Delete(&nodes[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(500, models.Err("delete failed"))
			return
		}
		affectedIDs = append(affectedIDs, nodes[i].ID.String())
	}
	if err := tx.Commit().Error; err != nil {
		c.JSON(500, models.Err("commit failed"))
		return
	}

	// Count orphans after
	var after int64
	h.db.WithContext(ctx).Model(&NomenclatureNode{}).
		Where("tenant_id = ? AND is_archived = false", orgID).Count(&after)

	c.JSON(200, models.OK(orphanReport{
		Before:   int(before),
		After:    int(after),
		Affected: len(affectedIDs),
		IDs:      affectedIDs,
	}))
}

// BulkArchiveOrphans marks nodes as archived (is_archived=true) without soft-deleting.
// Archived nodes are hidden from the main tree but can be restored.
//
// POST /nomenclature/orphans/archive
// Body: { "ids": ["uuid", ...] }
func (h *Handler) BulkArchiveOrphans(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	var body struct {
		IDs []string `json:"ids" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("ids required"))
		return
	}

	ids := parseUUIDs(body.IDs)
	if len(ids) == 0 {
		c.JSON(400, models.Err("no valid UUIDs provided"))
		return
	}

	// Count before
	var before int64
	h.db.WithContext(ctx).Model(&NomenclatureNode{}).
		Where("tenant_id = ? AND is_archived = false", orgID).Count(&before)

	result := h.db.WithContext(ctx).
		Model(&NomenclatureNode{}).
		Where("id IN ? AND tenant_id = ? AND is_national = false", ids, orgID).
		Update("is_archived", true)
	if result.Error != nil {
		c.JSON(500, models.Err("archive failed"))
		return
	}

	// Count after
	var after int64
	h.db.WithContext(ctx).Model(&NomenclatureNode{}).
		Where("tenant_id = ? AND is_archived = false", orgID).Count(&after)

	c.JSON(200, models.OK(orphanReport{
		Before:   int(before),
		After:    int(after),
		Affected: int(result.RowsAffected),
		IDs:      body.IDs,
	}))
}

// RestoreArchived un-archives previously archived nodes.
//
// POST /nomenclature/orphans/restore
// Body: { "ids": ["uuid", ...] }
func (h *Handler) RestoreArchived(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	var body struct {
		IDs []string `json:"ids" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("ids required"))
		return
	}

	ids := parseUUIDs(body.IDs)
	if len(ids) == 0 {
		c.JSON(400, models.Err("no valid UUIDs provided"))
		return
	}

	result := h.db.WithContext(ctx).
		Model(&NomenclatureNode{}).
		Where("id IN ? AND tenant_id = ?", ids, orgID).
		Update("is_archived", false)
	if result.Error != nil {
		c.JSON(500, models.Err("restore failed"))
		return
	}

	c.JSON(200, models.OK(gin.H{"restored": result.RowsAffected}))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func parseUUIDs(strs []string) []uuid.UUID {
	out := make([]uuid.UUID, 0, len(strs))
	for _, s := range strs {
		if id, err := uuid.Parse(s); err == nil {
			out = append(out, id)
		}
	}
	return out
}

// parseIntStrict parses a string into an int pointer, returning an error on failure.
func parseIntStrict(s string, out *int) (int, error) {
	n := 0
	for _, ch := range s {
		if ch < '0' || ch > '9' {
			return 0, &parseError{s}
		}
		n = n*10 + int(ch-'0')
	}
	*out = n
	return n, nil
}

type parseError struct{ s string }

func (e *parseError) Error() string { return "not a number: " + e.s }
