package sirene

import (
	"time"

	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

// SIRENEEnrichment stores the enriched data fetched from INSEE SIRENE API
// for a given contact (fournisseur). Acts as a local cache with TTL.
type SIRENEEnrichment struct {
	models.Base
	TenantID   uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	ContactID  uuid.UUID `gorm:"type:uuid;not null;index" json:"contact_id"`
	SIRET      string    `gorm:"not null;index"           json:"siret"`
	SIREN      string    `json:"siren"`

	// Données légales
	DenominationSociale string `json:"denomination_sociale"`
	Adresse             string `json:"adresse"`
	CodePostal          string `json:"code_postal"`
	Commune             string `json:"commune"`
	CodeNAF             string `json:"code_naf"`
	LibelleNAF          string `json:"libelle_naf"`
	FormeJuridique      string `json:"forme_juridique"`
	TrancheEffectifs    string `json:"tranche_effectifs"`

	// Statut
	EtatAdministratif string `json:"etat_administratif"` // A = actif, C = cessé
	DateCreation      string `json:"date_creation"`
	DateCessation     string `json:"date_cessation"`

	// Cache metadata
	FetchedAt  time.Time `json:"fetched_at"`
	ExpiresAt  time.Time `json:"expires_at"` // TTL: 7 days by default
	APIError   string    `json:"api_error"`  // last error if fetch failed
}

// IsExpired returns true if the cache entry is older than its TTL.
func (e *SIRENEEnrichment) IsExpired() bool {
	return time.Now().After(e.ExpiresAt)
}

// IsActive returns true when the legal unit is not ceased.
func (e *SIRENEEnrichment) IsActive() bool {
	return e.EtatAdministratif == "A" || e.EtatAdministratif == ""
}

// SIRENEData is the normalized response from the INSEE API.
type SIRENEData struct {
	SIRET               string `json:"siret"`
	SIREN               string `json:"siren"`
	DenominationSociale string `json:"denomination_sociale"`
	Adresse             string `json:"adresse"`
	CodePostal          string `json:"code_postal"`
	Commune             string `json:"commune"`
	CodeNAF             string `json:"code_naf"`
	LibelleNAF          string `json:"libelle_naf"`
	FormeJuridique      string `json:"forme_juridique"`
	TrancheEffectifs    string `json:"tranche_effectifs"`
	EtatAdministratif   string `json:"etat_administratif"`
	DateCreation        string `json:"date_creation"`
	DateCessation       string `json:"date_cessation"`
}
