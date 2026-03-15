package analytics

import (
	"sort"
	"strconv"

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

// ABCRow is one item in the ABC classification result.
type ABCRow struct {
	Label      string  `json:"label"`
	Total      float64 `json:"total"`
	Rank       int     `json:"rank"`
	Share      float64 `json:"share"`      // % de la dépense totale
	Cumulative float64 `json:"cumulative"` // % cumulé
	Class      string  `json:"class"`      // A, B ou C
}

// GET /api/v1/analytics/abc?dimension=supplier|category&threshold_a=80&threshold_b=95
func (h *Handler) ABC(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	dimension := c.DefaultQuery("dimension", "supplier")

	thresholdA := parseFloat(c.DefaultQuery("threshold_a", "80"), 80)
	thresholdB := parseFloat(c.DefaultQuery("threshold_b", "95"), 95)
	if thresholdA <= 0 || thresholdA >= 100 {
		thresholdA = 80
	}
	if thresholdB <= thresholdA || thresholdB >= 100 {
		thresholdB = 95
	}

	type row struct {
		Label string
		Total float64
	}
	var rows []row
	ctx := c.Request.Context()

	switch dimension {
	case "supplier":
		type agg struct {
			SupplierName string  `gorm:"column:supplier_name"`
			Total        float64 `gorm:"column:total"`
		}
		var aggs []agg
		h.db.WithContext(ctx).Raw(`
			SELECT
				COALESCE(NULLIF(TRIM(c.company),''), c.first_name || ' ' || c.last_name, 'Fournisseur inconnu') AS supplier_name,
				COALESCE(SUM(po.total), 0) AS total
			FROM purchase_orders po
			LEFT JOIN contacts c ON c.id = po.supplier_id
			WHERE po.tenant_id = ? AND po.status != 'cancelled'
			GROUP BY supplier_name
			ORDER BY total DESC`, orgID).Scan(&aggs)
		for _, a := range aggs {
			rows = append(rows, row{Label: a.SupplierName, Total: a.Total})
		}
	case "category":
		type agg struct {
			Description string  `gorm:"column:description"`
			Total       float64 `gorm:"column:total"`
		}
		var aggs []agg
		h.db.WithContext(ctx).Raw(`
			SELECT
				COALESCE(NULLIF(TRIM(poi.description),''), 'Non catégorisé') AS description,
				COALESCE(SUM(poi.total), 0) AS total
			FROM purchase_order_items poi
			JOIN purchase_orders po ON po.id = poi.order_id
			WHERE po.tenant_id = ? AND po.status != 'cancelled'
			GROUP BY description
			ORDER BY total DESC`, orgID).Scan(&aggs)
		for _, a := range aggs {
			rows = append(rows, row{Label: a.Description, Total: a.Total})
		}
	default:
		c.JSON(400, models.Err("dimension invalide : supplier ou category"))
		return
	}

	sort.Slice(rows, func(i, j int) bool { return rows[i].Total > rows[j].Total })

	var totalSpend float64
	for _, r := range rows {
		totalSpend += r.Total
	}

	result := gin.H{
		"dimension":   dimension,
		"total_spend": totalSpend,
		"threshold_a": thresholdA,
		"threshold_b": thresholdB,
	}

	var abcRows []ABCRow
	var cumulative float64
	for i, r := range rows {
		share := 0.0
		if totalSpend > 0 {
			share = (r.Total / totalSpend) * 100
		}
		cumulative += share
		class := "C"
		if cumulative-share < thresholdA {
			class = "A"
		} else if cumulative-share < thresholdB {
			class = "B"
		}
		abcRows = append(abcRows, ABCRow{
			Label: r.Label, Total: r.Total, Rank: i + 1,
			Share: share, Cumulative: cumulative, Class: class,
		})
	}
	result["rows"] = abcRows

	c.JSON(200, models.OK(result))
}

func parseFloat(s string, def float64) float64 {
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return def
	}
	return v
}
