package webhooks

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// Webhook is a configured endpoint that receives event notifications.
type Webhook struct {
	ID         uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TenantID   uuid.UUID      `gorm:"type:uuid;not null;index"                       json:"tenant_id"`
	URL        string         `gorm:"not null"                                       json:"url"`
	Events     datatypes.JSON `gorm:"not null"                                       json:"events"` // []string
	Secret     string         `gorm:"not null"                                       json:"-"`      // HMAC-SHA256 signing key, never exposed
	IsActive   bool           `gorm:"default:true"                                   json:"is_active"`
	LastStatus string         `json:"last_status"` // "success" | "failure" | ""
	FailCount  int            `gorm:"default:0"    json:"fail_count"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

// WebhookDelivery tracks each outbound call attempt.
type WebhookDelivery struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	WebhookID    uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"webhook_id"`
	Event        string     `gorm:"not null"                                       json:"event"`
	Payload      string     `gorm:"type:text"                                      json:"payload"`
	Status       string     `gorm:"default:'pending'"                              json:"status"` // pending | success | failure
	StatusCode   int        `json:"status_code"`
	ErrorMsg     string     `json:"error_msg"`
	AttemptCount int        `gorm:"default:0"                                      json:"attempt_count"`
	NextRetryAt  *time.Time `json:"next_retry_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// KnownEvents lists all subscribable event types.
var KnownEvents = []string{
	"marche.created",
	"marche.updated",
	"marche.deleted",
	"marche.seuil_depasse",
	"import.completed",
	"alerte.echeance",
	"alerte.delai_paiement",
	"user.joined",
	"user.removed",
}
