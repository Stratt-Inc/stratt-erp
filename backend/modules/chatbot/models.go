package chatbot

import (
	"time"

	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

// ChatToken — lien public chiffré vers le chatbot d'une organisation.
type ChatToken struct {
	models.Base
	TenantID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Token     string     `gorm:"uniqueIndex;not null"     json:"token"`
	Label     string     `json:"label"`              // ex: "Lien agents comptabilité"
	ExpiresAt *time.Time `json:"expires_at"`         // nil = pas d'expiration
	Revoked   bool       `gorm:"default:false"        json:"revoked"`
	UseCount  int        `gorm:"default:0"            json:"use_count"`
}

func (t *ChatToken) IsValid() bool {
	if t.Revoked {
		return false
	}
	if t.ExpiresAt != nil && time.Now().After(*t.ExpiresAt) {
		return false
	}
	return true
}

// ChatMessage — message d'une session de chat.
type ChatMessage struct {
	models.Base
	TokenID   uuid.UUID `gorm:"type:uuid;not null;index" json:"token_id"`
	SessionID string    `gorm:"not null;index"           json:"session_id"` // UUID côté client
	Role      string    `gorm:"not null"                 json:"role"`       // "user" | "assistant"
	Content   string    `gorm:"type:text;not null"       json:"content"`
	Liked     *bool     `json:"liked"` // nil = pas de feedback, true = 👍, false = 👎
}

// ChatFeedback — feedback global sur une session.
type ChatFeedback struct {
	models.Base
	TokenID   uuid.UUID `gorm:"type:uuid;not null;index" json:"token_id"`
	SessionID string    `gorm:"not null;index"           json:"session_id"`
	MessageID uuid.UUID `gorm:"type:uuid;not null"       json:"message_id"`
	Liked     bool      `json:"liked"`
}
