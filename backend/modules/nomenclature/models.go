package nomenclature

import (
	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
)

type NomenclatureNode struct {
	models.Base
	TenantID uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Code     string     `gorm:"not null;index"           json:"code"`
	Label    string     `gorm:"not null"                 json:"label"`
	Type     string     `gorm:"default:'code'"           json:"type"`
	ParentID *uuid.UUID `gorm:"type:uuid;index"          json:"parent_id"`
	Montant  float64    `gorm:"default:0"                json:"montant"`
	Seuil    float64    `gorm:"default:0"                json:"seuil"`
	Conforme bool       `gorm:"default:true"             json:"conforme"`
}
