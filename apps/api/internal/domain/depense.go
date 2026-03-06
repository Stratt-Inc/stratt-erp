package domain

import (
	"time"

	"github.com/google/uuid"
)

type ImportJobStatut string

const (
	ImportJobStatutEnAttente ImportJobStatut = "en_attente"
	ImportJobStatutEnCours   ImportJobStatut = "en_cours"
	ImportJobStatutTermine   ImportJobStatut = "termine"
	ImportJobStatutErreur    ImportJobStatut = "erreur"
)

// Depense represents a procurement expenditure line.
type Depense struct {
	ID                uuid.UUID  `json:"id"`
	OrgID             uuid.UUID  `json:"org_id"`
	Reference         string     `json:"reference"`
	Libelle           string     `json:"libelle"`
	Montant           float64    `json:"montant"`
	DateDepense       time.Time  `json:"date_depense"`
	Fournisseur       *string    `json:"fournisseur,omitempty"`
	CodeNomenclature  *string    `json:"code_nomenclature,omitempty"`
	MarcheID          *uuid.UUID `json:"marche_id,omitempty"`
	DirectionAcheuse  *string    `json:"direction_acheteuse,omitempty"`
	ClassifieParIA    bool       `json:"classifie_par_ia"`
	ConfidenceIA      *float64   `json:"confidence_ia,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// DepenseRepository defines the interface for depense persistence.
type DepenseRepository interface {
	FindByOrgID(orgID uuid.UUID, page, pageSize int) ([]*Depense, int, error)
	Create(d *Depense) error
	BulkCreate(depenses []*Depense) error
	UpdateClassification(id uuid.UUID, code string, confidence float64, byIA bool) error
}
