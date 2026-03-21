package webhooks

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct {
	db         *gorm.DB
	dispatcher *Dispatcher
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db, dispatcher: NewDispatcher(db)}
}

// GET /webhooks — list all webhooks for the org
func (h *Handler) List(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var hooks []Webhook
	if err := h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("created_at DESC").
		Find(&hooks).Error; err != nil {
		c.JSON(500, models.Err("failed to list webhooks"))
		return
	}
	// Return hooks with masked secret
	type safeHook struct {
		Webhook
		HasSecret bool `json:"has_secret"`
	}
	safe := make([]safeHook, len(hooks))
	for i, wh := range hooks {
		safe[i] = safeHook{Webhook: wh, HasSecret: wh.Secret != ""}
	}
	c.JSON(200, models.OK(safe))
}

// POST /webhooks — create a webhook
func (h *Handler) Create(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	var req struct {
		URL    string   `json:"url"    binding:"required,url"`
		Events []string `json:"events" binding:"required,min=1"`
		Secret string   `json:"secret"` // optional; auto-generated if empty
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, models.Err("url et events sont requis"))
		return
	}

	// Validate events
	for _, ev := range req.Events {
		if ev != "*" && !isKnownEvent(ev) {
			c.JSON(400, models.Err("événement inconnu: "+ev))
			return
		}
	}

	secret := req.Secret
	if secret == "" {
		secret = generateSecret()
	}

	eventsJSON, _ := json.Marshal(req.Events)
	hook := Webhook{
		ID:       uuid.New(),
		TenantID: orgID,
		URL:      req.URL,
		Events:   eventsJSON,
		Secret:   secret,
		IsActive: true,
	}
	if err := h.db.WithContext(c.Request.Context()).Create(&hook).Error; err != nil {
		c.JSON(500, models.Err("failed to create webhook"))
		return
	}

	// Return with the secret exposed once at creation
	c.JSON(201, models.OK(gin.H{
		"id":         hook.ID,
		"url":        hook.URL,
		"events":     req.Events,
		"secret":     secret, // shown only at creation
		"is_active":  hook.IsActive,
		"created_at": hook.CreatedAt,
	}))
}

// PUT /webhooks/:id — update a webhook
func (h *Handler) Update(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid webhook id"))
		return
	}

	var hook Webhook
	if err := h.db.Where("id = ? AND tenant_id = ?", id, orgID).First(&hook).Error; err != nil {
		c.JSON(404, models.Err("webhook not found"))
		return
	}

	var req struct {
		URL      *string  `json:"url"`
		Events   []string `json:"events"`
		IsActive *bool    `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, models.Err("invalid request"))
		return
	}
	if req.URL != nil {
		hook.URL = *req.URL
	}
	if req.Events != nil {
		for _, ev := range req.Events {
			if ev != "*" && !isKnownEvent(ev) {
				c.JSON(400, models.Err("événement inconnu: "+ev))
				return
			}
		}
		evJSON, _ := json.Marshal(req.Events)
		hook.Events = evJSON
	}
	if req.IsActive != nil {
		hook.IsActive = *req.IsActive
	}

	if err := h.db.Save(&hook).Error; err != nil {
		c.JSON(500, models.Err("failed to update webhook"))
		return
	}
	c.JSON(200, models.OK(hook))
}

// DELETE /webhooks/:id
func (h *Handler) Delete(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid webhook id"))
		return
	}
	if err := h.db.Where("id = ? AND tenant_id = ?", id, orgID).Delete(&Webhook{}).Error; err != nil {
		c.JSON(500, models.Err("failed to delete webhook"))
		return
	}
	c.JSON(200, models.OK(gin.H{"deleted": true}))
}

// GET /webhooks/:id/deliveries?page=1&limit=20
func (h *Handler) Deliveries(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid webhook id"))
		return
	}
	// Verify ownership
	var hook Webhook
	if err := h.db.Where("id = ? AND tenant_id = ?", id, orgID).First(&hook).Error; err != nil {
		c.JSON(404, models.Err("webhook not found"))
		return
	}

	page  := atoi(c.DefaultQuery("page", "1"))
	limit := atoi(c.DefaultQuery("limit", "20"))
	if limit > 100 { limit = 100 }

	var deliveries []WebhookDelivery
	var total int64
	h.db.Model(&WebhookDelivery{}).Where("webhook_id = ?", id).Count(&total)
	h.db.Where("webhook_id = ?", id).
		Order("created_at DESC").
		Offset((page-1)*limit).Limit(limit).
		Find(&deliveries)

	c.JSON(200, models.OK(gin.H{
		"deliveries": deliveries,
		"total":      total,
		"page":       page,
		"pages":      (int(total) + limit - 1) / limit,
	}))
}

// POST /webhooks/:id/test — send a test ping to the endpoint
func (h *Handler) Test(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid webhook id"))
		return
	}
	var hook Webhook
	if err := h.db.Where("id = ? AND tenant_id = ?", id, orgID).First(&hook).Error; err != nil {
		c.JSON(404, models.Err("webhook not found"))
		return
	}

	// Fire a test event synchronously for immediate feedback
	h.dispatcher.Dispatch(orgID, "test.ping", gin.H{
		"message": "Ceci est un test de connexion Axiora.",
		"org_id":  orgID.String(),
	})
	c.JSON(200, models.OK(gin.H{"queued": true}))
}

// GET /webhooks/events — list all subscribable events
func (h *Handler) Events(c *gin.Context) {
	c.JSON(200, models.OK(KnownEvents))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func isKnownEvent(ev string) bool {
	for _, k := range KnownEvents {
		if k == ev {
			return true
		}
	}
	return false
}

func generateSecret() string {
	b := make([]byte, 24)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func atoi(s string) int {
	v, _ := strconv.Atoi(s)
	if v < 1 {
		return 1
	}
	return v
}
