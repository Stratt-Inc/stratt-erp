package procurement

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListOrders(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var orders []PurchaseOrder
	q := h.db.WithContext(c.Request.Context()).Preload("Items").Where("tenant_id = ?", orgID)
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("created_at DESC").Find(&orders).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch orders"))
		return
	}
	c.JSON(200, models.OK(orders))
}

func (h *Handler) CreateOrder(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)
	var order PurchaseOrder
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
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
	if err := h.db.WithContext(c.Request.Context()).Create(&order).Error; err != nil {
		c.JSON(500, models.Err("failed to create order"))
		return
	}
	c.JSON(201, models.OK(order))
}

func (h *Handler) GetOrder(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid order ID"))
		return
	}
	var order PurchaseOrder
	if err := h.db.WithContext(c.Request.Context()).Preload("Items").Where("id = ? AND tenant_id = ?", id, orgID).First(&order).Error; err != nil {
		c.JSON(404, models.Err("order not found"))
		return
	}
	c.JSON(200, models.OK(order))
}

// Compliance returns supplier-level spend aggregation with CCP risk assessment.
// GET /api/v1/procurement/compliance
func (h *Handler) Compliance(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	type rawRow struct {
		SupplierID   *uuid.UUID
		SupplierName string
		OrderCount   int
		Cumul        float64
	}
	var rows []rawRow
	h.db.WithContext(ctx).
		Table("purchase_orders po").
		Select(`po.supplier_id,
			COALESCE(NULLIF(c.company, ''), c.first_name || ' ' || c.last_name, 'Fournisseur inconnu') AS supplier_name,
			COUNT(po.id) AS order_count,
			SUM(po.total) AS cumul`).
		Joins("LEFT JOIN contacts c ON c.id = po.supplier_id AND c.deleted_at IS NULL").
		Where("po.tenant_id = ? AND po.deleted_at IS NULL AND po.supplier_id IS NOT NULL", orgID).
		Group("po.supplier_id, c.company, c.first_name, c.last_name").
		Order("cumul DESC").
		Scan(&rows)

	type Result struct {
		SupplierID *uuid.UUID `json:"supplier_id"`
		Name       string     `json:"name"`
		OrderCount int        `json:"order_count"`
		Cumul      float64    `json:"cumul"`
		Risk       string     `json:"risk"` // critical | high | medium | low
		Alerts     []string   `json:"alerts"`
	}

	results := make([]Result, 0, len(rows))
	for _, r := range rows {
		risk := "low"
		alerts := []string{}
		pct := r.Cumul / 215_000 * 100
		switch {
		case r.Cumul >= 215_000:
			risk = "critical"
			alerts = append(alerts, fmt.Sprintf("Seuil AO dépassé (%.0f k€) — publication BOAMP requise", r.Cumul/1000))
		case r.Cumul >= 90_000:
			risk = "high"
			alerts = append(alerts, fmt.Sprintf("Seuil MAPA+ dépassé (%.0f k€) — AO requis si même objet", r.Cumul/1000))
		case r.Cumul >= 60_000:
			risk = "medium"
			alerts = append(alerts, fmt.Sprintf("Proche du seuil MAPA+ — %.0f %% du seuil de 215 k€ atteint", pct))
		}
		results = append(results, Result{
			SupplierID: r.SupplierID,
			Name:       r.SupplierName,
			OrderCount: r.OrderCount,
			Cumul:      r.Cumul,
			Risk:       risk,
			Alerts:     alerts,
		})
	}
	c.JSON(200, models.OK(results))
}
