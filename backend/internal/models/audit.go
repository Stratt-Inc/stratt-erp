package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// AuditLog records every significant action in the system.
type AuditLog struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OrganizationID *uuid.UUID     `gorm:"type:uuid;index"                                json:"organization_id"`
	UserID         *uuid.UUID     `gorm:"type:uuid;index"                                json:"user_id"`
	Action         string         `gorm:"not null;index"                                 json:"action"`        // user.login, org.created, role.updated
	ResourceType   string         `gorm:"index"                                          json:"resource_type"` // user, organization, role, module
	ResourceID     string         `json:"resource_id"`
	Metadata       datatypes.JSON `json:"metadata,omitempty"`
	IPAddress      string         `json:"ip_address"`
	UserAgent      string         `json:"user_agent"`
	CreatedAt      time.Time      `json:"created_at"`
}
