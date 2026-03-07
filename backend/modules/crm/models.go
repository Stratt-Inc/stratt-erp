package crm

import (
	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
)

// Contact represents a person or company in the CRM.
type Contact struct {
	models.Base
	TenantID   uuid.UUID `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Type       string    `gorm:"default:'person'"         json:"type"` // person, company
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Company    string    `json:"company"`
	Email      string    `gorm:"index"                    json:"email"`
	Phone      string    `json:"phone"`
	Address    string    `json:"address"`
	Tags       string    `json:"tags"`
	Notes      string    `json:"notes"`
	AssignedTo *uuid.UUID `gorm:"type:uuid;index"         json:"assigned_to"`
}

// Lead represents a potential sales opportunity.
type Lead struct {
	models.Base
	TenantID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	ContactID  *uuid.UUID `gorm:"type:uuid;index"          json:"contact_id"`
	Title      string     `gorm:"not null"                 json:"title"`
	Status     string     `gorm:"default:'new'"            json:"status"` // new, contacted, qualified, lost
	Source     string     `json:"source"`
	Value      float64    `json:"value"`
	AssignedTo *uuid.UUID `gorm:"type:uuid;index"          json:"assigned_to"`
	Notes      string     `json:"notes"`

	Contact *Contact `gorm:"foreignKey:ContactID" json:"contact,omitempty"`
}

// Deal represents a sales opportunity in the pipeline.
type Deal struct {
	models.Base
	TenantID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	ContactID  *uuid.UUID `gorm:"type:uuid;index"          json:"contact_id"`
	Title      string     `gorm:"not null"                 json:"title"`
	Stage      string     `gorm:"default:'prospecting'"    json:"stage"` // prospecting, proposal, negotiation, closed_won, closed_lost
	Value      float64    `json:"value"`
	Currency   string     `gorm:"default:'EUR'"            json:"currency"`
	Probability int       `gorm:"default:0"                json:"probability"` // 0-100
	ExpectedAt *string    `json:"expected_at,omitempty"`
	AssignedTo *uuid.UUID `gorm:"type:uuid;index"          json:"assigned_to"`
	Notes      string     `json:"notes"`

	Contact *Contact `gorm:"foreignKey:ContactID" json:"contact,omitempty"`
}

// Activity logs interactions with contacts / leads / deals.
type Activity struct {
	models.Base
	TenantID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Type         string     `gorm:"not null"                 json:"type"` // call, email, meeting, note, task
	Subject      string     `gorm:"not null"                 json:"subject"`
	Description  string     `json:"description"`
	ContactID    *uuid.UUID `gorm:"type:uuid;index"          json:"contact_id"`
	DealID       *uuid.UUID `gorm:"type:uuid;index"          json:"deal_id"`
	LeadID       *uuid.UUID `gorm:"type:uuid;index"          json:"lead_id"`
	DueAt        *string    `json:"due_at,omitempty"`
	CompletedAt  *string    `json:"completed_at,omitempty"`
	CreatedBy    uuid.UUID  `gorm:"type:uuid;not null"       json:"created_by"`
}
