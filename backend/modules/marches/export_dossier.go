package marches

import (
	"archive/zip"
	"crypto/sha256"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"strings"
	"text/template"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
)

// ── SEDA v2 / Dublin Core structures ─────────────────────────────────────────

type SEDAArchiveTransfer struct {
	XMLName  xml.Name       `xml:"ArchiveTransfer"`
	Xmlns    string         `xml:"xmlns,attr"`
	Date     string         `xml:"Date"`
	MessageIdentifier string `xml:"MessageIdentifier"`
	TransferringAgency SEDAAgency `xml:"TransferringAgency"`
	ArchivalAgency     SEDAAgency `xml:"ArchivalAgency"`
	DataObjectPackage  SEDAPackage `xml:"DataObjectPackage"`
}

type SEDAAgency struct {
	Identifier string `xml:"Identifier"`
}

type SEDAPackage struct {
	DescriptiveMetadata SEDADescriptive `xml:"DescriptiveMetadata"`
}

type SEDADescriptive struct {
	ArchiveUnit SEDAArchiveUnit `xml:"ArchiveUnit"`
}

type SEDAArchiveUnit struct {
	ID      string         `xml:"id,attr"`
	Content SEDAContent    `xml:"Content"`
	Objects []SEDADataObject `xml:"DataObjectReference,omitempty"`
}

type SEDAContent struct {
	DescriptionLevel  string `xml:"DescriptionLevel"`
	Title             string `xml:"Title"`
	Description       string `xml:"Description,omitempty"`
	StartDate         string `xml:"StartDate,omitempty"`
	EndDate           string `xml:"EndDate,omitempty"`
	CustodialHistory  string `xml:"CustodialHistory>CustodialHistoryItem,omitempty"`
}

type SEDADataObject struct {
	DataObjectGroupID string `xml:"DataObjectGroupReferenceId"`
}

type DublinCore struct {
	XMLName     xml.Name `xml:"metadata"`
	Xmlns       string   `xml:"xmlns,attr"`
	Title       string   `xml:"dc:title"`
	Creator     string   `xml:"dc:creator"`
	Subject     string   `xml:"dc:subject"`
	Description string   `xml:"dc:description"`
	Date        string   `xml:"dc:date"`
	Type        string   `xml:"dc:type"`
	Format      string   `xml:"dc:format"`
	Identifier  string   `xml:"dc:identifier"`
	Source      string   `xml:"dc:source"`
	Language    string   `xml:"dc:language"`
	Rights      string   `xml:"dc:rights"`
}

// ── HTML print template for the marché fiche ─────────────────────────────────

const marcheFicheTmpl = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Dossier marché — {{.Reference}}</title>
<style>
body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;color:#1a1a2e;line-height:1.5}
h1{color:#3B6FE8;font-size:22px;margin-bottom:4px}
.ref{color:#6b7280;font-size:13px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
th{text-align:left;padding:8px 12px;background:#f3f4f6;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280}
td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}
.planifie{background:#e0e7ff;color:#3730a3}.en_cours{background:#d1fae5;color:#065f46}
.termine{background:#f3f4f6;color:#374151}.alerte{background:#fee2e2;color:#991b1b}
@media print{body{margin:20px}}
</style>
</head>
<body>
<h1>{{.Objet}}</h1>
<p class="ref">Référence : {{.Reference}} — Généré le {{.GeneratedAt}}</p>
<h2>Informations générales</h2>
<table>
<tr><th>Champ</th><th>Valeur</th></tr>
<tr><td>Statut</td><td><span class="badge {{.Statut}}">{{.Statut}}</span></td></tr>
<tr><td>Service prescripteur</td><td>{{or .Service "—"}}</td></tr>
<tr><td>Catégorie</td><td>{{or .Categorie "—"}}</td></tr>
<tr><td>Procédure</td><td>{{or .Procedure "—"}}</td></tr>
<tr><td>Montant HT</td><td>{{.MontantStr}}</td></tr>
<tr><td>Priorité</td><td>{{or .Priorite "normale"}}</td></tr>
<tr><td>Famille nomenclature</td><td>{{or .FamilleCode "—"}}</td></tr>
{{if .DateLancement}}<tr><td>Date de lancement</td><td>{{.DateLancement}}</td></tr>{{end}}
{{if .DateAttribution}}<tr><td>Date d'attribution</td><td>{{.DateAttribution}}</td></tr>{{end}}
{{if .DateFin}}<tr><td>Date de fin</td><td>{{.DateFin}}</td></tr>{{end}}
{{if .Echeance}}<tr><td>Échéance</td><td>{{.Echeance}}</td></tr>{{end}}
</table>
{{if .Notes}}<h2>Notes et observations</h2><p>{{.Notes}}</p>{{end}}
<h2>Informations d'archivage</h2>
<table>
<tr><th>Champ</th><th>Valeur</th></tr>
<tr><td>ID technique</td><td style="font-family:monospace;font-size:11px">{{.ID}}</td></tr>
<tr><td>Organisation</td><td style="font-family:monospace;font-size:11px">{{.TenantID}}</td></tr>
<tr><td>Date de création</td><td>{{.CreatedAt}}</td></tr>
<tr><td>Durée de conservation</td><td>10 ans à compter de l'achèvement (art. L3126-1 CCP)</td></tr>
</table>
<p style="font-size:11px;color:#9ca3af;margin-top:40px">
Document généré automatiquement par Axiora — Conformité art. R2182-1 CCP
</p>
</body>
</html>`

// ── Handler ───────────────────────────────────────────────────────────────────

// GET /marches/:id/export
// Returns a ZIP archive containing the marché dossier:
//   - fiche.html (print-ready)
//   - marche.json (raw data)
//   - seda_manifest.xml (SEDA v2)
//   - dublin_core.xml
//   - checksums.sha256
func (h *Handler) ExportDossier(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("id invalide"))
		return
	}

	var m Marche
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", id, orgID).
		First(&m).Error; err != nil {
		c.JSON(404, models.Err("marché introuvable"))
		return
	}

	now := time.Now()

	// ── 1. marche.json ────────────────────────────────────────────────────
	marcheJSON, _ := json.MarshalIndent(m, "", "  ")

	// ── 2. fiche.html ─────────────────────────────────────────────────────
	tmpl, _ := template.New("fiche").Parse(marcheFicheTmpl)
	var ficheHTML strings.Builder
	type ficheData struct {
		Marche
		MontantStr      string
		DateLancement   string
		DateAttribution string
		DateFin         string
		GeneratedAt     string
		CreatedAt       string
	}
	fd := ficheData{
		Marche:      m,
		MontantStr:  fmt.Sprintf("%.2f €", m.Montant),
		GeneratedAt: now.Format("02/01/2006 à 15:04"),
		CreatedAt:   m.Base.CreatedAt.Format("02/01/2006"),
	}
	if m.DateLancement   != nil { fd.DateLancement   = m.DateLancement.Format("02/01/2006") }
	if m.DateAttribution != nil { fd.DateAttribution = m.DateAttribution.Format("02/01/2006") }
	if m.DateFin         != nil { fd.DateFin         = m.DateFin.Format("02/01/2006") }
	_ = tmpl.Execute(&ficheHTML, fd)
	ficheBytes := []byte(ficheHTML.String())

	// ── 3. SEDA v2 manifest ───────────────────────────────────────────────
	seda := SEDAArchiveTransfer{
		Xmlns:             "fr:gouv:culture:archivesdefrance:seda:v2.1",
		Date:              now.Format(time.RFC3339),
		MessageIdentifier: fmt.Sprintf("AXIORA-%s-%s", m.Reference, now.Format("20060102")),
		TransferringAgency: SEDAAgency{Identifier: m.TenantID.String()},
		ArchivalAgency:     SEDAAgency{Identifier: "SAE-COLLECTIVITE"},
		DataObjectPackage: SEDAPackage{
			DescriptiveMetadata: SEDADescriptive{
				ArchiveUnit: SEDAArchiveUnit{
					ID: m.ID.String(),
					Content: SEDAContent{
						DescriptionLevel: "Item",
						Title:           fmt.Sprintf("Marché %s — %s", m.Reference, m.Objet),
						Description:     fmt.Sprintf("Dossier marché public. Service: %s. Montant: %.2f EUR. Procédure: %s.", m.Service, m.Montant, m.Procedure),
						CustodialHistory: "Produit par Axiora — exporté conformément à l'art. L3126-1 CCP",
					},
				},
			},
		},
	}
	if m.DateLancement != nil { seda.DataObjectPackage.DescriptiveMetadata.ArchiveUnit.Content.StartDate = m.DateLancement.Format("2006-01-02") }
	if m.DateFin       != nil { seda.DataObjectPackage.DescriptiveMetadata.ArchiveUnit.Content.EndDate   = m.DateFin.Format("2006-01-02") }
	sedaBytes, _ := xml.MarshalIndent(seda, "", "  ")
	sedaBytes = append([]byte(xml.Header), sedaBytes...)

	// ── 4. Dublin Core ────────────────────────────────────────────────────
	dc := DublinCore{
		Xmlns:       "http://purl.org/dc/elements/1.1/",
		Title:       fmt.Sprintf("Marché %s — %s", m.Reference, m.Objet),
		Creator:     m.TenantID.String(),
		Subject:     "Marché public — " + m.Categorie,
		Description: fmt.Sprintf("Dossier de marché public. Procédure: %s. Montant HT: %.2f EUR. Service: %s.", m.Procedure, m.Montant, m.Service),
		Date:        m.Base.CreatedAt.Format("2006-01-02"),
		Type:        "Collection",
		Format:      "application/zip",
		Identifier:  m.ID.String(),
		Source:      "Axiora ERP",
		Language:    "fr",
		Rights:      "Usage interne — Archivage réglementaire art. L3126-1 CCP",
	}
	dcBytes, _ := xml.MarshalIndent(dc, "", "  ")
	dcBytes = append([]byte(xml.Header), dcBytes...)

	// ── 5. Checksums ──────────────────────────────────────────────────────
	sum := func(b []byte) string {
		h := sha256.Sum256(b)
		return fmt.Sprintf("%x", h)
	}
	checksums := fmt.Sprintf(
		"marche.json\t%s\nfiche.html\t%s\nseda_manifest.xml\t%s\ndublin_core.xml\t%s\n",
		sum(marcheJSON), sum(ficheBytes), sum(sedaBytes), sum(dcBytes),
	)
	checksumBytes := []byte("# SHA-256 checksums\n# Generated: " + now.Format(time.RFC3339) + "\n" + checksums)

	// ── Build ZIP ─────────────────────────────────────────────────────────
	filename := fmt.Sprintf("dossier-%s-%s.zip", m.Reference, now.Format("20060102"))
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Header("Content-Type", "application/zip")

	zw := zip.NewWriter(c.Writer)
	defer zw.Close()

	files := []struct {
		name string
		data []byte
	}{
		{"marche.json", marcheJSON},
		{"fiche.html", ficheBytes},
		{"seda_manifest.xml", sedaBytes},
		{"dublin_core.xml", dcBytes},
		{"checksums.sha256", checksumBytes},
	}
	for _, f := range files {
		w, err := zw.Create(f.name)
		if err != nil { continue }
		w.Write(f.data)
	}
}
