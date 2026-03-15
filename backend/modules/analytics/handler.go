package analytics

import (
	"sort"

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

// ABCRow représente une ligne du classement ABC.
type ABCRow struct {
	Label      string  `json:"label"`
	Total      float64 `json:"total"`
	Rank       int     `json:"rank"`
	Share      float64 `json:"share"`       // % de la dépense totale
	Cumulative float64 `json:"cumulative"`  // % cumulé
	Class      string  `json:"class"`       // A, B ou C
}

// ABCResult est la réponse complète de l'endpoint ABC.
type ABCResult struct {
	Dimension   string   `json:"dimension"`
	TotalSpend  float64  `json:"total_spend"`
	ThresholdA  float64  `json:"threshold_a"`
	ThresholdB  float64  `json:"threshold_b"`
	Rows        []ABCRow `json:"rows"`
}

// GET /api/v1/analytics/abc?dimension=supplier&period=12m
// Dimensions supportées : supplier (fournisseur), category (famille d'achat)
func (h *Handler) ABC(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	dimension := c.Query("dimension", "supplier")

	// Seuils paramétrables (défaut : A=80%, B=15%, C=5%)
	thresholdA := 80.0
	thresholdB := 95.0 // A+B cumulé
	if a := c.QueryFloat("threshold_a", 80); a > 0 && a < 100 {
		thresholdA = a
	}
	if b := c.QueryFloat("threshold_b", 95); b > thresholdA && b < 100 {
		thresholdB = b
	}

	type row struct {
		Label string
		Total float64
	}
	var rows []row

	ctx := c.Context()

	switch dimension {
	case "supplier":
		// Agrégation par fournisseur (supplier_id ou supplier_name)
		type supplierAgg struct {
			SupplierID   *string `gorm:"column:supplier_id"`
			SupplierName string  `gorm:"column:supplier_name"`
			Total        float64 `gorm:"column:total"`
		}
		var aggs []supplierAgg
		h.db.WithContext(ctx).
			Raw(`SELECT
				po.supplier_id::text AS supplier_id,
				COALESCE(c.company, c.first_name || ' ' || c.last_name, 'Fournisseur inconnu') AS supplier_name,
				COALESCE(SUM(po.total), 0) AS total
			FROM purchase_orders po
			LEFT JOIN contacts c ON c.id = po.supplier_id
			WHERE po.tenant_id = ? AND po.status != 'cancelled'
			GROUP BY po.supplier_id, supplier_name
			ORDER BY total DESC`, orgID).
			Scan(&aggs)
		for _, a := range aggs {
			label := a.SupplierName
			if label == "" {
				label = "Fournisseur inconnu"
			}
			rows = append(rows, row{Label: label, Total: a.Total})
		}

	case "category":
		// Agrégation par description des lignes de commande (famille)
		type catAgg struct {
			Description string  `gorm:"column:description"`
			Total       float64 `gorm:"column:total"`
		}
		var aggs []catAgg
		h.db.WithContext(ctx).
			Raw(`SELECT
				COALESCE(NULLIF(TRIM(poi.description), ''), 'Non catégorisé') AS description,
				COALESCE(SUM(poi.total), 0) AS total
			FROM purchase_order_items poi
			JOIN purchase_orders po ON po.id = poi.order_id
			WHERE po.tenant_id = ? AND po.status != 'cancelled'
			GROUP BY description
			ORDER BY total DESC`, orgID).
			Scan(&aggs)
		for _, a := range aggs {
			rows = append(rows, row{Label: a.Description, Total: a.Total})
		}

	default:
		return c.Status(400).JSON(models.Err("dimension invalide : supplier ou category"))
	}

	// Calcul ABC
	sort.Slice(rows, func(i, j int) bool { return rows[i].Total > rows[j].Total })

	var totalSpend float64
	for _, r := range rows {
		totalSpend += r.Total
	}

	result := ABCResult{
		Dimension:  dimension,
		TotalSpend: totalSpend,
		ThresholdA: thresholdA,
		ThresholdB: thresholdB,
	}

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

		result.Rows = append(result.Rows, ABCRow{
			Label:      r.Label,
			Total:      r.Total,
			Rank:       i + 1,
			Share:      share,
			Cumulative: cumulative,
			Class:      class,
		})
	}

	return c.JSON(models.OK(result))
}
