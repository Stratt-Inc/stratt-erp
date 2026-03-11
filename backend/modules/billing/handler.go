package billing

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListInvoices(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var invoices []Invoice
	q := h.db.WithContext(c.Request.Context()).Preload("Items").Where("tenant_id = ?", orgID)
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("created_at DESC").Find(&invoices).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch invoices"))
		return
	}
	c.JSON(200, models.OK(invoices))
}

func (h *Handler) CreateInvoice(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)
	var inv Invoice
	if err := c.ShouldBindJSON(&inv); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
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
	if err := h.db.WithContext(c.Request.Context()).Create(&inv).Error; err != nil {
		c.JSON(500, models.Err("failed to create invoice"))
		return
	}
	c.JSON(201, models.OK(inv))
}

func (h *Handler) GetInvoice(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid invoice ID"))
		return
	}
	var inv Invoice
	if err := h.db.WithContext(c.Request.Context()).Preload("Items").Where("id = ? AND tenant_id = ?", id, orgID).First(&inv).Error; err != nil {
		c.JSON(404, models.Err("invoice not found"))
		return
	}
	c.JSON(200, models.OK(inv))
}

func (h *Handler) UpdateInvoiceStatus(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid invoice ID"))
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	if err := h.db.WithContext(c.Request.Context()).Model(&Invoice{}).
		Where("id = ? AND tenant_id = ?", id, orgID).
		Update("status", body.Status).Error; err != nil {
		c.JSON(500, models.Err("failed to update invoice"))
		return
	}
	c.JSON(200, models.Msg("invoice updated"))
}
