package accounting

import (
	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
)

type Account struct {
	models.Base
	TenantID uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Code     string    `gorm:"not null"                 json:"code"`
	Name     string    `gorm:"not null"                 json:"name"`
	Type     string    `gorm:"not null"                 json:"type"` // asset, liability, equity, revenue, expense
	Currency string    `gorm:"default:'EUR'"            json:"currency"`
	Balance  float64   `gorm:"default:0"                json:"balance"`
	IsActive bool      `gorm:"default:true"             json:"is_active"`
}

type Transaction struct {
	models.Base
	TenantID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	AccountID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"account_id"`
	Reference   string     `json:"reference"`
	Description string     `json:"description"`
	Amount      float64    `gorm:"not null"                 json:"amount"`
	Type        string     `gorm:"not null"                 json:"type"` // debit, credit
	Date        string     `gorm:"not null"                 json:"date"`
	CreatedBy   uuid.UUID  `gorm:"type:uuid;not null"       json:"created_by"`
	InvoiceID   *uuid.UUID `gorm:"type:uuid;index"          json:"invoice_id,omitempty"`
}
