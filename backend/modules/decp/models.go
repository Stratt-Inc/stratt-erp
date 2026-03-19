package decp

import (
	"time"

	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

// DECPPublication tracks each publication attempt to data.gouv.fr.
type DECPPublication struct {
	models.Base
	TenantID     uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Status       string    `gorm:"default:'pending'"        json:"status"`        // pending, success, failed
	MarchesCount int       `json:"marches_count"`
	ErrorsJSON   string    `gorm:"type:text"                json:"errors_json"`   // JSON array of validation errors
	DataGouvID   string    `json:"data_gouv_id"`                                  // resource ID on data.gouv.fr
	PublishedAt  *time.Time `json:"published_at"`
}

// DECPMarche is the DECP v2 JSON representation of a single marché.
type DECPMarche struct {
	UID                   string          `json:"uid"`
	Type                  string          `json:"_type"`
	Acheteur              DECPAcheteur    `json:"acheteur"`
	Nature                string          `json:"nature"`
	Objet                 string          `json:"objet"`
	CodeCPV               string          `json:"codeCPV,omitempty"`
	Procedure             string          `json:"procedure"`
	LieuExecution         DECPLieu        `json:"lieuExecution"`
	DureeMois             int             `json:"dureeMois,omitempty"`
	DateNotification      string          `json:"dateNotification,omitempty"`
	DatePublicationDonnees string         `json:"datePublicationDonnees"`
	Montant               float64         `json:"montant"`
	TauxAvance            float64         `json:"tauxAvance"`
	Titulaires            []DECPTitulaire `json:"titulaires"`
	Modifications         []interface{}   `json:"modifications"`
}

type DECPAcheteur struct {
	ID  string `json:"id"`
	Nom string `json:"nom"`
}

type DECPLieu struct {
	Code     string `json:"code"`
	TypeCode string `json:"typeCode"`
	Nom      string `json:"nom"`
}

type DECPTitulaire struct {
	ID                  string `json:"id"`
	TypeIdentifiant     string `json:"typeIdentifiant"`
	DenominationSociale string `json:"denominationSociale"`
}

// DECPPayload is the root DECP v2 document.
type DECPPayload struct {
	Marches []DECPMarche `json:"marches"`
}

// ValidationError describes a non-conformity on a marché field.
type ValidationError struct {
	MarcheUID string `json:"marche_uid"`
	Reference string `json:"reference"`
	Field     string `json:"field"`
	Message   string `json:"message"`
}
