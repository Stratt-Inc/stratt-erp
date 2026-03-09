package nomenclature

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) List(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var nodes []NomenclatureNode
	if err := h.db.WithContext(c.Request.Context()).Where("tenant_id = ?", orgID).Order("code").Find(&nodes).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch nomenclature"))
		return
	}
	c.JSON(200, models.OK(nodes))
}

func (h *Handler) Create(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var node NomenclatureNode
	if err := c.ShouldBindJSON(&node); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	node.TenantID = orgID
	if err := h.db.WithContext(c.Request.Context()).Create(&node).Error; err != nil {
		c.JSON(500, models.Err("failed to create node"))
		return
	}
	c.JSON(201, models.OK(node))
}

func (h *Handler) Update(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid id"))
		return
	}
	var node NomenclatureNode
	if err := h.db.WithContext(c.Request.Context()).Where("id = ? AND tenant_id = ?", id, orgID).First(&node).Error; err != nil {
		c.JSON(404, models.Err("node not found"))
		return
	}
	savedID := node.ID
	savedTenantID := node.TenantID
	if err := c.ShouldBindJSON(&node); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	node.ID = savedID
	node.TenantID = savedTenantID
	if err := h.db.WithContext(c.Request.Context()).Save(&node).Error; err != nil {
		c.JSON(500, models.Err("failed to update node"))
		return
	}
	c.JSON(200, models.OK(node))
}
