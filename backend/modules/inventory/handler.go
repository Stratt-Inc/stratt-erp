package inventory

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListProducts(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var products []Product
	q := h.db.WithContext(c.Context()).Where("tenant_id = ?", orgID)
	if search := c.Query("search"); search != "" {
		q = q.Where("name ILIKE ? OR sku ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if err := q.Order("name ASC").Find(&products).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch products"))
	}
	return c.JSON(models.OK(products))
}

func (h *Handler) CreateProduct(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var p Product
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	p.TenantID = orgID
	if err := h.db.WithContext(c.Context()).Create(&p).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create product"))
	}
	return c.Status(201).JSON(models.OK(p))
}

func (h *Handler) GetProduct(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid product ID"))
	}
	var p Product
	if err := h.db.WithContext(c.Context()).Where("id = ? AND tenant_id = ?", id, orgID).First(&p).Error; err != nil {
		return c.Status(404).JSON(models.Err("product not found"))
	}
	return c.JSON(models.OK(p))
}

func (h *Handler) AddStockMovement(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)
	var mv StockMovement
	if err := c.BodyParser(&mv); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	mv.TenantID = orgID
	mv.CreatedBy = userID
	if err := h.db.WithContext(c.Context()).Transaction(func(tx *gorm.DB) error {
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
		return c.Status(500).JSON(models.Err("failed to record movement"))
	}
	return c.Status(201).JSON(models.OK(mv))
}
