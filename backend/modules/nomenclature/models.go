package nomenclature

import (
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

// NomenclatureTag is a label that can be attached to any nomenclature node.
// System tags (is_system=true) are seeded and cannot be deleted.
type NomenclatureTag struct {
	models.Base
	TenantID uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name     string    `gorm:"not null"                json:"name"`
	Color    string    `gorm:"default:'#6366f1'"       json:"color"`
	IsSystem bool      `gorm:"default:false"           json:"is_system"`
}

// NomenclatureNode represents a node in the hierarchical procurement nomenclature.
// Nodes are either system-seeded national entries (is_national=true) or
// tenant-specific customizations.
//
// Hierarchy: grande-famille → famille → code
type NomenclatureNode struct {
	models.Base
	TenantID    uuid.UUID         `gorm:"type:uuid;not null;index"          json:"tenant_id"`
	Code        string            `gorm:"not null;index"                    json:"code"`
	Label       string            `gorm:"not null"                          json:"label"`
	Description string            `gorm:"type:text;default:''"              json:"description,omitempty"`
	Type        string            `gorm:"default:'code'"                    json:"type"` // grande-famille | famille | code
	Tag         string            `gorm:"default:''"                        json:"tag"`  // Fournitures | Services | Travaux
	ParentID    *uuid.UUID        `gorm:"type:uuid;index"                   json:"parent_id"`
	CPVCode     string            `gorm:"default:''"                        json:"cpv_code,omitempty"`
	SeuilMapa   float64           `gorm:"default:40000"                     json:"seuil_mapa"`
	SeuilAO     float64           `gorm:"default:221000"                    json:"seuil_ao"`
	Montant     float64           `gorm:"default:0"                         json:"montant"`
	Seuil       float64           `gorm:"default:0"                         json:"seuil"`
	Conforme    bool              `gorm:"default:true"                      json:"conforme"`
	IsNational  bool              `gorm:"default:false;index"               json:"is_national"`
	IsArchived  bool              `gorm:"default:false;index"               json:"is_archived"`
	Version     string            `gorm:"default:'2024'"                    json:"version"`
	Tags        []NomenclatureTag `gorm:"many2many:nomenclature_node_tags;" json:"tags,omitempty"`
}
