package marches

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"github.com/xuri/excelize/v2"
)

// ── Column detection ──────────────────────────────────────────────────────────

// knownColumns maps normalised header variations to canonical Marche field names.
var knownColumns = map[string]string{
	// reference
	"reference": "reference", "ref": "reference", "n°": "reference", "numero": "reference", "num": "reference",
	// objet
	"objet": "objet", "libelle": "objet", "designation": "objet", "intitule": "objet", "titre": "objet",
	// service
	"service": "service", "direction": "service", "departement": "service", "entite": "service",
	// montant
	"montant": "montant", "montant_ht": "montant", "budget": "montant", "valeur": "montant", "prix": "montant",
	// procedure
	"procedure": "procedure", "type_procedure": "procedure", "mode_passation": "procedure",
	// statut
	"statut": "statut", "etat": "statut", "status": "statut",
	// priorite
	"priorite": "priorite", "priorité": "priorite", "urgence": "priorite",
	// categorie
	"categorie": "categorie", "catégorie": "categorie", "type": "categorie", "nature": "categorie",
	// famille_code
	"famille_code": "famille_code", "famille": "famille_code", "code_famille": "famille_code",
	// dates
	"echeance": "echeance", "échéance": "echeance", "date_echeance": "echeance",
	"date_lancement": "date_lancement", "lancement": "date_lancement",
	"date_attribution": "date_attribution", "attribution": "date_attribution",
	"date_fin": "date_fin", "fin": "date_fin",
	// notes
	"notes": "notes", "commentaires": "notes", "observations": "notes",
}

func normaliseHeader(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		switch {
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			b.WriteRune(r)
		case r == '_' || r == '-' || r == ' ':
			b.WriteRune('_')
		}
	}
	// collapse repeated underscores
	res := b.String()
	for strings.Contains(res, "__") {
		res = strings.ReplaceAll(res, "__", "_")
	}
	return strings.Trim(res, "_")
}

// ── Row parsing ───────────────────────────────────────────────────────────────

func parseDate(s string) *time.Time {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	formats := []string{
		"2006-01-02", "02/01/2006", "01/02/2006",
		"02-01-2006", "2006/01/02", "02.01.2006",
	}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return &t
		}
	}
	return nil
}

func parseMontant(s string) float64 {
	s = strings.TrimSpace(s)
	// remove spaces, commas used as thousands separators
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "\u00a0", "") // non-breaking space
	s = strings.ReplaceAll(s, ",", ".")
	// strip currency symbols
	s = strings.Trim(s, "€$£")
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

func normaliseStatut(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "planifié", "planifie", "planned":
		return "planifie"
	case "en cours", "en_cours", "active", "actif":
		return "en_cours"
	case "terminé", "termine", "done", "closed", "clôturé":
		return "termine"
	case "annulé", "annule", "cancelled", "canceled":
		return "annule"
	case "alerte", "alert", "warning":
		return "alerte"
	}
	return "planifie" // default
}

// ── Preview / Confirm structs ─────────────────────────────────────────────────

type ColumnMapping struct {
	Index    int    `json:"index"`
	Header   string `json:"header"`
	Detected string `json:"detected"` // auto-detected Marche field or ""
}

type PreviewRow map[string]string // raw cell values, keyed by column index string

type ImportPreviewResponse struct {
	Filename  string          `json:"filename"`
	TotalRows int             `json:"total_rows"`
	Columns   []ColumnMapping `json:"columns"`
	Preview   []PreviewRow    `json:"preview"` // first 5 rows
}

type ConfirmMapping struct {
	Index int    `json:"index"` // column index in the file
	Field string `json:"field"` // Marche field to map to, "" = skip
}

type ImportConfirmResponse struct {
	Imported int      `json:"imported"`
	Skipped  int      `json:"skipped"`
	Errors   []string `json:"errors"`
}

// ── File reading helpers ──────────────────────────────────────────────────────

func readFileRows(fh *multipart.FileHeader) ([][]string, error) {
	f, err := fh.Open()
	if err != nil {
		return nil, err
	}
	defer f.Close()

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	switch ext {
	case ".csv", ".txt":
		return readCSVRows(f)
	case ".xlsx", ".xls":
		return readExcelRows(f)
	}
	return nil, fmt.Errorf("format non supporté: %s (accepté: .csv, .xlsx)", ext)
}

func readCSVRows(r io.Reader) ([][]string, error) {
	buf, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	// try semicolon first (French Excel default), fallback to comma
	for _, sep := range []rune{';', ',', '\t'} {
		rd := csv.NewReader(bytes.NewReader(buf))
		rd.Comma = sep
		rd.LazyQuotes = true
		rd.TrimLeadingSpace = true
		rows, err := rd.ReadAll()
		if err == nil && len(rows) > 0 && len(rows[0]) > 1 {
			return rows, nil
		}
	}
	// last resort: comma
	rd := csv.NewReader(bytes.NewReader(buf))
	rd.LazyQuotes = true
	return rd.ReadAll()
}

func readExcelRows(r io.Reader) ([][]string, error) {
	buf, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	f, err := excelize.OpenReader(bytes.NewReader(buf))
	if err != nil {
		return nil, err
	}
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("aucune feuille trouvée")
	}
	return f.GetRows(sheets[0])
}

// ── Handlers ─────────────────────────────────────────────────────────────────

// POST /marches/import/preview
// Accepts a multipart file (.csv or .xlsx), returns detected column mapping + first 5 rows.
func (h *Handler) ImportPreview(c *gin.Context) {
	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, models.Err("fichier manquant (champ: file)"))
		return
	}
	if fh.Size > 10<<20 { // 10 MB
		c.JSON(413, models.Err("fichier trop volumineux (max 10 Mo)"))
		return
	}

	rows, err := readFileRows(fh)
	if err != nil {
		c.JSON(400, models.Err(err.Error()))
		return
	}
	if len(rows) < 2 {
		c.JSON(422, models.Err("le fichier doit contenir au moins une ligne d'en-tête et une ligne de données"))
		return
	}

	headers := rows[0]
	columns := make([]ColumnMapping, len(headers))
	for i, h := range headers {
		norm := normaliseHeader(h)
		detected := knownColumns[norm]
		columns[i] = ColumnMapping{Index: i, Header: h, Detected: detected}
	}

	// Build preview rows (up to 5 data rows)
	preview := make([]PreviewRow, 0, 5)
	for _, row := range rows[1:] {
		if len(preview) >= 5 {
			break
		}
		pr := make(PreviewRow)
		for i, cell := range row {
			pr[strconv.Itoa(i)] = cell
		}
		preview = append(preview, pr)
	}

	c.JSON(200, models.OK(ImportPreviewResponse{
		Filename:  fh.Filename,
		TotalRows: len(rows) - 1,
		Columns:   columns,
		Preview:   preview,
	}))
}

// POST /marches/import/confirm
// Accepts multipart form: "file" (.csv/.xlsx) + "mapping" (JSON array of ConfirmMapping).
func (h *Handler) ImportConfirm(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, models.Err("fichier manquant (champ: file)"))
		return
	}
	if fh.Size > 10<<20 {
		c.JSON(413, models.Err("fichier trop volumineux (max 10 Mo)"))
		return
	}

	rows, err := readFileRows(fh)
	if err != nil {
		c.JSON(400, models.Err(err.Error()))
		return
	}
	if len(rows) < 2 {
		c.JSON(422, models.Err("données insuffisantes"))
		return
	}

	mappingJSON := c.PostForm("mapping")
	if mappingJSON == "" {
		c.JSON(422, models.Err("champ mapping manquant"))
		return
	}

	var mapping []ConfirmMapping
	if err := json.Unmarshal([]byte(mappingJSON), &mapping); err != nil {
		c.JSON(400, models.Err("mapping invalide: "+err.Error()))
		return
	}
	if len(mapping) == 0 {
		c.JSON(422, models.Err("aucun mapping de colonne fourni"))
		return
	}

	// Build field→colIndex map (skip empty mappings)
	fieldToCol := make(map[string]int)
	for _, m := range mapping {
		if m.Field != "" {
			fieldToCol[m.Field] = m.Index
		}
	}

	cell := func(row []string, field string) string {
		idx, ok := fieldToCol[field]
		if !ok || idx >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[idx])
	}

	var imported, skipped int
	var errs []string

	for i, row := range rows[1:] { // skip header
		ref := cell(row, "reference")
		objet := cell(row, "objet")
		if ref == "" && objet == "" {
			skipped++
			continue
		}
		if objet == "" {
			objet = ref
		}
		if ref == "" {
			ref = fmt.Sprintf("IMP-%d", i+1)
		}

		m := Marche{
			TenantID:  orgID,
			Reference: ref,
			Objet:     objet,
			Service:   cell(row, "service"),
			Procedure: cell(row, "procedure"),
			Statut:    normaliseStatut(cell(row, "statut")),
			Priorite:  cell(row, "priorite"),
			Categorie: cell(row, "categorie"),
			FamilleCode: cell(row, "famille_code"),
			Notes:     cell(row, "notes"),
			Echeance:  cell(row, "echeance"),
		}
		m.ID = uuid.New()

		if s := cell(row, "montant"); s != "" {
			m.Montant = parseMontant(s)
		}
		m.DateLancement = parseDate(cell(row, "date_lancement"))
		m.DateAttribution = parseDate(cell(row, "date_attribution"))
		m.DateFin = parseDate(cell(row, "date_fin"))

		if err := h.db.WithContext(c.Request.Context()).Create(&m).Error; err != nil {
			errs = append(errs, fmt.Sprintf("ligne %d: %v", i+2, err))
			skipped++
		} else {
			imported++
		}
	}

	c.JSON(200, models.OK(ImportConfirmResponse{
		Imported: imported,
		Skipped:  skipped,
		Errors:   errs,
	}))
}
