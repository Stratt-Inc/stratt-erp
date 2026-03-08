package nomenclature

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) List(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var nodes []NomenclatureNode
	if err := h.db.WithContext(c.Context()).Where("tenant_id = ?", orgID).Order("code").Find(&nodes).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch nomenclature"))
	}
	return c.JSON(models.OK(nodes))
}

func (h *Handler) Create(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var node NomenclatureNode
	if err := c.BodyParser(&node); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	node.TenantID = orgID
	if err := h.db.WithContext(c.Context()).Create(&node).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create node"))
	}
	return c.Status(201).JSON(models.OK(node))
}

func (h *Handler) Update(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid id"))
	}
	var node NomenclatureNode
	if err := h.db.WithContext(c.Context()).Where("id = ? AND tenant_id = ?", id, orgID).First(&node).Error; err != nil {
		return c.Status(404).JSON(models.Err("node not found"))
	}
	savedID := node.ID
	savedTenantID := node.TenantID
	if err := c.BodyParser(&node); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	node.ID = savedID
	node.TenantID = savedTenantID
	if err := h.db.WithContext(c.Context()).Save(&node).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to update node"))
	}
	return c.JSON(models.OK(node))
}
