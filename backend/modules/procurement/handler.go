package procurement

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListOrders(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var orders []PurchaseOrder
	q := h.db.WithContext(c.Context()).Preload("Items").Where("tenant_id = ?", orgID)
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("created_at DESC").Find(&orders).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch orders"))
	}
	return c.JSON(models.OK(orders))
}

func (h *Handler) CreateOrder(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)
	var order PurchaseOrder
	if err := c.BodyParser(&order); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	order.TenantID = orgID
	order.CreatedBy = userID
	var subtotal float64
	for i := range order.Items {
		order.Items[i].Total = order.Items[i].Quantity * order.Items[i].UnitPrice
		subtotal += order.Items[i].Total
	}
	order.Subtotal = subtotal
	order.Total = subtotal + order.TaxAmount
	if err := h.db.WithContext(c.Context()).Create(&order).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create order"))
	}
	return c.Status(201).JSON(models.OK(order))
}

func (h *Handler) GetOrder(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid order ID"))
	}
	var order PurchaseOrder
	if err := h.db.WithContext(c.Context()).Preload("Items").Where("id = ? AND tenant_id = ?", id, orgID).First(&order).Error; err != nil {
		return c.Status(404).JSON(models.Err("order not found"))
	}
	return c.JSON(models.OK(order))
}
