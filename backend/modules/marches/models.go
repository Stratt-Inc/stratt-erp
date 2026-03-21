package marches

import (
	"time"

	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

type Marche struct {
	models.Base
	TenantID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Reference       string     `gorm:"not null;index"           json:"reference"`
	Objet           string     `gorm:"not null"                 json:"objet"`
	Service         string     `json:"service"`
	Montant         float64    `gorm:"default:0"                json:"montant"`
	Procedure       string     `json:"procedure"`
	Echeance        string     `json:"echeance"`
	Statut          string     `gorm:"default:'planifie'"       json:"statut"`
	Priorite        string     `gorm:"default:'normale'"        json:"priorite"`
	Charge          int        `gorm:"default:0"                json:"charge"`
	Notes           string     `json:"notes"`
	Categorie       string     `gorm:"default:''"               json:"categorie"`    // Fournitures | Services | Travaux
	FamilleCode     string     `gorm:"default:''"               json:"famille_code"` // e.g. "16", "T-BAT"
	DateLancement   *time.Time `json:"date_lancement"`
	DateAttribution *time.Time `json:"date_attribution"`
	DateFin         *time.Time `json:"date_fin"`
}
