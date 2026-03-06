package domain

import (
	"time"

	"github.com/google/uuid"
)

type MarcheStatut string

const (
	MarcheStatutPlanifie  MarcheStatut = "planifie"
	MarcheStatutEnCours   MarcheStatut = "en_cours"
	MarcheStatutAttribue  MarcheStatut = "attribue"
	MarcheStatutExecute   MarcheStatut = "execute"
	MarcheStatutClos      MarcheStatut = "clos"
	MarcheStatutAnnule    MarcheStatut = "annule"
)

type Procedure string

const (
	ProcedureMapa40K                      Procedure = "mapa_40k"
	ProcedureMapa90K                      Procedure = "mapa_90k"
	ProcedureAppelOffresOuvert            Procedure = "appel_offres_ouvert"
	ProcedureAppelOffresRestreint         Procedure = "appel_offres_restreint"
	ProcedureAccordCadre                  Procedure = "accord_cadre"
	ProcedureNegociee                     Procedure = "procedure_negociee"
	ProcedureNegocieeSansPublicite        Procedure = "marche_negociee_sans_publicite"
)

// Marche represents a public procurement contract.
type Marche struct {
	ID                uuid.UUID    `json:"id"`
	OrgID             uuid.UUID    `json:"org_id"`
	Reference         string       `json:"reference"`
	Objet             string       `json:"objet"`
	Procedure         Procedure    `json:"procedure"`
	Statut            MarcheStatut `json:"statut"`
	MontantEstime     float64      `json:"montant_estime"`
	MontantAttribue   *float64     `json:"montant_attribue,omitempty"`
	DateDebut         *time.Time   `json:"date_debut,omitempty"`
	DateFin           *time.Time   `json:"date_fin,omitempty"`
	Fournisseur       *string      `json:"fournisseur,omitempty"`
	CodeNomenclature  *string      `json:"code_nomenclature,omitempty"`
	DirectionAcheuse  *string      `json:"direction_acheteuse,omitempty"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
}

// MarcheRepository defines the interface for marche persistence.
type MarcheRepository interface {
	FindByID(id uuid.UUID) (*Marche, error)
	FindByOrgID(orgID uuid.UUID, page, pageSize int) ([]*Marche, int, error)
	Create(m *Marche) error
	Update(m *Marche) error
	Delete(id uuid.UUID) error
}
