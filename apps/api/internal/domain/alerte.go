package domain

import (
	"time"

	"github.com/google/uuid"
)

type AlerteSeverity string

const (
	AlerteSeverityCritique AlerteSeverity = "critique"
	AlerteSeverityHaute    AlerteSeverity = "haute"
	AlerteSeverityMoyenne  AlerteSeverity = "moyenne"
	AlerteSeverityInfo     AlerteSeverity = "info"
)

type AlerteType string

const (
	AlerteTypeFractionnement          AlerteType = "fractionnement"
	AlerteTypeSeuilProcedure          AlerteType = "seuil_procedure"
	AlerteTypeRenouvellement          AlerteType = "renouvellement"
	AlerteTypeClassificationManquante AlerteType = "classification_manquante"
	AlerteTypeSansJustification       AlerteType = "marche_sans_justification"
)

// Alerte represents a compliance or regulatory alert.
type Alerte struct {
	ID             uuid.UUID      `json:"id"`
	OrgID          uuid.UUID      `json:"org_id"`
	Type           AlerteType     `json:"type"`
	Severity       AlerteSeverity `json:"severity"`
	Titre          string         `json:"titre"`
	Message        string         `json:"message"`
	Resolue        bool           `json:"resolue"`
	ResolueAt      *time.Time     `json:"resolue_at,omitempty"`
	ResolueParID   *uuid.UUID     `json:"resolue_par_id,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// AlerteRepository defines the interface for alerte persistence.
type AlerteRepository interface {
	FindByOrgID(orgID uuid.UUID, resolue *bool) ([]*Alerte, error)
	Create(a *Alerte) error
	Resolve(id uuid.UUID, resolueParID uuid.UUID) error
}
