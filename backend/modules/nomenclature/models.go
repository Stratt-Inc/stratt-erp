package nomenclature

import (
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

// NomenclatureNode represents a node in the hierarchical procurement nomenclature.
// Nodes are either system-seeded national entries (is_national=true) or
// tenant-specific customizations.
//
// Hierarchy: famille → sous-famille → code
type NomenclatureNode struct {
	models.Base
	TenantID    uuid.UUID  `gorm:"type:uuid;not null;index"          json:"tenant_id"`
	Code        string     `gorm:"not null;index"                    json:"code"`
	Label       string     `gorm:"not null"                          json:"label"`
	Description string     `gorm:"type:text;default:''"              json:"description,omitempty"`
	Type        string     `gorm:"default:'code'"                    json:"type"` // famille | sous-famille | code
	Tag         string     `gorm:"default:''"                        json:"tag"`  // Fournitures | Services | Travaux
	ParentID    *uuid.UUID `gorm:"type:uuid;index"                   json:"parent_id"`
	CPVCode     string     `gorm:"default:''"                        json:"cpv_code,omitempty"`
	SeuilMapa   float64    `gorm:"default:40000"                     json:"seuil_mapa"`  // €40k — threshold for MAPA
	SeuilAO     float64    `gorm:"default:221000"                    json:"seuil_ao"`    // €221k fournitures/services, €5.38M travaux
	Montant     float64    `gorm:"default:0"                         json:"montant"`
	Seuil       float64    `gorm:"default:0"                         json:"seuil"`    // legacy — kept for backward compat
	Conforme    bool       `gorm:"default:true"                      json:"conforme"`
	IsNational  bool       `gorm:"default:false;index"               json:"is_national"` // seeded from national database
	Version     string     `gorm:"default:'2024'"                    json:"version"`     // regulatory version
}
