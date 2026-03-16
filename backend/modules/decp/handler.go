package decp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	marchesmod "github.com/stratt/backend/modules/marches"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// procedureLabel maps internal procedure codes to DECP official labels.
var procedureLabel = map[string]string{
	"MAPA":              "Procédure adaptée",
	"AO":                "Appel d'offres ouvert",
	"AO_ouvert":         "Appel d'offres ouvert",
	"AO_restreint":      "Appel d'offres restreint",
	"negocie":           "Procédure négociée",
	"dialogue":          "Dialogue compétitif",
	"dialogue_competitif": "Dialogue compétitif",
	"concours":          "Concours",
	"gre_a_gre":         "Marché négocié sans publicité ni mise en concurrence préalable",
}

func normaliseProcedure(p string) string {
	if label, ok := procedureLabel[p]; ok {
		return label
	}
	if p != "" {
		return p
	}
	return "Procédure adaptée"
}

func marcheToDecp(m marchesmod.Marche, now time.Time) DECPMarche {
	uid := fmt.Sprintf("%s-%s", m.TenantID.String()[:8], m.Reference)

	dateNotif := ""
	if m.DateAttribution != nil {
		dateNotif = m.DateAttribution.Format("2006-01-02")
	}

	dureeMois := 0
	if m.DateAttribution != nil && m.DateFin != nil {
		months := (m.DateFin.Year()-m.DateAttribution.Year())*12 +
			int(m.DateFin.Month()-m.DateAttribution.Month())
		if months > 0 {
			dureeMois = months
		}
	}

	return DECPMarche{
		UID:  uid,
		Type: "Marché",
		Acheteur: DECPAcheteur{
			ID:  m.TenantID.String(),
			Nom: m.Service,
		},
		Nature:  "Marché",
		Objet:   m.Objet,
		Procedure: normaliseProcedure(m.Procedure),
		LieuExecution: DECPLieu{
			Code:     "FR",
			TypeCode: "Code pays",
			Nom:      "France",
		},
		DureeMois:              dureeMois,
		DateNotification:       dateNotif,
		DatePublicationDonnees: now.Format("2006-01-02"),
		Montant:                m.Montant,
		TauxAvance:             0,
		Titulaires:             []DECPTitulaire{},
		Modifications:          []interface{}{},
	}
}

func validateMarche(m marchesmod.Marche, d DECPMarche) []ValidationError {
	var errs []ValidationError
	if m.Objet == "" {
		errs = append(errs, ValidationError{MarcheUID: d.UID, Reference: m.Reference, Field: "objet", Message: "objet ne peut pas être vide"})
	}
	if m.Montant <= 0 {
		errs = append(errs, ValidationError{MarcheUID: d.UID, Reference: m.Reference, Field: "montant", Message: "montant doit être supérieur à 0"})
	}
	if m.DateAttribution == nil {
		errs = append(errs, ValidationError{MarcheUID: d.UID, Reference: m.Reference, Field: "dateNotification", Message: "date_attribution manquante (requis pour DECP)"})
	}
	if m.Service == "" {
		errs = append(errs, ValidationError{MarcheUID: d.UID, Reference: m.Reference, Field: "acheteur.nom", Message: "service (acheteur) manquant"})
	}
	return errs
}

// GET /api/v1/decp/export
// Returns the DECP v2 JSON payload for all non-cancelled marchés.
func (h *Handler) Export(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	var marchesList []marchesmod.Marche
	if err := h.db.WithContext(ctx).
		Where("tenant_id = ? AND statut != 'annule'", orgID).
		Order("created_at ASC").
		Find(&marchesList).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch marchés"))
		return
	}

	now := time.Now()
	payload := DECPPayload{Marches: make([]DECPMarche, 0, len(marchesList))}
	for _, m := range marchesList {
		payload.Marches = append(payload.Marches, marcheToDecp(m, now))
	}

	c.JSON(200, models.OK(payload))
}

// GET /api/v1/decp/validate
// Returns validation errors without publishing.
func (h *Handler) Validate(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	var marchesList []marchesmod.Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ? AND statut != 'annule'", orgID).
		Find(&marchesList)

	now := time.Now()
	var allErrors []ValidationError
	valid := 0
	for _, m := range marchesList {
		d := marcheToDecp(m, now)
		errs := validateMarche(m, d)
		if len(errs) == 0 {
			valid++
		}
		allErrors = append(allErrors, errs...)
	}

	c.JSON(200, models.OK(gin.H{
		"total":         len(marchesList),
		"valid":         valid,
		"invalid":       len(marchesList) - valid,
		"errors":        allErrors,
		"errors_count":  len(allErrors),
	}))
}

// POST /api/v1/decp/publish
// Validates, generates DECP JSON, publishes to data.gouv.fr (if API key configured),
// and stores the publication in history.
func (h *Handler) Publish(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	var marchesList []marchesmod.Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ? AND statut != 'annule'", orgID).
		Find(&marchesList)

	now := time.Now()
	payload := DECPPayload{Marches: make([]DECPMarche, 0, len(marchesList))}
	var allErrors []ValidationError
	for _, m := range marchesList {
		d := marcheToDecp(m, now)
		allErrors = append(allErrors, validateMarche(m, d)...)
		payload.Marches = append(payload.Marches, d)
	}

	var body struct {
		APIKey    string `json:"api_key"`
		DatasetID string `json:"dataset_id"`
	}
	_ = c.ShouldBindJSON(&body)

	errJSON, _ := json.Marshal(allErrors)
	pub := DECPPublication{
		TenantID:     orgID,
		MarchesCount: len(marchesList),
		ErrorsJSON:   string(errJSON),
	}

	apiKey := body.APIKey
	datasetID := body.DatasetID
	dataGouvID := ""

	if apiKey != "" && datasetID != "" {
		jsonBytes, _ := json.Marshal(payload)
		dataGouvID, _ = publishToDataGouv(apiKey, datasetID, jsonBytes)
	}

	status := "success"
	if len(allErrors) > 0 {
		status = "published_with_warnings"
	}
	if apiKey == "" || datasetID == "" {
		status = "generated" // not sent to data.gouv.fr, just generated locally
	}
	pub.Status = status
	pub.DataGouvID = dataGouvID
	t := now
	pub.PublishedAt = &t

	h.db.WithContext(ctx).Create(&pub)

	c.JSON(200, models.OK(gin.H{
		"status":        status,
		"marches_count": len(marchesList),
		"errors_count":  len(allErrors),
		"errors":        allErrors,
		"data_gouv_id":  dataGouvID,
		"payload":       payload,
	}))
}

// GET /api/v1/decp/history
func (h *Handler) History(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var pubs []DECPPublication
	h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("created_at DESC").
		Limit(50).
		Find(&pubs)
	c.JSON(200, models.OK(pubs))
}

// GET /api/v1/decp/compliance
// Returns a per-marché compliance report.
func (h *Handler) Compliance(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	var marchesList []marchesmod.Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ? AND statut != 'annule'", orgID).
		Find(&marchesList)

	now := time.Now()
	type row struct {
		Reference string           `json:"reference"`
		Objet     string           `json:"objet"`
		Valid     bool             `json:"valid"`
		Errors    []ValidationError `json:"errors"`
	}
	var report []row
	totalValid := 0
	for _, m := range marchesList {
		d := marcheToDecp(m, now)
		errs := validateMarche(m, d)
		valid := len(errs) == 0
		if valid {
			totalValid++
		}
		report = append(report, row{
			Reference: m.Reference,
			Objet:     m.Objet,
			Valid:     valid,
			Errors:    errs,
		})
	}

	conformityRate := 0.0
	if len(marchesList) > 0 {
		conformityRate = float64(totalValid) / float64(len(marchesList)) * 100
	}

	c.JSON(200, models.OK(gin.H{
		"total":           len(marchesList),
		"valid":           totalValid,
		"invalid":         len(marchesList) - totalValid,
		"conformity_rate": conformityRate,
		"report":          report,
	}))
}

// publishToDataGouv uploads the DECP JSON to data.gouv.fr as a resource on the given dataset.
// Returns the resource ID on success.
func publishToDataGouv(apiKey, datasetID string, payload []byte) (string, error) {
	url := fmt.Sprintf("https://www.data.gouv.fr/api/1/datasets/%s/resources/", datasetID)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("X-API-KEY", apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("data.gouv.fr error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		ID string `json:"id"`
	}
	json.Unmarshal(body, &result)
	return result.ID, nil
}
