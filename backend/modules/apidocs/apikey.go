package apidocs

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"gorm.io/gorm"
)

// APIKey is a persistent API key for programmatic access.
type APIKey struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TenantID   uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"tenant_id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index"                       json:"user_id"`
	Label      string     `gorm:"not null"                                       json:"label"`
	KeyHash    string     `gorm:"not null;uniqueIndex"                           json:"-"`
	KeyPrefix  string     `gorm:"not null"                                       json:"key_prefix"`
	LastUsedAt *time.Time `json:"last_used_at"`
	ExpiresAt  *time.Time `json:"expires_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

// ── Rate limiter ──────────────────────────────────────────────────────────────

type rateBucket struct {
	count    int
	windowAt time.Time
}

var (
	rateMu      sync.Mutex
	rateBuckets = make(map[string]*rateBucket)
)

func checkRate(key string) bool {
	rateMu.Lock()
	defer rateMu.Unlock()
	now := time.Now()
	b, ok := rateBuckets[key]
	if !ok || now.Sub(b.windowAt) >= time.Hour {
		rateBuckets[key] = &rateBucket{count: 1, windowAt: now}
		return true
	}
	b.count++
	return b.count <= 1000
}

// ── API Key middleware ────────────────────────────────────────────────────────

// RequireAPIKey validates X-API-Key as an alternative auth mechanism.
func RequireAPIKey(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.GetHeader("X-API-Key")
		if raw == "" {
			c.Next()
			return
		}
		hash := sha256hex(raw)
		var key APIKey
		if err := db.Where("key_hash = ?", hash).First(&key).Error; err != nil {
			c.JSON(http.StatusUnauthorized, models.Err("API key invalide"))
			c.Abort()
			return
		}
		if key.ExpiresAt != nil && time.Now().After(*key.ExpiresAt) {
			c.JSON(http.StatusUnauthorized, models.Err("API key expirée"))
			c.Abort()
			return
		}
		if !checkRate(key.KeyPrefix) {
			c.JSON(http.StatusTooManyRequests, models.Err("rate limit dépassé (1000 req/h)"))
			c.Abort()
			return
		}
		now := time.Now()
		db.Model(&key).Update("last_used_at", now)
		c.Set("org_id", key.TenantID)
		c.Set("user_id", key.UserID)
		c.Next()
	}
}

// ── CRUD handlers ─────────────────────────────────────────────────────────────

func (h *Handler) CreateAPIKey(c *gin.Context) {
	orgIDVal, _ := c.Get("org_id")
	userIDVal, _ := c.Get("user_id")
	orgID, _  := orgIDVal.(uuid.UUID)
	userID, _ := userIDVal.(uuid.UUID)

	var req struct {
		Label     string     `json:"label" binding:"required"`
		ExpiresAt *time.Time `json:"expires_at"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, models.Err("label requis"))
		return
	}

	raw := generateAPIKey()
	key := APIKey{
		ID:        uuid.New(),
		TenantID:  orgID,
		UserID:    userID,
		Label:     req.Label,
		KeyHash:   sha256hex(raw),
		KeyPrefix: raw[:8],
		ExpiresAt: req.ExpiresAt,
	}

	db := c.MustGet("db").(*gorm.DB)
	if err := db.Create(&key).Error; err != nil {
		c.JSON(500, models.Err("failed to create API key"))
		return
	}
	c.JSON(201, models.OK(gin.H{
		"id":         key.ID,
		"label":      key.Label,
		"key":        raw,
		"key_prefix": key.KeyPrefix,
		"expires_at": key.ExpiresAt,
		"created_at": key.CreatedAt,
	}))
}

func (h *Handler) ListAPIKeys(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	db := c.MustGet("db").(*gorm.DB)
	var keys []APIKey
	db.Where("tenant_id = ?", orgID).Order("created_at DESC").Find(&keys)
	c.JSON(200, models.OK(keys))
}

func (h *Handler) DeleteAPIKey(c *gin.Context) {
	orgID, _ := c.Get("org_id")
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid id"))
		return
	}
	db := c.MustGet("db").(*gorm.DB)
	db.Where("id = ? AND tenant_id = ?", id, orgID).Delete(&APIKey{})
	c.JSON(200, models.OK(gin.H{"deleted": true}))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func generateAPIKey() string {
	b := make([]byte, 30)
	rand.Read(b)
	return "axr_" + base64.URLEncoding.EncodeToString(b)
}

func sha256hex(s string) string {
	h := sha256.Sum256([]byte(s))
	return fmt.Sprintf("%x", h)
}
