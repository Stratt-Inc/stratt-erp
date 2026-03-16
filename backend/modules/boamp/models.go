package boamp

import (
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

// BOAMPVeille stores a saved watch configuration for automatic AO monitoring.
type BOAMPVeille struct {
	models.Base
	TenantID    uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Nom         string    `gorm:"not null"                 json:"nom"`
	CodesCPV    string    `json:"codes_cpv"`    // comma-separated CPV codes
	Departement string    `json:"departement"`  // e.g. "75", "69", ""
	MotsCles    string    `json:"mots_cles"`    // keyword filter
	MontantMin  float64   `gorm:"default:0"    json:"montant_min"`
	MontantMax  float64   `gorm:"default:0"    json:"montant_max"` // 0 = no upper limit
	Active      bool      `gorm:"default:true" json:"active"`
}

// BOAMPAvis is a single "avis de marché" returned by the BOAMP API.
type BOAMPAvis struct {
	Reference        string  `json:"reference"`
	Titre            string  `json:"titre"`
	Objet            string  `json:"objet"`
	Acheteur         string  `json:"acheteur"`
	Departement      string  `json:"departement"`
	CodeCPV          string  `json:"code_cpv"`
	Procedure        string  `json:"procedure"`
	DatePublication  string  `json:"date_publication"`
	DateLimite       string  `json:"date_limite"`
	Montant          float64 `json:"montant"`
	TypeAvis         string  `json:"type_avis"` // AAPC, MAPA, attribution, etc.
	URL              string  `json:"url"`
}
