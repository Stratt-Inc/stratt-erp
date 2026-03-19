package sirene

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

const cacheTTL = 7 * 24 * time.Hour

type Handler struct {
	db    *gorm.DB
	token string // INSEE OAuth2 token (from config/env)
}

func NewHandler(db *gorm.DB, inseeToken string) *Handler {
	return &Handler{db: db, token: inseeToken}
}

// GET /api/v1/sirene/lookup?siret=
// Lookup a SIRET and return enriched company data (uses cache when fresh).
func (h *Handler) Lookup(c *gin.Context) {
	siret := c.Query("siret")
	if siret == "" {
		c.JSON(400, models.Err("paramètre siret requis"))
		return
	}

	ctx := c.Request.Context()

	// Check cache first
	var cached SIRENEEnrichment
	err := h.db.WithContext(ctx).Where("siret = ?", siret).First(&cached).Error
	if err == nil && !cached.IsExpired() && cached.APIError == "" {
		c.JSON(200, models.OK(gin.H{"data": cached, "cached": true}))
		return
	}

	// Fetch from INSEE API
	data, apiErr := Lookup(siret, h.token)

	if apiErr != nil {
		// Store the error in cache so we don't hammer the API
		errEntry := SIRENEEnrichment{
			SIRET:     siret,
			FetchedAt: time.Now(),
			ExpiresAt: time.Now().Add(1 * time.Hour), // short TTL on error
			APIError:  apiErr.Error(),
		}
		if err == nil {
			h.db.WithContext(ctx).Model(&cached).Updates(errEntry)
		} else {
			h.db.WithContext(ctx).Create(&errEntry)
		}
		c.JSON(200, models.OK(gin.H{
			"data":   nil,
			"cached": false,
			"error":  apiErr.Error(),
		}))
		return
	}

	now := time.Now()
	entry := SIRENEEnrichment{
		SIRET:               siret,
		SIREN:               data.SIREN,
		DenominationSociale: data.DenominationSociale,
		Adresse:             data.Adresse,
		CodePostal:          data.CodePostal,
		Commune:             data.Commune,
		CodeNAF:             data.CodeNAF,
		FormeJuridique:      data.FormeJuridique,
		TrancheEffectifs:    data.TrancheEffectifs,
		EtatAdministratif:   data.EtatAdministratif,
		DateCreation:        data.DateCreation,
		DateCessation:       data.DateCessation,
		FetchedAt:           now,
		ExpiresAt:           now.Add(cacheTTL),
		APIError:            "",
	}

	if err == nil {
		h.db.WithContext(ctx).Model(&cached).Updates(entry)
		entry.ID = cached.ID
	} else {
		h.db.WithContext(ctx).Create(&entry)
	}

	c.JSON(200, models.OK(gin.H{"data": entry, "cached": false}))
}

// POST /api/v1/sirene/enrich/:contact_id
// Enriches a CRM contact with SIRENE data (must provide siret in body).
func (h *Handler) EnrichContact(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	contactID, err := uuid.Parse(c.Param("contact_id"))
	if err != nil {
		c.JSON(400, models.Err("invalid contact_id"))
		return
	}

	var body struct {
		SIRET string `json:"siret"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.SIRET == "" {
		c.JSON(400, models.Err("siret requis dans le body"))
		return
	}

	ctx := c.Request.Context()
	data, apiErr := Lookup(body.SIRET, h.token)

	now := time.Now()
	entry := SIRENEEnrichment{
		TenantID:  orgID,
		ContactID: contactID,
		SIRET:     body.SIRET,
		FetchedAt: now,
		ExpiresAt: now.Add(cacheTTL),
	}
	if apiErr != nil {
		entry.APIError = apiErr.Error()
		entry.ExpiresAt = now.Add(1 * time.Hour)
	} else {
		entry.SIREN = data.SIREN
		entry.DenominationSociale = data.DenominationSociale
		entry.Adresse = data.Adresse
		entry.CodePostal = data.CodePostal
		entry.Commune = data.Commune
		entry.CodeNAF = data.CodeNAF
		entry.FormeJuridique = data.FormeJuridique
		entry.TrancheEffectifs = data.TrancheEffectifs
		entry.EtatAdministratif = data.EtatAdministratif
		entry.DateCreation = data.DateCreation
		entry.DateCessation = data.DateCessation
	}

	// Upsert: update if exists for this contact, create otherwise
	var existing SIRENEEnrichment
	if dbErr := h.db.WithContext(ctx).
		Where("tenant_id = ? AND contact_id = ?", orgID, contactID).
		First(&existing).Error; dbErr == nil {
		h.db.WithContext(ctx).Model(&existing).Updates(entry)
		entry.ID = existing.ID
	} else {
		h.db.WithContext(ctx).Create(&entry)
	}

	if apiErr != nil {
		c.JSON(200, models.OK(gin.H{"enriched": false, "error": apiErr.Error()}))
		return
	}
	c.JSON(200, models.OK(gin.H{"enriched": true, "data": entry}))
}

// GET /api/v1/sirene/enrichments
// Returns all cached enrichments for the organisation.
func (h *Handler) ListEnrichments(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var enrichments []SIRENEEnrichment
	h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("fetched_at DESC").
		Find(&enrichments)
	c.JSON(200, models.OK(enrichments))
}

// GET /api/v1/sirene/alerts
// Returns enrichments for suppliers that are INACTIVE or CEASED per SIRENE.
func (h *Handler) Alerts(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var enrichments []SIRENEEnrichment
	h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ? AND etat_administratif = 'C'", orgID).
		Order("fetched_at DESC").
		Find(&enrichments)
	c.JSON(200, models.OK(gin.H{
		"count":  len(enrichments),
		"alerts": enrichments,
	}))
}

// DELETE /api/v1/sirene/enrichments/:contact_id
// Clears the cached enrichment for a contact (forces re-fetch on next enrich call).
func (h *Handler) ClearCache(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	contactID, err := uuid.Parse(c.Param("contact_id"))
	if err != nil {
		c.JSON(400, models.Err("invalid contact_id"))
		return
	}
	h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ? AND contact_id = ?", orgID, contactID).
		Delete(&SIRENEEnrichment{})
	c.JSON(200, models.Msg("cache effacé"))
}
