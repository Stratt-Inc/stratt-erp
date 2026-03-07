package analytics

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// GET /api/v1/analytics/overview
func (h *Handler) Overview(c *fiber.Ctx) error {
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

	h.db.WithContext(c.Context()).Table("contacts").Where("tenant_id = ?", orgID).Count(&stats.TotalContacts)
	h.db.WithContext(c.Context()).Table("leads").Where("tenant_id = ?", orgID).Count(&stats.TotalLeads)
	h.db.WithContext(c.Context()).Table("deals").Where("tenant_id = ?", orgID).Count(&stats.TotalDeals)
	h.db.WithContext(c.Context()).Table("invoices").Where("tenant_id = ? AND status = 'paid'", orgID).Select("COALESCE(SUM(total), 0)").Scan(&stats.TotalRevenue)
	h.db.WithContext(c.Context()).Table("invoices").Where("tenant_id = ?", orgID).Count(&stats.TotalInvoices)
	h.db.WithContext(c.Context()).Table("employees").Where("tenant_id = ?", orgID).Count(&stats.TotalEmployees)
	h.db.WithContext(c.Context()).Table("products").Where("tenant_id = ?", orgID).Count(&stats.TotalProducts)

	return c.JSON(models.OK(stats))
}
