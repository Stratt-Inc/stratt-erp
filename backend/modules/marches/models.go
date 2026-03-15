package marches

import (
	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
)

// Marche représente un marché public ou une procédure d'achat planifiée.
type Marche struct {
	models.Base
	TenantID      uuid.UUID  `gorm:"type:uuid;not null;index"  json:"tenant_id"`
	Reference     string     `gorm:"index"                     json:"reference"`
	Objet         string     `gorm:"not null"                  json:"objet"`
	Service       string     `json:"service"`
	ResponsableID *uuid.UUID `gorm:"type:uuid;index"           json:"responsable_id"`
	Procedure     string     `gorm:"default:'MAPA'"            json:"procedure"` // MAPA, AO_ouvert, gre_a_gre, negocie
	Statut        string     `gorm:"default:'planifie'"        json:"statut"`    // planifie, en_cours, attribue, execute, clos, annule
	Montant       float64    `gorm:"default:0"                 json:"montant"`
	// Dates clés
	DateLancement  *string `json:"date_lancement"`  // date de lancement de la procédure
	DateEcheance   *string `json:"date_echeance"`   // date limite de remise des offres
	DateAttribution *string `json:"date_attribution"` // date d'attribution prévue
	DateDebut      *string `json:"date_debut"`      // début d'exécution du marché
	DateFin        *string `json:"date_fin"`        // fin d'exécution / échéance de renouvellement
	// Alertes
	AlerteJ30  bool `gorm:"default:true"  json:"alerte_j30"`  // alerte 30j avant date_lancement
	AlerteJ90  bool `gorm:"default:false" json:"alerte_j90"`  // alerte 90j avant date_lancement
	AlerteJ180 bool `gorm:"default:false" json:"alerte_j180"` // alerte 180j avant date_lancement
	// Méta
	Notes      string `json:"notes"`
	CreatedBy  uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
}

// AlerteCalendrier est une alerte calculée pour l'affichage calendrier.
type AlerteCalendrier struct {
	MarcheID  uuid.UUID `json:"marche_id"`
	Objet     string    `json:"objet"`
	Service   string    `json:"service"`
	Procedure string    `json:"procedure"`
	Statut    string    `json:"statut"`
	Date      string    `json:"date"`
	Type      string    `json:"type"` // lancement, echeance, attribution, fin, renouvellement
	JoursRestants int   `json:"jours_restants"`
	Urgence   string    `json:"urgence"` // urgent (<30j), proche (<90j), normal
}
