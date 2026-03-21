package marches

import (
	"bytes"
	"fmt"
	"html/template"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
)

// ── Rapport data structures ────────────────────────────────────────────────────

type rapportStat struct {
	Label   string
	Value   float64
	Count   int
	Pct     float64 // 0–100
	Color   string
}

type abcEntry struct {
	Reference string
	Objet     string
	Service   string
	Montant   float64
	Cumul     float64
	CumulPct  float64
	Classe    string // A, B, C
}

type recommandation struct {
	Type    string // risque | info | ok
	Titre   string
	Detail  string
}

type rapportData struct {
	Version     string // direction | technique
	Year        int
	GeneratedAt string
	// Agrégats
	TotalMontant   float64
	TotalMarches   int
	TotalServices  int
	AvgMontant     float64
	// Statuts
	Statuts     []rapportStat
	// Services
	Services    []rapportStat
	ServiceMax  float64
	// Procédures
	Procedures  []rapportStat
	// ABC
	ABCRows     []abcEntry
	ABCMax      float64
	// N vs N-1
	HasCompar   bool
	YearN1      int
	TotalN1     float64
	DeltaPct    float64
	DeltaUp     bool
	// Recommandations
	Recommandations []recommandation
}

// Rapport generates a print-ready multi-page HTML analytical report.
//
// GET /marches/rapport?year=2026&version=direction|technique
func (h *Handler) Rapport(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	now := time.Now()
	year := parseInt(c.DefaultQuery("year", strconv.Itoa(now.Year())), now.Year())
	version := c.DefaultQuery("version", "technique") // direction | technique

	// ── 1. Load marchés for year N ────────────────────────────────────────────
	var marchesN []Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ? AND deleted_at IS NULL", orgID).
		Where(`EXTRACT(YEAR FROM COALESCE(date_attribution, date_lancement, created_at)) = ?`, year).
		Order("montant DESC").
		Find(&marchesN)

	// ── 2. Load marchés for year N-1 for comparison ───────────────────────────
	var marchesN1 []Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ? AND deleted_at IS NULL", orgID).
		Where(`EXTRACT(YEAR FROM COALESCE(date_attribution, date_lancement, created_at)) = ?`, year-1).
		Find(&marchesN1)

	// ── 3. Aggregations ───────────────────────────────────────────────────────
	var totalN, totalN1 float64
	for _, m := range marchesN {
		totalN += m.Montant
	}
	for _, m := range marchesN1 {
		totalN1 += m.Montant
	}

	// Services breakdown
	serviceAgg := map[string]struct{ total float64; count int }{}
	for _, m := range marchesN {
		svc := strings.TrimSpace(m.Service)
		if svc == "" {
			svc = "Non renseigné"
		}
		e := serviceAgg[svc]
		e.total += m.Montant
		e.count++
		serviceAgg[svc] = e
	}
	var services []rapportStat
	for label, agg := range serviceAgg {
		pct := 0.0
		if totalN > 0 {
			pct = agg.total / totalN * 100
		}
		color := serviceColor(label)
		services = append(services, rapportStat{Label: label, Value: agg.total, Count: agg.count, Pct: pct, Color: color})
	}
	sort.Slice(services, func(i, j int) bool { return services[i].Value > services[j].Value })
	serviceMax := 0.0
	if len(services) > 0 {
		serviceMax = services[0].Value
	}

	// Statuts breakdown
	statutAgg := map[string]struct{ total float64; count int }{}
	for _, m := range marchesN {
		statutAgg[m.Statut] = struct{ total float64; count int }{
			total: statutAgg[m.Statut].total + m.Montant,
			count: statutAgg[m.Statut].count + 1,
		}
	}
	var statuts []rapportStat
	for label, agg := range statutAgg {
		pct := 0.0
		if len(marchesN) > 0 {
			pct = float64(agg.count) / float64(len(marchesN)) * 100
		}
		statuts = append(statuts, rapportStat{Label: statutLabel(label), Value: agg.total, Count: agg.count, Pct: pct, Color: statutColor(label)})
	}
	sort.Slice(statuts, func(i, j int) bool { return statuts[i].Count > statuts[j].Count })

	// Procédures breakdown
	procAgg := map[string]struct{ total float64; count int }{}
	for _, m := range marchesN {
		proc := strings.TrimSpace(m.Procedure)
		if proc == "" {
			proc = "Non renseignée"
		}
		e := procAgg[proc]
		e.total += m.Montant
		e.count++
		procAgg[proc] = e
	}
	var procedures []rapportStat
	for label, agg := range procAgg {
		pct := 0.0
		if len(marchesN) > 0 {
			pct = float64(agg.count) / float64(len(marchesN)) * 100
		}
		procedures = append(procedures, rapportStat{Label: label, Value: agg.total, Count: agg.count, Pct: pct, Color: procColor(label)})
	}
	sort.Slice(procedures, func(i, j int) bool { return procedures[i].Value > procedures[j].Value })

	// ── 4. ABC Analysis ───────────────────────────────────────────────────────
	sorted := make([]Marche, len(marchesN))
	copy(sorted, marchesN)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Montant > sorted[j].Montant })
	abcMax := 0.0
	if len(sorted) > 0 {
		abcMax = sorted[0].Montant
	}

	limit := 20
	if len(sorted) < limit {
		limit = len(sorted)
	}
	var abcRows []abcEntry
	var cumul float64
	for _, m := range sorted[:limit] {
		cumul += m.Montant
		cumulPct := 0.0
		if totalN > 0 {
			cumulPct = cumul / totalN * 100
		}
		classe := "C"
		if cumulPct <= 80 {
			classe = "A"
		} else if cumulPct <= 95 {
			classe = "B"
		}
		svc := m.Service
		if svc == "" {
			svc = "—"
		}
		abcRows = append(abcRows, abcEntry{
			Reference: m.Reference,
			Objet:     truncate(m.Objet, 48),
			Service:   svc,
			Montant:   m.Montant,
			Cumul:     cumul,
			CumulPct:  cumulPct,
			Classe:    classe,
		})
	}

	// ── 5. N vs N-1 comparison ────────────────────────────────────────────────
	hasCompar := len(marchesN1) > 0
	deltaPct := 0.0
	deltaUp := true
	if hasCompar && totalN1 > 0 {
		deltaPct = (totalN - totalN1) / totalN1 * 100
		deltaUp = deltaPct >= 0
	}

	// ── 6. Auto-recommendations ───────────────────────────────────────────────
	var recs []recommandation

	// Large MAPA detection (assume MAPA threshold = 40 000 €)
	mapaSuspects := 0
	for _, m := range marchesN {
		if strings.Contains(strings.ToLower(m.Procedure), "mapa") && m.Montant > 80_000 {
			mapaSuspects++
		}
	}
	if mapaSuspects > 0 {
		recs = append(recs, recommandation{
			Type:   "risque",
			Titre:  fmt.Sprintf("%d marché(s) MAPA dépassant 80 000 €", mapaSuspects),
			Detail: "Ces marchés dépassent le double du seuil MAPA — risque de fractionnement ou de procédure inadaptée. Vérifier si un appel d'offres était requis.",
		})
	}

	// Missing procedure
	noProc := 0
	for _, m := range marchesN {
		if strings.TrimSpace(m.Procedure) == "" {
			noProc++
		}
	}
	if noProc > 0 {
		recs = append(recs, recommandation{
			Type:   "info",
			Titre:  fmt.Sprintf("%d marché(s) sans procédure renseignée", noProc),
			Detail: "La saisie de la procédure est obligatoire pour la conformité réglementaire et les rapports d'audit.",
		})
	}

	// Large increase year-on-year
	if hasCompar && math.Abs(deltaPct) > 15 {
		msg := fmt.Sprintf("Hausse de %.1f%%", deltaPct)
		detail := "La dépense a fortement augmenté par rapport à N-1. Vérifier si cette évolution est justifiée."
		if deltaPct < 0 {
			msg = fmt.Sprintf("Baisse de %.1f%%", math.Abs(deltaPct))
			detail = "La dépense a fortement diminué par rapport à N-1. Vérifier la complétude des données saisies."
		}
		recs = append(recs, recommandation{
			Type:   "info",
			Titre:  msg + " vs année précédente",
			Detail: detail,
		})
	}

	if len(recs) == 0 {
		recs = append(recs, recommandation{
			Type:   "ok",
			Titre:  "Aucune anomalie détectée automatiquement",
			Detail: "Les données saisies ne déclenchent pas d'alerte automatique. Un examen manuel reste recommandé.",
		})
	}

	// ── 7. Render ─────────────────────────────────────────────────────────────
	data := rapportData{
		Version:         version,
		Year:            year,
		GeneratedAt:     now.Format("02 janvier 2006 à 15h04"),
		TotalMontant:    totalN,
		TotalMarches:    len(marchesN),
		TotalServices:   len(serviceAgg),
		AvgMontant:      safeDiv(totalN, float64(len(marchesN))),
		Statuts:         statuts,
		Services:        services,
		ServiceMax:      serviceMax,
		Procedures:      procedures,
		ABCRows:         abcRows,
		ABCMax:          abcMax,
		HasCompar:       hasCompar,
		YearN1:          year - 1,
		TotalN1:         totalN1,
		DeltaPct:        deltaPct,
		DeltaUp:         deltaUp,
		Recommandations: recs,
	}

	tmpl := template.Must(template.New("rapport").Funcs(template.FuncMap{
		"fmtEur": func(v float64) string {
			if v >= 1_000_000 {
				return fmt.Sprintf("%.2f M€", v/1_000_000)
			}
			if v >= 1_000 {
				return fmt.Sprintf("%d k€", int(v/1_000))
			}
			return fmt.Sprintf("%d €", int(v))
		},
		"fmtPct": func(v float64) string { return fmt.Sprintf("%.1f%%", v) },
		"pctBar": func(v, max float64) float64 {
			if max == 0 {
				return 0
			}
			pct := v / max * 100
			if pct > 100 {
				return 100
			}
			return pct
		},
		"abcColor": func(c string) string {
			switch c {
			case "A":
				return "#1d4ed8"
			case "B":
				return "#7c3aed"
			default:
				return "#64748b"
			}
		},
		"recIcon": func(t string) string {
			switch t {
			case "risque":
				return "⚠"
			case "ok":
				return "✓"
			default:
				return "ℹ"
			}
		},
		"recColor": func(t string) string {
			switch t {
			case "risque":
				return "#dc2626"
			case "ok":
				return "#059669"
			default:
				return "#2563eb"
			}
		},
		"recBg": func(t string) string {
			switch t {
			case "risque":
				return "#fee2e2"
			case "ok":
				return "#d1fae5"
			default:
				return "#dbeafe"
			}
		},
		"absF": func(v float64) float64 {
			if v < 0 {
				return -v
			}
			return v
		},
		"isDirection": func(v string) bool { return v == "direction" },
		"seq":         func(n int) []int { s := make([]int, n); for i := range s { s[i] = i }; return s },
	}).Parse(rapportHTMLTmpl))

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		c.JSON(500, models.Err("failed to render rapport"))
		return
	}

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Data(http.StatusOK, "text/html; charset=utf-8", buf.Bytes())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func serviceColor(s string) string {
	colors := []string{"#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2", "#be185d", "#4f46e5"}
	h := 0
	for _, c := range s {
		h = (h*31 + int(c)) % len(colors)
	}
	return colors[h]
}

func statutLabel(s string) string {
	switch s {
	case "planifie":
		return "Planifié"
	case "en_cours":
		return "En cours"
	case "termine":
		return "Terminé"
	case "alerte":
		return "En alerte"
	case "annule":
		return "Annulé"
	default:
		return strings.Title(s)
	}
}

func statutColor(s string) string {
	switch s {
	case "planifie":
		return "#64748b"
	case "en_cours":
		return "#2563eb"
	case "termine":
		return "#059669"
	case "alerte":
		return "#dc2626"
	case "annule":
		return "#94a3b8"
	default:
		return "#6366f1"
	}
}

func procColor(s string) string {
	s = strings.ToLower(s)
	if strings.Contains(s, "ao") || strings.Contains(s, "appel") {
		return "#1d4ed8"
	}
	if strings.Contains(s, "mapa") {
		return "#7c3aed"
	}
	if strings.Contains(s, "accord") {
		return "#059669"
	}
	return "#64748b"
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}

func safeDiv(a, b float64) float64 {
	if b == 0 {
		return 0
	}
	return a / b
}

// ── HTML Template ─────────────────────────────────────────────────────────────

const rapportHTMLTmpl = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport de cartographie des achats — {{.Year}}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: Inter, system-ui, sans-serif; font-size: 12px; color: #0f172a; background: #fff; }

  /* Toolbar */
  .toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 99;
    background: #fff; border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; gap: 10px; padding: 8px 20px;
    box-shadow: 0 1px 6px rgba(0,0,0,.06);
  }
  .toolbar-title { font-weight: 700; font-size: 13px; flex: 1; }
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;
    text-decoration: none; transition: all .15s;
  }
  .btn:hover { background: #f1f5f9; }
  .btn-primary { background: #1d4ed8; color: white; border-color: #1d4ed8; }
  .btn-primary:hover { background: #1e40af; }
  .version-badge {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .14em;
    padding: 3px 10px; border-radius: 99px;
    background: {{if isDirection .Version}}#eff6ff{{else}}#f0fdf4{{end}};
    color: {{if isDirection .Version}}#1d4ed8{{else}}#059669{{end}};
    border: 1px solid {{if isDirection .Version}}#bfdbfe{{else}}#bbf7d0{{end}};
  }

  /* Layout */
  body { padding-top: 48px; }
  .container { max-width: 1100px; margin: 0 auto; padding: 0 32px 80px; }

  /* Cover */
  .cover {
    min-height: calc(100vh - 48px); display: flex; flex-direction: column;
    justify-content: center; padding: 60px 0; border-bottom: 2px solid #e2e8f0;
    margin-bottom: 48px;
  }
  .cover-tag {
    display: inline-flex; align-items: center; gap: 8px;
    background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase; padding: 6px 14px;
    border-radius: 99px; margin-bottom: 28px; width: fit-content;
  }
  .cover h1 { font-size: 44px; font-weight: 800; letter-spacing: -.04em; line-height: 1.05; color: #0f172a; margin-bottom: 10px; }
  .cover h1 span { color: #1d4ed8; }
  .cover-sub { font-size: 16px; color: #64748b; margin-bottom: 44px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
  .kpi-card {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 18px 20px;
  }
  .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
  .kpi-value { font-size: 26px; font-weight: 800; color: #1d4ed8; }
  .kpi-sub { font-size: 11px; color: #64748b; margin-top: 3px; }

  /* Delta */
  .delta { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; font-size: 13px; }
  .delta-up { color: #059669; }
  .delta-down { color: #dc2626; }

  /* Section */
  .section { margin: 40px 0; }
  .section-title {
    font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
    color: #94a3b8; display: flex; align-items: center; gap: 8px; margin-bottom: 20px;
    scroll-margin-top: 60px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
  .card {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 22px;
  }

  /* Bar chart */
  .bar-chart { space-y: 10px; }
  .bar-row { margin-bottom: 10px; }
  .bar-meta { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
  .bar-label { color: #334155; font-weight: 500; }
  .bar-val { color: #64748b; }
  .bar-track { height: 10px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 99px; transition: width .3s; }

  /* Procedures */
  .proc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .proc-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;
  }
  .proc-name { font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
  .proc-count { font-size: 22px; font-weight: 800; }
  .proc-pct { font-size: 11px; color: #64748b; }
  .proc-bar-track { height: 4px; background: #e2e8f0; border-radius: 99px; margin-top: 10px; }

  /* ABC Table */
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead tr { background: #1d4ed8; color: white; }
  thead th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  thead th.right { text-align: right; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:hover td { background: #f8fafc; }
  tbody td { padding: 7px 12px; color: #334155; }
  tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
  tbody td.mono { font-family: monospace; font-size: 10px; color: #64748b; }
  .abc-badge { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; font-size: 11px; font-weight: 800; color: white; }

  /* Cumul bar */
  .cumul-bar { height: 6px; background: #e2e8f0; border-radius: 99px; margin-top: 6px; overflow: hidden; width: 80px; display: inline-block; vertical-align: middle; }
  .cumul-fill { height: 100%; border-radius: 99px; }

  /* Statuts */
  .statut-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
  .statut-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
  .statut-dot { width: 8px; height: 8px; border-radius: 99px; display: inline-block; margin-right: 6px; }
  .statut-label { font-size: 11px; font-weight: 600; color: #475569; }
  .statut-count { font-size: 20px; font-weight: 800; color: #0f172a; margin: 6px 0 2px; }
  .statut-montant { font-size: 11px; color: #94a3b8; }

  /* Recommandations */
  .rec-list { display: flex; flex-direction: column; gap: 10px; }
  .rec-card {
    display: flex; align-items: flex-start; gap: 12px;
    border-radius: 10px; padding: 14px 16px; border: 1px solid;
  }
  .rec-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .rec-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .rec-detail { font-size: 11px; color: #475569; line-height: 1.5; }

  /* Two-col layout */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* Footer */
  .footer {
    margin-top: 60px; padding: 20px 0; border-top: 1px solid #e2e8f0;
    display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;
  }

  /* Print */
  @media print {
    .toolbar { display: none !important; }
    body { padding-top: 0; }
    .cover { min-height: auto; page-break-after: always; }
    .section { page-break-inside: avoid; }
    .card { page-break-inside: avoid; }
    @page { margin: 12mm; size: A4 portrait; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<div class="toolbar">
  <span class="toolbar-title">📊 Rapport cartographie des achats — {{.Year}}</span>
  <span class="version-badge">Version {{if isDirection .Version}}Direction{{else}}Technique{{end}}</span>
  {{if isDirection .Version}}
  <a href="?year={{.Year}}&version=technique" class="btn no-print">Passer en version Technique ↗</a>
  {{else}}
  <a href="?year={{.Year}}&version=direction" class="btn no-print">Passer en version Direction ↗</a>
  {{end}}
  <button class="btn btn-primary no-print" onclick="window.print()">⬇ Imprimer / PDF</button>
</div>

<div class="container">

<!-- ── Cover ── -->
<div class="cover">
  <div class="cover-tag">📋 Cartographie des achats — Rapport {{if isDirection .Version}}Direction{{else}}Technique{{end}}</div>
  <h1>Rapport annuel des <span>achats publics</span></h1>
  <p class="cover-sub">Exercice {{.Year}} · Généré le {{.GeneratedAt}}</p>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Volume total</div>
      <div class="kpi-value">{{fmtEur .TotalMontant}}</div>
      {{if .HasCompar}}
      <div class="kpi-sub">
        <span class="delta {{if .DeltaUp}}delta-up{{else}}delta-down{{end}}">
          {{if .DeltaUp}}↑{{else}}↓{{end}} {{fmtPct (absF .DeltaPct)}} vs {{.YearN1}}
        </span>
      </div>
      {{end}}
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Marchés</div>
      <div class="kpi-value">{{.TotalMarches}}</div>
      <div class="kpi-sub">passés sur l'exercice</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Services</div>
      <div class="kpi-value">{{.TotalServices}}</div>
      <div class="kpi-sub">directions représentées</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Montant moyen</div>
      <div class="kpi-value">{{fmtEur .AvgMontant}}</div>
      <div class="kpi-sub">par marché</div>
    </div>
  </div>

  {{if .HasCompar}}
  <div class="card" style="max-width: 480px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:12px">
      Comparaison N / N-1
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div>
        <div style="font-size:11px;color:#94a3b8">{{.Year}}</div>
        <div style="font-size:20px;font-weight:800;color:#1d4ed8">{{fmtEur .TotalMontant}}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#94a3b8">{{.YearN1}}</div>
        <div style="font-size:20px;font-weight:800;color:#64748b">{{fmtEur .TotalN1}}</div>
      </div>
    </div>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:13px;font-weight:700">
      <span class="delta {{if .DeltaUp}}delta-up{{else}}delta-down{{end}}">
        {{if .DeltaUp}}↑{{else}}↓{{end}} {{fmtPct (absF .DeltaPct)}} {{if .DeltaUp}}de hausse{{else}}de baisse{{end}}
      </span>
      <span style="color:#94a3b8;font-weight:400;font-size:11px"> par rapport à {{.YearN1}}</span>
    </div>
  </div>
  {{end}}
</div>

<!-- ── Statuts ── -->
<div class="section">
  <div class="section-title">Répartition par statut</div>
  <div class="statut-grid">
    {{range .Statuts}}
    <div class="statut-card">
      <div><span class="statut-dot" style="background:{{.Color}}"></span><span class="statut-label">{{.Label}}</span></div>
      <div class="statut-count" style="color:{{.Color}}">{{.Count}}</div>
      <div class="statut-montant">{{fmtEur .Value}}</div>
      <div class="bar-track" style="margin-top:8px"><div class="bar-fill" style="width:{{fmtPct .Pct}};background:{{.Color}}"></div></div>
    </div>
    {{end}}
  </div>
</div>

<!-- ── Services ── -->
<div class="section">
  <div class="section-title">Répartition par service</div>
  <div class="card">
    {{range .Services}}
    <div class="bar-row">
      <div class="bar-meta">
        <span class="bar-label">{{.Label}}</span>
        <span class="bar-val">{{fmtEur .Value}} ({{.Count}} marchés)</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:{{pctBar .Value $.ServiceMax}}%;background:{{.Color}}"></div>
      </div>
    </div>
    {{end}}
  </div>
</div>

<!-- ── Procédures ── -->
<div class="section">
  <div class="section-title">Répartition par procédure</div>
  <div class="proc-grid">
    {{range .Procedures}}
    <div class="proc-card">
      <div class="proc-name">{{.Label}}</div>
      <div class="proc-count" style="color:{{.Color}}">{{.Count}}</div>
      <div class="proc-pct">{{fmtPct .Pct}} des marchés · {{fmtEur .Value}}</div>
      <div class="proc-bar-track"><div class="bar-fill" style="height:4px;width:{{fmtPct .Pct}};background:{{.Color}}"></div></div>
    </div>
    {{end}}
  </div>
</div>

{{if not (isDirection .Version)}}
<!-- ── Analyse ABC ── (version Technique uniquement) -->
<div class="section">
  <div class="section-title">Analyse ABC — Top {{len .ABCRows}} marchés par montant</div>
  <div class="card" style="padding: 0; overflow: hidden">
    <table>
      <thead>
        <tr>
          <th>Classe</th>
          <th>Référence</th>
          <th>Objet</th>
          <th>Service</th>
          <th class="right">Montant</th>
          <th class="right">Cumul</th>
          <th>% cumul</th>
        </tr>
      </thead>
      <tbody>
        {{range .ABCRows}}
        <tr>
          <td><span class="abc-badge" style="background:{{abcColor .Classe}}">{{.Classe}}</span></td>
          <td class="mono">{{.Reference}}</td>
          <td>{{.Objet}}</td>
          <td>{{.Service}}</td>
          <td class="right" style="font-weight:600">{{fmtEur .Montant}}</td>
          <td class="right">{{fmtEur .Cumul}}</td>
          <td>
            <div style="display:flex;align-items:center;gap:6px">
              <span>{{fmtPct .CumulPct}}</span>
              <div class="cumul-bar"><div class="cumul-fill" style="width:{{fmtPct .CumulPct}};background:{{abcColor .Classe}}"></div></div>
            </div>
          </td>
        </tr>
        {{end}}
      </tbody>
    </table>
  </div>
  <div style="margin-top:12px;font-size:11px;color:#94a3b8;padding:0 4px">
    A = top 80% de la dépense · B = 80–95% · C = reste (longue traîne)
  </div>
</div>
{{end}}

<!-- ── Recommandations ── -->
<div class="section">
  <div class="section-title">Recommandations automatiques</div>
  <div class="rec-list">
    {{range .Recommandations}}
    <div class="rec-card" style="background:{{recBg .Type}};border-color:{{recColor .Type}}44">
      <span class="rec-icon" style="color:{{recColor .Type}}">{{recIcon .Type}}</span>
      <div>
        <div class="rec-title" style="color:{{recColor .Type}}">{{.Titre}}</div>
        <div class="rec-detail">{{.Detail}}</div>
      </div>
    </div>
    {{end}}
  </div>
</div>

<div class="footer">
  <span>Rapport de cartographie des achats — Exercice {{.Year}} — Version {{if isDirection .Version}}Direction{{else}}Technique{{end}}</span>
  <span>Généré le {{.GeneratedAt}} · STRATT ERP</span>
</div>

</div>
</body>
</html>`
