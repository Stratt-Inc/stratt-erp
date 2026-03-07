package procurement

import (
	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
)

type PurchaseOrder struct {
	models.Base
	TenantID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Number      string     `gorm:"not null;index"           json:"number"`
	SupplierID  *uuid.UUID `gorm:"type:uuid;index"          json:"supplier_id"`
	Status      string     `gorm:"default:'draft'"          json:"status"` // draft, sent, received, cancelled
	OrderDate   string     `gorm:"not null"                 json:"order_date"`
	DeliveryDate string    `json:"delivery_date"`
	Currency    string     `gorm:"default:'EUR'"            json:"currency"`
	Subtotal    float64    `gorm:"default:0"                json:"subtotal"`
	TaxAmount   float64    `gorm:"default:0"                json:"tax_amount"`
	Total       float64    `gorm:"default:0"                json:"total"`
	Notes       string     `json:"notes"`
	CreatedBy   uuid.UUID  `gorm:"type:uuid;not null"       json:"created_by"`

	Items []PurchaseOrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
}

type PurchaseOrderItem struct {
	models.Base
	OrderID     uuid.UUID `gorm:"type:uuid;not null;index" json:"order_id"`
	ProductID   *uuid.UUID `gorm:"type:uuid;index"         json:"product_id"`
	Description string    `gorm:"not null"                 json:"description"`
	Quantity    float64   `gorm:"default:1"                json:"quantity"`
	UnitPrice   float64   `gorm:"not null"                 json:"unit_price"`
	Total       float64   `gorm:"not null"                 json:"total"`
}
