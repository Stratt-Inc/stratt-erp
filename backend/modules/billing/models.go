package billing

import (
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

type Invoice struct {
	models.Base
	TenantID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Number    string     `gorm:"not null;index"           json:"number"`
	ContactID *uuid.UUID `gorm:"type:uuid;index"          json:"contact_id"`
	Status    string     `gorm:"default:'draft'"          json:"status"` // draft, sent, paid, overdue, cancelled
	IssueDate string     `gorm:"not null"                 json:"issue_date"`
	DueDate   string     `json:"due_date"`
	Currency  string     `gorm:"default:'EUR'"            json:"currency"`
	Subtotal  float64    `gorm:"default:0"                json:"subtotal"`
	TaxRate   float64    `gorm:"default:0"                json:"tax_rate"`
	TaxAmount float64    `gorm:"default:0"                json:"tax_amount"`
	Total     float64    `gorm:"default:0"                json:"total"`
	Notes     string     `json:"notes"`
	CreatedBy uuid.UUID  `gorm:"type:uuid;not null"       json:"created_by"`

	Items []InvoiceItem `gorm:"foreignKey:InvoiceID" json:"items,omitempty"`
}

type InvoiceItem struct {
	models.Base
	InvoiceID   uuid.UUID `gorm:"type:uuid;not null;index" json:"invoice_id"`
	Description string    `gorm:"not null"                 json:"description"`
	Quantity    float64   `gorm:"default:1"                json:"quantity"`
	UnitPrice   float64   `gorm:"not null"                 json:"unit_price"`
	Total       float64   `gorm:"not null"                 json:"total"`
}
