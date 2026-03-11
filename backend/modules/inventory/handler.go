package inventory

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListProducts(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var products []Product
	q := h.db.WithContext(c.Request.Context()).Where("tenant_id = ?", orgID)
	if search := c.Query("search"); search != "" {
		q = q.Where("name ILIKE ? OR sku ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if err := q.Order("name ASC").Find(&products).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch products"))
		return
	}
	c.JSON(200, models.OK(products))
}

func (h *Handler) CreateProduct(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var p Product
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	p.TenantID = orgID
	if err := h.db.WithContext(c.Request.Context()).Create(&p).Error; err != nil {
		c.JSON(500, models.Err("failed to create product"))
		return
	}
	c.JSON(201, models.OK(p))
}

func (h *Handler) GetProduct(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid product ID"))
		return
	}
	var p Product
	if err := h.db.WithContext(c.Request.Context()).Where("id = ? AND tenant_id = ?", id, orgID).First(&p).Error; err != nil {
		c.JSON(404, models.Err("product not found"))
		return
	}
	c.JSON(200, models.OK(p))
}

func (h *Handler) AddStockMovement(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)
	var mv StockMovement
	if err := c.ShouldBindJSON(&mv); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	mv.TenantID = orgID
	mv.CreatedBy = userID
	if err := h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&mv).Error; err != nil {
			return err
		}
		delta := mv.Quantity
		if mv.Type == "out" {
			delta = -delta
		}
		return tx.Model(&Product{}).Where("id = ?", mv.ProductID).
			UpdateColumn("stock", gorm.Expr("stock + ?", delta)).Error
	}); err != nil {
		c.JSON(500, models.Err("failed to record movement"))
		return
	}
	c.JSON(201, models.OK(mv))
}
