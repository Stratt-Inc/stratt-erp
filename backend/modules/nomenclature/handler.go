package nomenclature

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// List returns all nomenclature nodes enriched with real spend from marchés.
// Montant on each node is computed live from the marches table, not the stored
// seed value: leaf "code" nodes get the sum of matching marchés, parent nodes
// (famille, grande-famille) accumulate their children's montants bottom-up.
// Conforme is recomputed from the live montant vs seuil.
func (h *Handler) List(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	var nodes []NomenclatureNode
	if err := h.db.WithContext(ctx).
		Preload("Tags").
		Where("tenant_id = ?", orgID).
		Order("code").
		Find(&nodes).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch nomenclature"))
		return
	}

	// ── 1. Aggregate real spend from marchés by famille_code + categorie ────
	type spendRow struct {
		FamilleCode string
		Categorie   string
		Total       float64
	}
	var spendRows []spendRow
	h.db.WithContext(ctx).
		Table("marches").
		Select("famille_code, categorie, COALESCE(SUM(montant), 0) as total").
		Where("tenant_id = ? AND deleted_at IS NULL AND famille_code != ''", orgID).
		Group("famille_code, categorie").
		Scan(&spendRows)

	// Build a set of known nomenclature codes for prefix-normalisation.
	codeSet := make(map[string]bool, len(nodes))
	for _, n := range nodes {
		codeSet[n.Code] = true
	}

	// Resolve a marché famille_code → nomenclature code, handling the F/S prefix
	// that exists on fournitures/services nodes but not on the marché field.
	normCode := func(fc, categorie string) string {
		if codeSet[fc] {
			return fc
		}
		switch categorie {
		case "Fournitures":
			if codeSet["F"+fc] {
				return "F" + fc
			}
		case "Services":
			if codeSet["S"+fc] {
				return "S" + fc
			}
		}
		return fc
	}

	spendByCode := make(map[string]float64, len(spendRows))
	for _, r := range spendRows {
		spendByCode[normCode(r.FamilleCode, r.Categorie)] += r.Total
	}

	// ── 2. Assign montant to leaf nodes, zero out all others first ───────────
	nodeByID := make(map[uuid.UUID]*NomenclatureNode, len(nodes))
	for i := range nodes {
		nodeByID[nodes[i].ID] = &nodes[i]
		nodes[i].Montant = 0
	}
	for i := range nodes {
		if nodes[i].Type == "code" {
			nodes[i].Montant = spendByCode[nodes[i].Code]
		}
	}

	// ── 3. Aggregate bottom-up: famille ← sum(codes), grande-famille ← sum(familles)
	for _, parentType := range []string{"famille", "grande-famille"} {
		for i := range nodes {
			if nodes[i].Type != parentType {
				continue
			}
			var total float64
			for j := range nodes {
				if nodes[j].ParentID != nil && *nodes[j].ParentID == nodes[i].ID {
					total += nodes[j].Montant
				}
			}
			nodes[i].Montant = total
		}
	}

	// ── 4. Recompute conformité from live montant ────────────────────────────
	for i := range nodes {
		seuil := nodes[i].Seuil
		if seuil <= 0 {
			seuil = nodes[i].SeuilMapa
		}
		nodes[i].Conforme = nodes[i].Montant == 0 || seuil <= 0 || nodes[i].Montant <= seuil
	}

	c.JSON(200, models.OK(nodes))
}

// Search performs a full-text search on nomenclature labels and descriptions.
// Query param: q (required, min 2 chars)
// Optional: tag=Fournitures|Services|Travaux, type=famille|code
func (h *Handler) Search(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	q := strings.TrimSpace(c.Query("q"))
	if len(q) < 2 {
		c.JSON(400, models.Err("query must be at least 2 characters"))
		return
	}

	query := h.db.WithContext(c.Request.Context()).
		Preload("Tags").
		Where("tenant_id = ?", orgID).
		Where("label ILIKE ? OR description ILIKE ? OR code ILIKE ?",
			"%"+q+"%", "%"+q+"%", "%"+q+"%")

	if tag := c.Query("tag"); tag != "" {
		query = query.Where("tag = ?", tag)
	}
	if nodeType := c.Query("type"); nodeType != "" {
		query = query.Where("type = ?", nodeType)
	}

	var nodes []NomenclatureNode
	if err := query.Order("code").Limit(50).Find(&nodes).Error; err != nil {
		c.JSON(500, models.Err("search failed"))
		return
	}
	c.JSON(200, models.OK(nodes))
}

// Create adds a new nomenclature node for the current org.
func (h *Handler) Create(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var node NomenclatureNode
	if err := c.ShouldBindJSON(&node); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	node.TenantID = orgID
	node.IsNational = false
	if err := h.db.WithContext(c.Request.Context()).Create(&node).Error; err != nil {
		c.JSON(500, models.Err("failed to create node"))
		return
	}
	c.JSON(201, models.OK(node))
}

// Update modifies an existing nomenclature node (tenant-owned only).
func (h *Handler) Update(c *gin.Context) {
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
	savedID := node.ID
	savedTenantID := node.TenantID
	savedIsNational := node.IsNational
	if err := c.ShouldBindJSON(&node); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	node.ID = savedID
	node.TenantID = savedTenantID
	node.IsNational = savedIsNational
	if err := h.db.WithContext(c.Request.Context()).Save(&node).Error; err != nil {
		c.JSON(500, models.Err("failed to update node"))
		return
	}
	c.JSON(200, models.OK(node))
}

// Delete soft-deletes a nomenclature node. National nodes cannot be deleted.
func (h *Handler) Delete(c *gin.Context) {
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
	if node.IsNational {
		c.JSON(403, models.Err("cannot delete a national nomenclature entry"))
		return
	}
	if err := h.db.WithContext(c.Request.Context()).Delete(&node).Error; err != nil {
		c.JSON(500, models.Err("failed to delete node"))
		return
	}
	c.JSON(204, nil)
}

// ── Tags ──────────────────────────────────────────────────────────────────────

// ListTags returns all tags for the current org.
func (h *Handler) ListTags(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var tags []NomenclatureTag
	if err := h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("is_system DESC, name").
		Find(&tags).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch tags"))
		return
	}
	c.JSON(200, models.OK(tags))
}

// CreateTag creates a new custom tag for the current org.
func (h *Handler) CreateTag(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var tag NomenclatureTag
	if err := c.ShouldBindJSON(&tag); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	tag.TenantID = orgID
	tag.IsSystem = false
	if tag.Color == "" {
		tag.Color = "#6366f1"
	}
	if err := h.db.WithContext(c.Request.Context()).Create(&tag).Error; err != nil {
		c.JSON(500, models.Err("failed to create tag"))
		return
	}
	c.JSON(201, models.OK(tag))
}

// DeleteTag deletes a custom tag. System tags cannot be deleted.
func (h *Handler) DeleteTag(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		c.JSON(400, models.Err("invalid tag id"))
		return
	}
	var tag NomenclatureTag
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", id, orgID).
		First(&tag).Error; err != nil {
		c.JSON(404, models.Err("tag not found"))
		return
	}
	if tag.IsSystem {
		c.JSON(403, models.Err("cannot delete a system tag"))
		return
	}
	h.db.WithContext(c.Request.Context()).Delete(&tag)
	c.JSON(204, nil)
}

// AddTagToNode assigns a tag to a node.
func (h *Handler) AddTagToNode(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid node id"))
		return
	}
	tagID, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		c.JSON(400, models.Err("invalid tag id"))
		return
	}
	var node NomenclatureNode
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", nodeID, orgID).
		First(&node).Error; err != nil {
		c.JSON(404, models.Err("node not found"))
		return
	}
	var tag NomenclatureTag
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", tagID, orgID).
		First(&tag).Error; err != nil {
		c.JSON(404, models.Err("tag not found"))
		return
	}
	if err := h.db.WithContext(c.Request.Context()).
		Model(&node).Association("Tags").Append(&tag); err != nil {
		c.JSON(500, models.Err("failed to assign tag"))
		return
	}
	c.JSON(200, models.OK(tag))
}

// RemoveTagFromNode removes a tag from a node.
func (h *Handler) RemoveTagFromNode(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	nodeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid node id"))
		return
	}
	tagID, err := uuid.Parse(c.Param("tagId"))
	if err != nil {
		c.JSON(400, models.Err("invalid tag id"))
		return
	}
	var node NomenclatureNode
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", nodeID, orgID).
		First(&node).Error; err != nil {
		c.JSON(404, models.Err("node not found"))
		return
	}
	var tag NomenclatureTag
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", tagID, orgID).
		First(&tag).Error; err != nil {
		c.JSON(404, models.Err("tag not found"))
		return
	}
	h.db.WithContext(c.Request.Context()).Model(&node).Association("Tags").Delete(&tag)
	c.JSON(204, nil)
}
