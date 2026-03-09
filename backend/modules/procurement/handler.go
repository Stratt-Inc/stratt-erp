package procurement

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
