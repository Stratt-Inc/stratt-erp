package billing

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListInvoices(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var invoices []Invoice
	q := h.db.WithContext(c.Context()).Preload("Items").Where("tenant_id = ?", orgID)
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("created_at DESC").Find(&invoices).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch invoices"))
	}
	return c.JSON(models.OK(invoices))
}

func (h *Handler) CreateInvoice(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)
	var inv Invoice
	if err := c.BodyParser(&inv); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	inv.TenantID = orgID
	inv.CreatedBy = userID
	// Compute totals
	var subtotal float64
	for i := range inv.Items {
		inv.Items[i].Total = inv.Items[i].Quantity * inv.Items[i].UnitPrice
		subtotal += inv.Items[i].Total
	}
	inv.Subtotal = subtotal
	inv.TaxAmount = subtotal * inv.TaxRate / 100
	inv.Total = subtotal + inv.TaxAmount
	if err := h.db.WithContext(c.Context()).Create(&inv).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create invoice"))
	}
	return c.Status(201).JSON(models.OK(inv))
}

func (h *Handler) GetInvoice(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid invoice ID"))
	}
	var inv Invoice
	if err := h.db.WithContext(c.Context()).Preload("Items").Where("id = ? AND tenant_id = ?", id, orgID).First(&inv).Error; err != nil {
		return c.Status(404).JSON(models.Err("invoice not found"))
	}
	return c.JSON(models.OK(inv))
}

func (h *Handler) UpdateInvoiceStatus(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid invoice ID"))
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	if err := h.db.WithContext(c.Context()).Model(&Invoice{}).
		Where("id = ? AND tenant_id = ?", id, orgID).
		Update("status", body.Status).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to update invoice"))
	}
	return c.JSON(models.Msg("invoice updated"))
}
