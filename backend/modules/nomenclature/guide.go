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
)

// guideRow holds all data needed to render one code entry in the guide.
type guideRow struct {
	// Hierarchy
	GrandeFamilleCode  string
	GrandeFamilleLabel string
	FamilleCode        string
	FamilleLabel       string
	CodeStr            string
	Label              string
	Description        string
	Tag                string
	CPVCode            string

	// Spend / conformité
	SeuilMapa float64
	SeuilAO   float64
	Montant   float64
	Conforme  bool

	// Cross-references — same-famille sibling codes
	SeeAlso []seeAlsoEntry
}

type seeAlsoEntry struct {
	Code  string
	Label string
}

// guideSection groups famille codes under a grande-famille.
type guideSection struct {
	Code   string
	Label  string
	Tag    string
	Rows   []guideRow
	// Familles within the section (for ToC)
	Familles []guideFamille
}

type guideFamille struct {
	Code   string
	Label  string
	Anchor string
	Rows   []guideRow
}

// buildGuideData organises nodes into sections for the pedagogical guide.
func buildGuideData(nodes []NomenclatureNode) []guideSection {
	byID := make(map[string]*NomenclatureNode, len(nodes))
	for i := range nodes {
		byID[nodes[i].ID.String()] = &nodes[i]
	}

	// Index: grande-famille → familles → codes
	type familleKey struct{ gfID, famID string }
	gfOrder := []string{}
	gfByID := map[string]*NomenclatureNode{}
	famByID := map[string]*NomenclatureNode{}
	codesByFam := map[string][]*NomenclatureNode{}

	for i := range nodes {
		n := &nodes[i]
		switch n.Type {
		case "grande-famille":
			gfByID[n.ID.String()] = n
			gfOrder = append(gfOrder, n.ID.String())
		case "famille":
			famByID[n.ID.String()] = n
		case "code":
			if n.ParentID != nil {
				codesByFam[n.ParentID.String()] = append(codesByFam[n.ParentID.String()], n)
			}
		}
	}
	sort.Slice(gfOrder, func(i, j int) bool {
		return gfByID[gfOrder[i]].Code < gfByID[gfOrder[j]].Code
	})

	// Resolve familles per gf
	famOrder := map[string][]string{} // gfID → []famID ordered
	for famID, fam := range famByID {
		if fam.ParentID == nil {
			continue
		}
		gfID := fam.ParentID.String()
		famOrder[gfID] = append(famOrder[gfID], famID)
	}
	for gfID := range famOrder {
		sort.Slice(famOrder[gfID], func(i, j int) bool {
			return famByID[famOrder[gfID][i]].Code < famByID[famOrder[gfID][j]].Code
		})
	}
	// Sort codes per famille
	for famID := range codesByFam {
		sort.Slice(codesByFam[famID], func(i, j int) bool {
			return codesByFam[famID][i].Code < codesByFam[famID][j].Code
		})
	}

	var sections []guideSection
	for _, gfID := range gfOrder {
		gf := gfByID[gfID]
		sec := guideSection{
			Code:  gf.Code,
			Label: gf.Label,
			Tag:   gf.Tag,
		}

		for _, famID := range famOrder[gfID] {
			fam := famByID[famID]
			codes := codesByFam[famID]

			// Build see-also list for all codes in this famille
			seeAlsoAll := make([]seeAlsoEntry, 0, len(codes))
			for _, c := range codes {
				seeAlsoAll = append(seeAlsoAll, seeAlsoEntry{Code: c.Code, Label: c.Label})
			}

			gf2 := guideSection{}
			_ = gf2

			famEntry := guideFamille{
				Code:   fam.Code,
				Label:  fam.Label,
				Anchor: "fam-" + sanitizeAnchor(fam.Code),
			}

			for _, c := range codes {
				// See-also = siblings excluding self
				var seeAlso []seeAlsoEntry
				for _, sa := range seeAlsoAll {
					if sa.Code != c.Code {
						seeAlso = append(seeAlso, sa)
					}
				}
				// Limit to 5 suggestions
				if len(seeAlso) > 5 {
					seeAlso = seeAlso[:5]
				}

				row := guideRow{
					GrandeFamilleCode:  gf.Code,
					GrandeFamilleLabel: gf.Label,
					FamilleCode:        fam.Code,
					FamilleLabel:       fam.Label,
					CodeStr:            c.Code,
					Label:              c.Label,
					Description:        c.Description,
					Tag:                c.Tag,
					CPVCode:            c.CPVCode,
					SeuilMapa:          c.SeuilMapa,
					SeuilAO:            c.SeuilAO,
					Montant:            c.Montant,
					Conforme:           c.Conforme,
					SeeAlso:            seeAlso,
				}
				famEntry.Rows = append(famEntry.Rows, row)
				sec.Rows = append(sec.Rows, row)
			}
			sec.Familles = append(sec.Familles, famEntry)
		}
		sections = append(sections, sec)
	}
	return sections
}

func sanitizeAnchor(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, s)
	return s
}

// ExportGuide generates a print-ready HTML pedagogical guide for purchasing agents.
//
// GET /nomenclature/export/guide?color=1d4ed8&logo=https://...&dark=1
func (h *Handler) ExportGuide(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	var nodes []NomenclatureNode
	if err := h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("code").
		Find(&nodes).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch nomenclature"))
		return
	}

	sections := buildGuideData(nodes)

	// Query params for customization
	accentColor := c.DefaultQuery("color", "1d4ed8")
	if len(accentColor) > 0 && accentColor[0] == '#' {
		accentColor = accentColor[1:]
	}
	logoURL := c.Query("logo")
	darkMode := c.Query("dark") == "1"

	// Stats
	totalCodes := 0
	totalFamilles := 0
	nonConformes := 0
	for i := range nodes {
		switch nodes[i].Type {
		case "code":
			totalCodes++
		case "famille":
			totalFamilles++
			if !nodes[i].Conforme {
				nonConformes++
			}
		}
	}

	tmpl := template.Must(template.New("guide").Funcs(template.FuncMap{
		"fmtEur": func(v float64) string {
			if v == 0 {
				return "—"
			}
			if v >= 1_000_000 {
				return fmt.Sprintf("%.2f M€", v/1_000_000)
			}
			if v >= 1_000 {
				return fmt.Sprintf("%d k€", int(v/1_000))
			}
			return fmt.Sprintf("%d €", int(v))
		},
		"fmtFull": func(v float64) string {
			if v == 0 {
				return "—"
			}
			return fmt.Sprintf("%d €", int(v))
		},
		"anchorFam": func(code string) string {
			return "fam-" + sanitizeAnchor(code)
		},
		"anchorGF": func(code string) string {
			return "gf-" + sanitizeAnchor(code)
		},
		"hasDesc": func(s string) bool {
			return strings.TrimSpace(s) != ""
		},
		"tagColor": func(tag string) string {
			switch tag {
			case "Fournitures":
				return "2563eb"
			case "Services":
				return "7c3aed"
			case "Travaux":
				return "d97706"
			default:
				return "64748b"
			}
		},
		"add": func(a, b int) int { return a + b },
	}).Parse(guideHTMLTmpl))

	type tmplData struct {
		GeneratedAt  string
		Sections     []guideSection
		TotalCodes   int
		TotalFamilles int
		NonConformes int
		AccentColor  string
		LogoURL      string
		DarkMode     bool
	}

	data := tmplData{
		GeneratedAt:   time.Now().Format("02 janvier 2006 à 15h04"),
		Sections:      sections,
		TotalCodes:    totalCodes,
		TotalFamilles: totalFamilles,
		NonConformes:  nonConformes,
		AccentColor:   accentColor,
		LogoURL:       logoURL,
		DarkMode:      darkMode,
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		c.JSON(500, models.Err("failed to render guide"))
		return
	}

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Data(http.StatusOK, "text/html; charset=utf-8", buf.Bytes())
}

// ── HTML Template ─────────────────────────────────────────────────────────────

const guideHTMLTmpl = `<!DOCTYPE html>
<html lang="fr" {{if .DarkMode}}data-theme="dark"{{end}}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Guide de nomenclature des achats</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    --accent: #{{.AccentColor}};
    --accent-light: #{{.AccentColor}}22;
    --accent-mid: #{{.AccentColor}}55;
    --bg: #ffffff;
    --bg2: #f8fafc;
    --bg3: #f1f5f9;
    --border: #e2e8f0;
    --text: #0f172a;
    --text2: #475569;
    --text3: #94a3b8;
    --code-bg: #f1f5f9;
  }
  [data-theme="dark"] {
    --bg: #0f172a;
    --bg2: #1e293b;
    --bg3: #334155;
    --border: #334155;
    --text: #f1f5f9;
    --text2: #94a3b8;
    --text3: #64748b;
    --code-bg: #1e293b;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: Inter, system-ui, sans-serif;
    font-size: 13px; line-height: 1.6;
    color: var(--text); background: var(--bg);
  }

  /* ── Toolbar ── */
  .toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: var(--bg); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 12px; padding: 10px 20px;
    box-shadow: 0 1px 6px rgba(0,0,0,.08);
  }
  .toolbar-title { font-weight: 700; font-size: 13px; flex: 1; color: var(--text); }
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: 1px solid var(--border); background: var(--bg2);
    color: var(--text2); transition: all .15s;
  }
  .btn:hover { background: var(--bg3); }
  .btn-primary { background: var(--accent); color: white; border-color: var(--accent); }
  .btn-primary:hover { opacity: .9; }

  /* ── Layout ── */
  .layout { display: flex; padding-top: 52px; min-height: 100vh; }
  .sidebar {
    width: 260px; flex-shrink: 0; position: sticky; top: 52px;
    height: calc(100vh - 52px); overflow-y: auto;
    border-right: 1px solid var(--border); padding: 20px 0;
    background: var(--bg);
  }
  .main { flex: 1; padding: 32px 40px 80px; max-width: 900px; }

  /* ── Sidebar ToC ── */
  .toc-heading {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .14em; color: var(--text3); padding: 0 16px 8px;
  }
  .toc-gf {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 16px; font-size: 12px; font-weight: 600;
    color: var(--text2); text-decoration: none; border-left: 2px solid transparent;
    transition: all .12s;
  }
  .toc-gf:hover { color: var(--accent); border-left-color: var(--accent); background: var(--accent-light); }
  .toc-fam {
    display: block; padding: 3px 16px 3px 32px;
    font-size: 11px; color: var(--text3); text-decoration: none;
    transition: color .12s;
  }
  .toc-fam:hover { color: var(--accent); }
  .toc-sep { height: 1px; background: var(--border); margin: 8px 12px; }

  /* ── Cover ── */
  .cover {
    min-height: calc(100vh - 52px);
    display: flex; flex-direction: column; justify-content: center;
    padding: 60px 0; margin-bottom: 60px;
    border-bottom: 2px solid var(--border);
  }
  .cover-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--accent-light); color: var(--accent);
    font-size: 11px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; padding: 6px 14px; border-radius: 99px;
    margin-bottom: 28px; width: fit-content;
  }
  .cover h1 {
    font-size: 40px; font-weight: 800; letter-spacing: -.04em;
    line-height: 1.05; color: var(--text); margin-bottom: 14px;
  }
  .cover h1 span { color: var(--accent); }
  .cover-sub { font-size: 16px; color: var(--text2); margin-bottom: 44px; max-width: 520px; }
  .cover-stats {
    display: flex; gap: 32px; flex-wrap: wrap;
    padding: 24px 0; border-top: 1px solid var(--border);
  }
  .stat-item { }
  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: var(--text3); margin-bottom: 4px; }
  .stat-value { font-size: 28px; font-weight: 800; color: var(--accent); }
  .stat-desc { font-size: 12px; color: var(--text2); }

  /* ── Section headers ── */
  .gf-header {
    display: flex; align-items: center; gap: 14px;
    padding: 18px 24px; border-radius: 12px;
    background: var(--accent-light); margin-bottom: 24px;
    border-left: 4px solid var(--accent); scroll-margin-top: 70px;
  }
  .gf-icon { font-size: 22px; }
  .gf-title { font-size: 18px; font-weight: 800; color: var(--accent); }
  .gf-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }

  .famille-header {
    display: flex; align-items: center; gap: 10px;
    margin: 32px 0 16px; padding-bottom: 10px;
    border-bottom: 2px solid var(--border); scroll-margin-top: 70px;
  }
  .famille-code {
    font-family: monospace; font-size: 11px; font-weight: 700;
    background: var(--code-bg); color: var(--text3);
    padding: 2px 7px; border-radius: 4px;
  }
  .famille-label { font-size: 15px; font-weight: 700; color: var(--text); }
  .famille-count { font-size: 11px; color: var(--text3); margin-left: auto; }

  /* ── Code cards ── */
  .code-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 10px; padding: 16px 18px; margin-bottom: 10px;
    transition: box-shadow .15s;
  }
  .code-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.08); }

  .code-card-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
  .code-badge {
    font-family: monospace; font-size: 11px; font-weight: 700;
    background: var(--code-bg); color: var(--text2);
    padding: 4px 10px; border-radius: 6px; white-space: nowrap; flex-shrink: 0;
  }
  .code-label { font-size: 14px; font-weight: 600; color: var(--text); flex: 1; }
  .tag-chip {
    font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 99px;
    white-space: nowrap;
  }

  .code-desc {
    font-size: 12px; color: var(--text2); line-height: 1.55;
    margin-bottom: 10px; padding: 10px 12px;
    background: var(--bg); border-radius: 6px; border: 1px solid var(--border);
  }

  .code-meta {
    display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;
  }
  .meta-pill {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; padding: 4px 10px; border-radius: 99px;
    background: var(--bg); border: 1px solid var(--border); color: var(--text2);
  }
  .meta-pill strong { color: var(--text); }

  .see-also {
    margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);
  }
  .see-also-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .12em; color: var(--text3); margin-bottom: 6px;
    display: flex; align-items: center; gap: 6px;
  }
  .see-also-label::before { content: '↪'; color: var(--accent); }
  .see-also-links { display: flex; flex-wrap: wrap; gap: 6px; }
  .see-also-link {
    font-size: 11px; padding: 3px 10px; border-radius: 6px;
    background: var(--bg3); color: var(--text2);
    text-decoration: none; border: 1px solid var(--border);
    transition: all .12s;
  }
  .see-also-link:hover { background: var(--accent-light); color: var(--accent); border-color: var(--accent-mid); }

  /* ── Conformité ── */
  .badge-ok  { display:inline-flex; align-items:center; gap:4px; padding: 3px 9px; border-radius: 99px; background: #d1fae5; color: #059669; font-weight: 700; font-size: 10px; }
  .badge-ko  { display:inline-flex; align-items:center; gap:4px; padding: 3px 9px; border-radius: 99px; background: #fee2e2; color: #dc2626; font-weight: 700; font-size: 10px; }

  /* ── Footer ── */
  .footer {
    margin-top: 60px; padding: 24px 0; border-top: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    color: var(--text3); font-size: 11px;
  }

  /* ── Print ── */
  @media print {
    .toolbar, .sidebar, .btn { display: none !important; }
    .layout { display: block; padding-top: 0; }
    .main { padding: 20px; max-width: 100%; }
    .cover { min-height: auto; page-break-after: always; }
    .gf-header { page-break-before: always; }
    .code-card { page-break-inside: avoid; }
    @page { margin: 12mm 10mm; size: A4 portrait; }
  }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { padding: 20px; }
    .cover h1 { font-size: 28px; }
  }
</style>
</head>
<body>

<!-- Toolbar -->
<div class="toolbar">
  {{if .LogoURL}}
  <img src="{{.LogoURL}}" alt="Logo" style="height:28px;object-fit:contain;margin-right:4px">
  {{end}}
  <span class="toolbar-title">Guide de nomenclature des achats</span>
  <button class="btn" onclick="toggleDark()" id="dark-btn">☾ Mode sombre</button>
  <button class="btn btn-primary" onclick="window.print()">⬇ Imprimer / PDF</button>
</div>

<div class="layout">

  <!-- Sidebar — Table of contents -->
  <nav class="sidebar">
    <div class="toc-heading">Table des matières</div>
    <a href="#cover" class="toc-gf" style="font-size:11px;font-weight:500">↑ Introduction</a>
    <div class="toc-sep"></div>
    {{range .Sections}}
    <a href="#{{anchorGF .Code}}" class="toc-gf">
      <span>{{.Code}}</span>
      <span>{{.Label}}</span>
    </a>
    {{range .Familles}}
    <a href="#{{.Anchor}}" class="toc-fam">{{.Code}} – {{.Label}}</a>
    {{end}}
    <div class="toc-sep"></div>
    {{end}}
  </nav>

  <!-- Main content -->
  <main class="main">

    <!-- Cover -->
    <div class="cover" id="cover">
      <div class="cover-badge">
        📋 Guide pédagogique
      </div>
      <h1>Nomenclature des<br><span>achats publics</span></h1>
      <p class="cover-sub">
        Guide destiné aux agents saisisseurs — acheteurs, gestionnaires financiers.
        Retrouvez la définition de chaque code, les prestations incluses et les redirections entre familles.
      </p>
      <div class="cover-stats">
        <div class="stat-item">
          <div class="stat-label">Codes de prestations</div>
          <div class="stat-value">{{.TotalCodes}}</div>
          <div class="stat-desc">entrées référencées</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Familles d'achats</div>
          <div class="stat-value">{{.TotalFamilles}}</div>
          <div class="stat-desc">groupements fonctionnels</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Grandes familles</div>
          <div class="stat-value">{{len .Sections}}</div>
          <div class="stat-desc">catégories principales</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Généré le</div>
          <div class="stat-value" style="font-size:16px;margin-top:6px">{{.GeneratedAt}}</div>
          <div class="stat-desc">se met à jour automatiquement</div>
        </div>
      </div>
    </div>

    <!-- Sections per grande-famille -->
    {{range .Sections}}
    <div id="{{anchorGF .Code}}">
      <div class="gf-header">
        <div>
          <div class="gf-title">{{.Code}} — {{.Label}}</div>
          <div class="gf-sub">Grande famille · {{len .Familles}} famille(s) · {{len .Rows}} code(s)</div>
        </div>
        {{if .Tag}}
        <span class="tag-chip" style="background:#{{tagColor .Tag}}22;color:#{{tagColor .Tag}}">{{.Tag}}</span>
        {{end}}
      </div>

      {{range .Familles}}
      <div id="{{.Anchor}}">
        <div class="famille-header">
          <span class="famille-code">{{.Code}}</span>
          <span class="famille-label">{{.Label}}</span>
          <span class="famille-count">{{len .Rows}} code(s)</span>
        </div>

        {{range .Rows}}
        <div class="code-card">
          <div class="code-card-head">
            <span class="code-badge">{{.CodeStr}}</span>
            <span class="code-label">{{.Label}}</span>
            {{if .Tag}}
            <span class="tag-chip" style="background:#{{tagColor .Tag}}22;color:#{{tagColor .Tag}}">{{.Tag}}</span>
            {{end}}
            {{if .Conforme}}<span class="badge-ok">✓ Conforme</span>{{else}}<span class="badge-ko">⚠ Non conforme</span>{{end}}
          </div>

          {{if hasDesc .Description}}
          <div class="code-desc">{{.Description}}</div>
          {{end}}

          <div class="code-meta">
            <span class="meta-pill">Seuil MAPA <strong>{{fmtFull .SeuilMapa}}</strong></span>
            <span class="meta-pill">Seuil AO <strong>{{fmtFull .SeuilAO}}</strong></span>
            {{if .Montant}}<span class="meta-pill">Dépenses <strong>{{fmtEur .Montant}}</strong></span>{{end}}
            {{if .CPVCode}}<span class="meta-pill">CPV <strong>{{.CPVCode}}</strong></span>{{end}}
          </div>

          {{if .SeeAlso}}
          <div class="see-also">
            <div class="see-also-label">Vous recherchez peut-être ?</div>
            <div class="see-also-links">
              {{range .SeeAlso}}
              <a class="see-also-link" href="#fam-{{anchorFam $.FamilleCode}}" title="{{.Label}}">
                {{.Code}} – {{.Label}}
              </a>
              {{end}}
            </div>
          </div>
          {{end}}
        </div>
        {{end}}

      </div>
      {{end}}
    </div>
    {{end}}

    <div class="footer">
      <span>Guide pédagogique de nomenclature des achats publics</span>
      <span>Généré le {{.GeneratedAt}} · STRATT ERP · Se met à jour automatiquement</span>
    </div>
  </main>
</div>

<script>
  // Highlight active section in ToC on scroll
  const tocLinks = document.querySelectorAll('.sidebar a[href^="#"]');
  const sections = [...tocLinks].map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);

  function onScroll() {
    let current = sections[0]?.id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top < 80) current = s.id;
    }
    tocLinks.forEach(a => {
      const active = a.getAttribute('href') === '#' + current;
      a.style.color = active ? 'var(--accent)' : '';
      a.style.borderLeftColor = active && a.classList.contains('toc-gf') ? 'var(--accent)' : '';
      a.style.background = active && a.classList.contains('toc-gf') ? 'var(--accent-light)' : '';
    });
  }
  window.addEventListener('scroll', onScroll, {passive: true});
  onScroll();

  // Dark mode toggle
  function toggleDark() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? '' : 'dark');
    document.getElementById('dark-btn').textContent = isDark ? '☾ Mode sombre' : '☀ Mode clair';
  }
  // Init button label
  {{if .DarkMode}}
  document.getElementById('dark-btn').textContent = '☀ Mode clair';
  {{end}}
</script>
</body>
</html>`
