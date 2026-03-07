package models

import (
	"github.com/google/uuid"
)

// Role belongs to an organization (or is system-wide when OrganizationID is nil).
type Role struct {
	Base
	OrganizationID *uuid.UUID `gorm:"type:uuid;index"  json:"organization_id"`
	Name           string     `gorm:"not null"         json:"name"`
	Description    string     `json:"description"`
	IsSystem       bool       `gorm:"default:false"    json:"is_system"` // built-in roles (owner, admin, member)

	// Relations
	Permissions []Permission `gorm:"many2many:role_permissions;"           json:"permissions,omitempty"`
	Members     []OrganizationMember `gorm:"foreignKey:RoleID"             json:"-"`
}

// Permission is a fine-grained capability (e.g. crm.read, admin.manage).
type Permission struct {
	ID          uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string `gorm:"uniqueIndex;not null"     json:"name"`   // crm.read
	Description string `json:"description"`
	Module      string `gorm:"index"                    json:"module"` // crm, accounting, …
	Action      string `json:"action"`                                // read, write, delete, manage

	// Relations
	Roles []Role `gorm:"many2many:role_permissions;" json:"-"`
}

// UserRole links a user to a role within an organization.
type UserRole struct {
	UserID         uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"user_id"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"organization_id"`
	RoleID         uuid.UUID `gorm:"type:uuid;not null;primaryKey" json:"role_id"`
}
