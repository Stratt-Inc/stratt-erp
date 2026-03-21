package models

import (
	"github.com/google/uuid"
)

type Organization struct {
	Base
	Name    string `gorm:"not null"             json:"name"`
	Slug    string `gorm:"uniqueIndex;not null" json:"slug"`
	LogoURL string `json:"logo_url,omitempty"`
	Plan    string `gorm:"default:'free'"       json:"plan"` // free, starter, pro, enterprise

	// Relations
	Members []OrganizationMember `gorm:"foreignKey:OrganizationID" json:"members,omitempty"`
	Modules []OrganizationModule `gorm:"foreignKey:OrganizationID" json:"modules,omitempty"`
}

type OrganizationMember struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OrganizationID uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"organization_id"`
	UserID         uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"user_id"`
	RoleID         *uuid.UUID `gorm:"type:uuid;index"                                json:"role_id"`
	Status         string     `gorm:"default:'active'"                               json:"status"`     // active, suspended
	Department     string     `gorm:"default:''"                                     json:"department"` // e.g. "DGA Finances"

	// Relations
	Organization Organization `gorm:"foreignKey:OrganizationID" json:"-"`
	User         User         `gorm:"foreignKey:UserID"         json:"user,omitempty"`
	Role         *Role        `gorm:"foreignKey:RoleID"         json:"role,omitempty"`
}
