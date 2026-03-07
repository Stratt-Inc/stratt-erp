package inventory

import (
	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
)

type Product struct {
	models.Base
	TenantID    uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	SKU         string    `gorm:"index"                    json:"sku"`
	Name        string    `gorm:"not null"                 json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	UnitPrice   float64   `gorm:"default:0"                json:"unit_price"`
	CostPrice   float64   `gorm:"default:0"                json:"cost_price"`
	Stock       float64   `gorm:"default:0"                json:"stock"`
	ReorderAt   float64   `gorm:"default:0"                json:"reorder_at"`
	Unit        string    `gorm:"default:'unit'"           json:"unit"`
	IsActive    bool      `gorm:"default:true"             json:"is_active"`
}

type StockMovement struct {
	models.Base
	TenantID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	ProductID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"product_id"`
	Type       string     `gorm:"not null"                 json:"type"` // in, out, adjustment
	Quantity   float64    `gorm:"not null"                 json:"quantity"`
	Reference  string     `json:"reference"`
	Notes      string     `json:"notes"`
	CreatedBy  uuid.UUID  `gorm:"type:uuid;not null"       json:"created_by"`

	Product *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}
