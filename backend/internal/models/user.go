package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	Base
	Email         string `gorm:"uniqueIndex;not null" json:"email"`
	Name          string `gorm:"not null"             json:"name"`
	PasswordHash  string `gorm:"not null"             json:"-"`
	AvatarURL     string `json:"avatar_url,omitempty"`
	EmailVerified bool   `gorm:"default:false"        json:"email_verified"`

	// Relations
	Sessions []Session              `gorm:"foreignKey:UserID" json:"-"`
	Members  []OrganizationMember   `gorm:"foreignKey:UserID" json:"-"`
}

type Session struct {
	Base
	UserID       uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	RefreshToken string    `gorm:"uniqueIndex;not null"     json:"-"`
	UserAgent    string    `json:"user_agent"`
	IPAddress    string    `json:"ip_address"`
	ExpiresAt    time.Time `json:"expires_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

// Invite represents a pending organization invitation.
type Invite struct {
	Base
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;index" json:"organization_id"`
	Email          string    `gorm:"not null;index"           json:"email"`
	Token          string    `gorm:"uniqueIndex;not null"     json:"-"`
	RoleID         uuid.UUID `gorm:"type:uuid"                json:"role_id"`
	ExpiresAt      time.Time `json:"expires_at"`
	AcceptedAt     *time.Time `json:"accepted_at,omitempty"`

	Organization Organization `gorm:"foreignKey:OrganizationID" json:"-"`
}
