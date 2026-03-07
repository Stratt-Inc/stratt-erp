package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// Module is a system-level ERP module definition.
type Module struct {
	ID          string `gorm:"primaryKey"   json:"id"` // crm, accounting, billing, …
	Name        string `gorm:"not null"     json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
	IsCore      bool   `gorm:"default:false" json:"is_core"` // always enabled
}

// OrganizationModule tracks which modules are enabled per organization.
type OrganizationModule struct {
	OrganizationID uuid.UUID      `gorm:"type:uuid;primaryKey"   json:"organization_id"`
	ModuleID       string         `gorm:"primaryKey"             json:"module_id"`
	EnabledAt      time.Time      `json:"enabled_at"`
	Settings       datatypes.JSON `json:"settings,omitempty"`

	Organization Organization `gorm:"foreignKey:OrganizationID" json:"-"`
	Module       Module       `gorm:"foreignKey:ModuleID"       json:"module,omitempty"`
}
