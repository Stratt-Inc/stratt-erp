package analytics

import (
	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// GET /api/v1/analytics/overview
func (h *Handler) Overview(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	var stats struct {
		TotalContacts  int64   `json:"total_contacts"`
		TotalLeads     int64   `json:"total_leads"`
		TotalDeals     int64   `json:"total_deals"`
		TotalRevenue   float64 `json:"total_revenue"`
		TotalInvoices  int64   `json:"total_invoices"`
		TotalEmployees int64   `json:"total_employees"`
		TotalProducts  int64   `json:"total_products"`
	}

	ctx := c.Request.Context()
	h.db.WithContext(ctx).Table("contacts").Where("tenant_id = ?", orgID).Count(&stats.TotalContacts)
	h.db.WithContext(ctx).Table("leads").Where("tenant_id = ?", orgID).Count(&stats.TotalLeads)
	h.db.WithContext(ctx).Table("deals").Where("tenant_id = ?", orgID).Count(&stats.TotalDeals)
	h.db.WithContext(ctx).Table("invoices").Where("tenant_id = ? AND status = 'paid'", orgID).Select("COALESCE(SUM(total), 0)").Scan(&stats.TotalRevenue)
	h.db.WithContext(ctx).Table("invoices").Where("tenant_id = ?", orgID).Count(&stats.TotalInvoices)
	h.db.WithContext(ctx).Table("employees").Where("tenant_id = ?", orgID).Count(&stats.TotalEmployees)
	h.db.WithContext(ctx).Table("products").Where("tenant_id = ?", orgID).Count(&stats.TotalProducts)

	c.JSON(200, models.OK(stats))
}
