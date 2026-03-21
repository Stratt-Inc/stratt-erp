package nomenclature

import (
	"bytes"
	"fmt"
	"html/template"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"github.com/xuri/excelize/v2"
)

// ── Flat row for export ───────────────────────────────────────────────────────

type exportRow struct {
	GrandeFamille string
	Famille       string
	Code          string
	Label         string
	Description   string
	Tag           string
	SeuilMapa     float64
	SeuilAO       float64
	Montant       float64
	Conforme      bool
}

// buildExportRows flattens the nomenclature tree into ordered rows suitable
// for Excel/PDF export: sorted by grande-famille → famille → code.
func buildExportRows(nodes []NomenclatureNode) []exportRow {
	// Index by ID
	byID := make(map[string]*NomenclatureNode, len(nodes))
	for i := range nodes {
		byID[nodes[i].ID.String()] = &nodes[i]
	}

	// Resolve ancestry label
	grandeFamilleOf := func(n *NomenclatureNode) string {
		if n.ParentID == nil {
			return n.Label
		}
		parent := byID[n.ParentID.String()]
		if parent == nil {
			return ""
		}
		if parent.ParentID == nil {
			return parent.Label
		}
		gp := byID[parent.ParentID.String()]
		if gp != nil {
			return gp.Label
		}
		return parent.Label
	}

	familleOf := func(n *NomenclatureNode) string {
		if n.ParentID == nil {
			return ""
		}
		parent := byID[n.ParentID.String()]
		if parent == nil {
			return ""
		}
		if parent.Type == "famille" {
			return parent.Label
		}
		return ""
	}

	var rows []exportRow
	for i := range nodes {
		n := &nodes[i]
		// Export all levels — grande-famille rows give the header, famille rows
		// give the grouping, code rows are the leaf entries.
		rows = append(rows, exportRow{
			GrandeFamille: grandeFamilleOf(n),
			Famille:       familleOf(n),
			Code:          n.Code,
			Label:         n.Label,
			Description:   n.Description,
			Tag:           n.Tag,
			SeuilMapa:     n.SeuilMapa,
			SeuilAO:       n.SeuilAO,
			Montant:       n.Montant,
			Conforme:      n.Conforme,
		})
	}

	sort.Slice(rows, func(i, j int) bool {
		if rows[i].GrandeFamille != rows[j].GrandeFamille {
			return rows[i].GrandeFamille < rows[j].GrandeFamille
		}
		if rows[i].Famille != rows[j].Famille {
			return rows[i].Famille < rows[j].Famille
		}
		return rows[i].Code < rows[j].Code
	})
	return rows
}

// validateNodes returns validation errors (duplicate codes, empty labels).
func validateNodes(nodes []NomenclatureNode) []string {
	seen := map[string]int{}
	var errs []string
	for _, n := range nodes {
		seen[n.Code]++
		if strings.TrimSpace(n.Label) == "" {
			errs = append(errs, fmt.Sprintf("code %q : libellé vide", n.Code))
		}
	}
	for code, count := range seen {
		if count > 1 {
			errs = append(errs, fmt.Sprintf("code %q : %d doublons détectés", code, count))
		}
	}
	return errs
}

// ── Export dispatcher ─────────────────────────────────────────────────────────

// Export dispatches to ExportExcel or ExportHTML based on ?format=excel|pdf.
//
// GET /nomenclature/export?format=excel   → .xlsx download
// GET /nomenclature/export?format=pdf     → print-ready HTML
func (h *Handler) Export(c *gin.Context) {
	switch c.Query("format") {
	case "pdf", "html":
		h.ExportHTML(c)
	default:
		h.ExportExcel(c)
	}
}

// ── ExportExcel ───────────────────────────────────────────────────────────────

// ExportExcel generates a structured Excel file of the nomenclature.
//
// GET /nomenclature/export?format=excel
func (h *Handler) ExportExcel(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	var nodes []NomenclatureNode
	if err := h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("code").
		Find(&nodes).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch nomenclature"))
		return
	}

	// Validation
	if errs := validateNodes(nodes); len(errs) > 0 {
		c.JSON(422, gin.H{"error": "validation failed", "details": errs})
		return
	}

	rows := buildExportRows(nodes)

	f := excelize.NewFile()
	defer f.Close()

	const sheet = "Nomenclature"
	f.SetSheetName("Sheet1", sheet)

	// ── Styles ────────────────────────────────────────────────────────────────
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 14, Color: "1E293B"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 10, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"1d4ed8"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "bottom", Color: "1e40af", Style: 2},
		},
	})
	gfStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 10, Color: "1e40af"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"dbeafe"}, Pattern: 1},
	})
	familleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 10, Color: "1E293B"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"f1f5f9"}, Pattern: 1},
	})
	codeStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 9, Color: "334155"},
	})
	numStyle, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Size: 9, Color: "334155"},
		NumFmt:       3, // #,##0
		Alignment:    &excelize.Alignment{Horizontal: "right"},
	})
	conformeStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 9, Color: "059669"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"d1fae5"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	nonConformeStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 9, Color: "dc2626"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"fee2e2"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	_ = conformeStyle
	_ = nonConformeStyle

	// ── Title block ───────────────────────────────────────────────────────────
	f.MergeCell(sheet, "A1", "J1")
	f.SetCellValue(sheet, "A1", "NOMENCLATURE DES ACHATS — DOCUMENT D'IMPLÉMENTATION INFORMATIQUE")
	f.SetCellStyle(sheet, "A1", "J1", titleStyle)
	f.SetRowHeight(sheet, 1, 28)

	f.MergeCell(sheet, "A2", "J2")
	f.SetCellValue(sheet, "A2", fmt.Sprintf("Généré le %s · Format éditeurs logiciels financiers (M57/GFI/Berger-Levrault)", time.Now().Format("02/01/2006 à 15:04")))
	subtitleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 9, Color: "64748b", Italic: true},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	f.SetCellStyle(sheet, "A2", "J2", subtitleStyle)
	f.SetRowHeight(sheet, 2, 16)
	f.SetRowHeight(sheet, 3, 6)

	// ── Column headers (row 4) ─────────────────────────────────────────────────
	headers := []string{
		"Code", "Libellé", "Grande famille", "Famille",
		"Catégorie", "Description", "Seuil MAPA (€)", "Seuil AO (€)",
		"Dépenses (€)", "Conformité",
	}
	cols := []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"}
	widths := []float64{14, 36, 22, 26, 14, 40, 16, 16, 16, 12}

	for i, h2 := range headers {
		cell := cols[i] + "4"
		f.SetCellValue(sheet, cell, h2)
		f.SetCellStyle(sheet, cell, cell, headerStyle)
		f.SetColWidth(sheet, cols[i], cols[i], widths[i])
	}
	f.SetRowHeight(sheet, 4, 20)

	// ── Data rows (starting row 5) ────────────────────────────────────────────
	row := 5
	prevGF := ""
	prevFam := ""

	for _, r := range rows {
		// Skip grandes-familles and familles as standalone rows; they appear as
		// grouping context in the Code column header-like rows instead.
		if r.GrandeFamille != prevGF {
			// Grande-famille separator row
			f.MergeCell(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("J%d", row))
			f.SetCellValue(sheet, fmt.Sprintf("A%d", row), "▶ "+r.GrandeFamille)
			f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("J%d", row), gfStyle)
			f.SetRowHeight(sheet, row, 18)
			row++
			prevGF = r.GrandeFamille
			prevFam = ""
		}
		if r.Famille != "" && r.Famille != prevFam {
			f.MergeCell(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("J%d", row))
			f.SetCellValue(sheet, fmt.Sprintf("A%d", row), "  → "+r.Famille)
			f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("J%d", row), familleStyle)
			f.SetRowHeight(sheet, row, 16)
			row++
			prevFam = r.Famille
		}

		// Skip pure grande-famille and famille rows (no parent means root, famille has a parent that is grande-famille)
		if r.Famille == "" && r.Code != "" {
			// Could be a famille-level entry displayed as code — emit it
		}

		// Only emit leaf code rows
		if r.Famille == "" {
			continue
		}

		// Code row
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), r.Code)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), r.Label)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), r.GrandeFamille)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), r.Famille)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), r.Tag)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), r.Description)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), r.SeuilMapa)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), r.SeuilAO)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), r.Montant)

		conformeVal := "✓ Conforme"
		csStyle := conformeStyle
		if !r.Conforme {
			conformeVal = "⚠ Non conforme"
			csStyle = nonConformeStyle
		}
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row), conformeVal)

		for _, col := range []string{"A", "B", "C", "D", "E", "F"} {
			f.SetCellStyle(sheet, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), codeStyle)
		}
		for _, col := range []string{"G", "H", "I"} {
			f.SetCellStyle(sheet, fmt.Sprintf("%s%d", col, row), fmt.Sprintf("%s%d", col, row), numStyle)
		}
		f.SetCellStyle(sheet, fmt.Sprintf("J%d", row), fmt.Sprintf("J%d", row), csStyle)
		f.SetRowHeight(sheet, row, 14)
		row++
	}

	// Freeze header rows
	f.SetPanes(sheet, &excelize.Panes{
		Freeze:      true,
		Split:       false,
		XSplit:      0,
		YSplit:      4,
		TopLeftCell: "A5",
		ActivePane:  "bottomLeft",
	})

	// Auto-filter on header row
	f.AutoFilter(sheet, fmt.Sprintf("A4:J4"), nil)

	// Stream response
	buf := bytes.NewBuffer(nil)
	if err := f.Write(buf); err != nil {
		c.JSON(500, models.Err("failed to generate Excel file"))
		return
	}

	filename := fmt.Sprintf("nomenclature-implementation-%s.xlsx", time.Now().Format("2006-01-02"))
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Length", fmt.Sprintf("%d", buf.Len()))
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// ── ExportPDF (HTML) ──────────────────────────────────────────────────────────

// ExportHTML generates a print-ready HTML page the browser can print/save as PDF.
//
// GET /nomenclature/export?format=pdf
func (h *Handler) ExportHTML(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	var nodes []NomenclatureNode
	if err := h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("code").
		Find(&nodes).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch nomenclature"))
		return
	}

	if errs := validateNodes(nodes); len(errs) > 0 {
		c.JSON(422, gin.H{"error": "validation failed", "details": errs})
		return
	}

	rows := buildExportRows(nodes)

	tmpl := template.Must(template.New("export").Funcs(template.FuncMap{
		"fmtNum": func(v float64) string {
			if v == 0 {
				return "—"
			}
			if v >= 1_000_000 {
				return fmt.Sprintf("%.2f M€", v/1_000_000)
			}
			return fmt.Sprintf("%d k€", int(v/1_000))
		},
		"fmtFull": func(v float64) string {
			if v == 0 {
				return "—"
			}
			return fmt.Sprintf("%d €", int(v))
		},
	}).Parse(exportHTMLTmpl))

	type tmplData struct {
		GeneratedAt string
		Rows        []exportRow
		TotalNodes  int
		Conformes   int
	}

	conformes := 0
	for _, n := range nodes {
		if n.Conforme {
			conformes++
		}
	}

	data := tmplData{
		GeneratedAt: time.Now().Format("02 janvier 2006 à 15h04"),
		Rows:        rows,
		TotalNodes:  len(nodes),
		Conformes:   conformes,
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		c.JSON(500, models.Err("failed to render HTML"))
		return
	}

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Data(http.StatusOK, "text/html; charset=utf-8", buf.Bytes())
}

// ── HTML template ─────────────────────────────────────────────────────────────

const exportHTMLTmpl = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Nomenclature des achats — Document d'implémentation informatique</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, system-ui, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }

  .cover {
    min-height: 100vh; display: flex; flex-direction: column;
    justify-content: center; align-items: center; padding: 60px 40px;
    background: linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%);
    color: white; text-align: center; page-break-after: always;
  }
  .cover-badge {
    font-size: 10px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
    background: rgba(255,255,255,.15); border-radius: 100px; padding: 6px 18px; margin-bottom: 32px;
  }
  .cover h1 { font-size: 32px; font-weight: 800; letter-spacing: -.03em; line-height: 1.1; margin-bottom: 16px; }
  .cover h1 span { color: #93c5fd; }
  .cover-sub { font-size: 15px; opacity: .7; margin-bottom: 48px; }
  .cover-meta {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; width: 100%; max-width: 640px;
    border-top: 1px solid rgba(255,255,255,.2); padding-top: 32px;
  }
  .cover-meta-item { text-align: center; }
  .cover-meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: .15em; opacity: .55; margin-bottom: 6px; }
  .cover-meta-value { font-size: 22px; font-weight: 700; }

  .content { padding: 32px 32px 48px; }
  .section-title {
    font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
    color: #64748b; display: flex; align-items: center; gap: 8px; margin: 24px 0 12px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }

  .notice {
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
    padding: 12px 16px; margin-bottom: 24px; color: #1d4ed8; font-size: 11px; line-height: 1.5;
  }

  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead tr { background: #1d4ed8; color: white; }
  thead th {
    padding: 8px 10px; text-align: left; font-size: 9px;
    font-weight: 700; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap;
  }
  thead th:nth-child(n+6) { text-align: right; }

  tr.gf-row td {
    background: #dbeafe; color: #1d4ed8; font-weight: 700;
    padding: 7px 10px; border-bottom: 2px solid #bfdbfe;
  }
  tr.famille-row td {
    background: #f8fafc; color: #334155; font-weight: 600;
    padding: 5px 10px 5px 20px; border-bottom: 1px solid #e2e8f0;
  }
  tr.code-row td {
    padding: 5px 10px 5px 28px; border-bottom: 1px solid #f1f5f9; color: #475569;
  }
  tr.code-row:hover td { background: #fafafa; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.code { font-family: monospace; font-size: 9px; color: #64748b; }
  .badge-ok  { display:inline-block; padding: 2px 7px; border-radius: 99px; background: #d1fae5; color: #059669; font-weight: 700; font-size: 9px; }
  .badge-ko  { display:inline-block; padding: 2px 7px; border-radius: 99px; background: #fee2e2; color: #dc2626; font-weight: 700; font-size: 9px; }

  footer {
    margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0;
    display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px;
  }

  @media print {
    body { font-size: 9px; }
    .cover { min-height: auto; padding: 40px; }
    .cover h1 { font-size: 24px; }
    @page { margin: 12mm 10mm; size: A4 landscape; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  }
  @media screen {
    body { max-width: 1200px; margin: 0 auto; }
    .print-btn {
      position: fixed; top: 20px; right: 20px; z-index: 99;
      background: #1d4ed8; color: white; border: none; border-radius: 8px;
      padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(29,78,216,.35);
    }
    .print-btn:hover { background: #1e40af; }
  }
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()" style="">
  ⬇ Imprimer / Enregistrer en PDF
</button>

<!-- Cover page -->
<div class="cover">
  <div class="cover-badge">Document d'implémentation informatique</div>
  <h1>Nomenclature des <span>achats</span></h1>
  <p class="cover-sub">Format éditeurs logiciels financiers — M57 · GFI · Berger-Levrault · Ciril · JVS</p>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="cover-meta-label">Codes total</div>
      <div class="cover-meta-value">{{.TotalNodes}}</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Conformes</div>
      <div class="cover-meta-value">{{.Conformes}}</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Généré le</div>
      <div class="cover-meta-value" style="font-size:13px;margin-top:4px">{{.GeneratedAt}}</div>
    </div>
  </div>
</div>

<!-- Content -->
<div class="content">

  <div class="notice">
    Ce document liste l'ensemble des codes de nomenclature à paramétrer dans votre logiciel financier.
    Transmettez-le à votre éditeur (GFI, Berger-Levrault, Ciril, JVS…) avec la colonne <strong>Code</strong>
    et <strong>Libellé</strong> comme références d'import. Les seuils MAPA et AO sont indicatifs (CCP 2024).
  </div>

  <div class="section-title">Tableau de référence — Codes nomenclature</div>

  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Libellé</th>
        <th>Grande famille</th>
        <th>Famille</th>
        <th>Catégorie</th>
        <th style="text-align:right">Seuil MAPA</th>
        <th style="text-align:right">Seuil AO</th>
        <th style="text-align:right">Dépenses</th>
        <th>Conformité</th>
      </tr>
    </thead>
    <tbody>
    {{$prevGF := ""}}
    {{$prevFam := ""}}
    {{range .Rows}}
      {{if ne .GrandeFamille $prevGF}}
        {{$prevGF = .GrandeFamille}}
        {{$prevFam = ""}}
        <tr class="gf-row">
          <td colspan="9">▶ {{.GrandeFamille}}</td>
        </tr>
      {{end}}
      {{if and (ne .Famille "") (ne .Famille $prevFam)}}
        {{$prevFam = .Famille}}
        <tr class="famille-row">
          <td colspan="9">→ {{.Famille}}</td>
        </tr>
      {{end}}
      {{if .Famille}}
      <tr class="code-row">
        <td class="code">{{.Code}}</td>
        <td>{{.Label}}</td>
        <td>{{.GrandeFamille}}</td>
        <td>{{.Famille}}</td>
        <td>{{.Tag}}</td>
        <td class="num">{{fmtFull .SeuilMapa}}</td>
        <td class="num">{{fmtFull .SeuilAO}}</td>
        <td class="num">{{fmtNum .Montant}}</td>
        <td>{{if .Conforme}}<span class="badge-ok">✓ Conforme</span>{{else}}<span class="badge-ko">⚠ Non conforme</span>{{end}}</td>
      </tr>
      {{end}}
    {{end}}
    </tbody>
  </table>

  <footer>
    <span>Nomenclature des achats — Document d'implémentation informatique</span>
    <span>Généré le {{.GeneratedAt}} · STRATT ERP</span>
  </footer>
</div>
</body>
</html>`
