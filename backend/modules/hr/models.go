package hr

import (
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

type Employee struct {
	models.Base
	TenantID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID     *uuid.UUID `gorm:"type:uuid;index"          json:"user_id"`
	FirstName  string     `gorm:"not null"                 json:"first_name"`
	LastName   string     `gorm:"not null"                 json:"last_name"`
	Email      string     `gorm:"index"                    json:"email"`
	Phone      string     `json:"phone"`
	Department string     `json:"department"`
	JobTitle   string     `json:"job_title"`
	HireDate   string     `json:"hire_date"`
	Salary     float64    `json:"salary"`
	Status     string     `gorm:"default:'active'"         json:"status"` // active, on_leave, terminated
}

type LeaveRequest struct {
	models.Base
	TenantID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	EmployeeID uuid.UUID  `gorm:"type:uuid;not null;index" json:"employee_id"`
	Type       string     `gorm:"not null"                 json:"type"` // annual, sick, unpaid
	StartDate  string     `gorm:"not null"                 json:"start_date"`
	EndDate    string     `gorm:"not null"                 json:"end_date"`
	Days       float64    `json:"days"`
	Reason     string     `json:"reason"`
	Status     string     `gorm:"default:'pending'"        json:"status"` // pending, approved, rejected
	ApprovedBy *uuid.UUID `gorm:"type:uuid"                json:"approved_by"`

	Employee Employee `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
}
