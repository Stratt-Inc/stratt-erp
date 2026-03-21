package marches

import (
	"math"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
)

// Taux d'intérêt moratoires en vigueur (Décret n°2013-269)
const tauxMoratoiresAnnuel = 0.1725 // 17.25 % au 1er semestre 2026 (BCE + 8 pts + indemnité forfaitaire)

type DelaiAlert struct {
	MarcheID   string  `json:"marche_id"`
	Reference  string  `json:"reference"`
	Objet      string  `json:"objet"`
	Service    string  `json:"service"`
	Montant    float64 `json:"montant"`
	Type       string  `json:"type"`       // "echeance" | "attribution" | "fin" | "paiement"
	Label      string  `json:"label"`      // human-readable
	DueDate    string  `json:"due_date"`   // RFC3339
	JoursRest  int     `json:"jours_rest"` // negative = already past
	Urgence    string  `json:"urgence"`    // "critique" | "haute" | "moyenne" | "faible"
	InteretsMo float64 `json:"interets_moratoires,omitempty"` // only for paiement alerts
}

type AlertesDashboard struct {
	TotalAlertes int          `json:"total_alertes"`
	Critiques    int          `json:"critiques"`
	Hautes       int          `json:"hautes"`
	Moyennes     int          `json:"moyennes"`
	Alertes      []DelaiAlert `json:"alertes"`
}

// GET /marches/alertes/dashboard?days=60
// Returns rich alertes dashboard with urgency classification and intérêts moratoires.
func (h *Handler) AlertesDashboard(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	days := parseInt(c.DefaultQuery("days", "60"), 60)
	if days < 7 || days > 365 {
		days = 60
	}

	horizon := time.Now().AddDate(0, 0, days)
	now := time.Now()
	// Include overdue up to 365 days in the past
	past := now.AddDate(0, 0, -365)

	var marches []Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ? AND statut NOT IN ('annule')", orgID).
		Where(
			`(date_attribution >= ? AND date_attribution <= ?) OR
			 (date_fin >= ? AND date_fin <= ?) OR
			 (echeance != '' AND echeance IS NOT NULL)`,
			past, horizon,
			past, horizon,
		).
		Find(&marches)

	var alerts []DelaiAlert
	for _, m := range marches {
		// Date attribution alert
		if m.DateAttribution != nil {
			days := daysUntil(*m.DateAttribution, now)
			if days <= 60 {
				alerts = append(alerts, DelaiAlert{
					MarcheID:  m.ID.String(),
					Reference: m.Reference,
					Objet:     truncate(m.Objet, 60),
					Service:   m.Service,
					Montant:   m.Montant,
					Type:      "attribution",
					Label:     "Date d'attribution",
					DueDate:   m.DateAttribution.Format(time.RFC3339),
					JoursRest: days,
					Urgence:   urgence(days),
				})
			}
		}
		// Date fin / échéance de contrat
		if m.DateFin != nil {
			days := daysUntil(*m.DateFin, now)
			if days <= 90 {
				alerts = append(alerts, DelaiAlert{
					MarcheID:  m.ID.String(),
					Reference: m.Reference,
					Objet:     truncate(m.Objet, 60),
					Service:   m.Service,
					Montant:   m.Montant,
					Type:      "fin",
					Label:     "Fin de contrat",
					DueDate:   m.DateFin.Format(time.RFC3339),
					JoursRest: days,
					Urgence:   urgence(days),
				})
			}
		}
		// Délai de paiement réglementaire (30 jours — Code de la commande publique L2192-12)
		// We use date_attribution as "date de service fait" approximation.
		if m.DateAttribution != nil && m.Montant > 0 && m.Statut != "termine" {
			payDue := m.DateAttribution.AddDate(0, 0, 30)
			daysLate := daysUntil(payDue, now)
			if daysLate <= 30 { // warn J-30 before due, or if already overdue
				interets := 0.0
				if daysLate < 0 { // overdue
					overdueDays := -daysLate
					interets = m.Montant * tauxMoratoiresAnnuel * float64(overdueDays) / 365
					interets = math.Round(interets*100) / 100
				}
				alerts = append(alerts, DelaiAlert{
					MarcheID:   m.ID.String(),
					Reference:  m.Reference,
					Objet:      truncate(m.Objet, 60),
					Service:    m.Service,
					Montant:    m.Montant,
					Type:       "paiement",
					Label:      "Délai de paiement 30j",
					DueDate:    payDue.Format(time.RFC3339),
					JoursRest:  daysLate,
					Urgence:    urgence(daysLate),
					InteretsMo: interets,
				})
			}
		}
	}

	// Sort: most urgent first (most negative jours_rest = already past = most urgent)
	sortAlerts(alerts)

	var critiques, hautes, moyennes int
	for _, a := range alerts {
		switch a.Urgence {
		case "critique":
			critiques++
		case "haute":
			hautes++
		case "moyenne":
			moyennes++
		}
	}

	c.JSON(200, models.OK(AlertesDashboard{
		TotalAlertes: len(alerts),
		Critiques:    critiques,
		Hautes:       hautes,
		Moyennes:     moyennes,
		Alertes:      alerts,
	}))
}

func daysUntil(target, now time.Time) int {
	diff := target.Sub(now)
	return int(diff.Hours() / 24)
}

func urgence(jours int) string {
	switch {
	case jours < 0:
		return "critique" // already past
	case jours <= 5:
		return "critique"
	case jours <= 10:
		return "haute"
	case jours <= 30:
		return "moyenne"
	default:
		return "faible"
	}
}

func sortAlerts(a []DelaiAlert) {
	// Simple insertion sort — alertes are typically small
	for i := 1; i < len(a); i++ {
		key := a[i]
		j := i - 1
		for j >= 0 && a[j].JoursRest > key.JoursRest {
			a[j+1] = a[j]
			j--
		}
		a[j+1] = key
	}
}
