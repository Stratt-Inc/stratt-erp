package domain

import (
	"time"

	"github.com/google/uuid"
)

// NomenclatureCode represents a procurement nomenclature code.
type NomenclatureCode struct {
	ID          uuid.UUID  `json:"id"`
	OrgID       uuid.UUID  `json:"org_id"`
	Code        string     `json:"code"`
	Libelle     string     `json:"libelle"`
	Description *string    `json:"description,omitempty"`
	ParentCode  *string    `json:"parent_code,omitempty"`
	Niveau      int        `json:"niveau"`
	Actif       bool       `json:"actif"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// NomenclatureRepository defines the interface for nomenclature persistence.
type NomenclatureRepository interface {
	FindByOrgID(orgID uuid.UUID) ([]*NomenclatureCode, error)
	FindByCode(orgID uuid.UUID, code string) (*NomenclatureCode, error)
	Create(nc *NomenclatureCode) error
	Update(nc *NomenclatureCode) error
}
