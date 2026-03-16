package chatbot

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	anthropic "github.com/anthropics/anthropic-sdk-go"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	nomenclaturemod "github.com/stratt/backend/modules/nomenclature"
	"gorm.io/gorm"
)

type Handler struct {
	db           *gorm.DB
	anthropicKey string
}

func NewHandler(db *gorm.DB, anthropicKey string) *Handler {
	return &Handler{db: db, anthropicKey: anthropicKey}
}

// ── Token management (authenticated) ──────────────────────────────────────

// POST /api/v1/chatbot/tokens
func (h *Handler) CreateToken(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	var body struct {
		Label     string `json:"label"`
		ExpiresIn int    `json:"expires_in_days"` // 0 = no expiry
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("body invalide"))
		return
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		c.JSON(500, models.Err("erreur génération token"))
		return
	}
	token := hex.EncodeToString(raw)

	ct := ChatToken{
		TenantID: orgID,
		Token:    token,
		Label:    body.Label,
	}
	if body.ExpiresIn > 0 {
		exp := time.Now().Add(time.Duration(body.ExpiresIn) * 24 * time.Hour)
		ct.ExpiresAt = &exp
	}

	if err := h.db.WithContext(c.Request.Context()).Create(&ct).Error; err != nil {
		c.JSON(500, models.Err("erreur création token"))
		return
	}
	c.JSON(201, models.OK(ct))
}

// GET /api/v1/chatbot/tokens
func (h *Handler) ListTokens(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var tokens []ChatToken
	h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("created_at DESC").
		Find(&tokens)
	c.JSON(200, models.OK(tokens))
}

// DELETE /api/v1/chatbot/tokens/:id
func (h *Handler) RevokeToken(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("id invalide"))
		return
	}
	res := h.db.WithContext(c.Request.Context()).
		Model(&ChatToken{}).
		Where("id = ? AND tenant_id = ?", id, orgID).
		Update("revoked", true)
	if res.RowsAffected == 0 {
		c.JSON(404, models.Err("token introuvable"))
		return
	}
	c.JSON(200, models.Msg("token révoqué"))
}

// GET /api/v1/chatbot/analytics
func (h *Handler) Analytics(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	// Top questions (most recent user messages per token)
	type QuestionCount struct {
		Content string `json:"question"`
		Count   int    `json:"count"`
	}
	var topQ []QuestionCount
	h.db.WithContext(ctx).Raw(`
		SELECT cm.content, COUNT(*) as count
		FROM chat_messages cm
		JOIN chat_tokens ct ON ct.id = cm.token_id
		WHERE ct.tenant_id = ? AND cm.role = 'user'
		GROUP BY cm.content
		ORDER BY count DESC
		LIMIT 20
	`, orgID).Scan(&topQ)

	// Feedback stats
	type FeedbackStat struct {
		Liked bool `json:"liked"`
		Count int  `json:"count"`
	}
	var feedback []FeedbackStat
	h.db.WithContext(ctx).Raw(`
		SELECT liked, COUNT(*) as count
		FROM chat_feedbacks cf
		JOIN chat_tokens ct ON ct.id = cf.token_id
		WHERE ct.tenant_id = ?
		GROUP BY liked
	`, orgID).Scan(&feedback)

	// Token usage
	var tokens []ChatToken
	h.db.WithContext(ctx).Where("tenant_id = ?", orgID).Find(&tokens)

	c.JSON(200, models.OK(gin.H{
		"top_questions": topQ,
		"feedback":      feedback,
		"tokens":        tokens,
	}))
}

// ── Public chat endpoints (no auth, token-based) ──────────────────────────

// POST /api/public/chat/:token
func (h *Handler) Chat(c *gin.Context) {
	tokenStr := c.Param("token")
	ctx := c.Request.Context()

	var ct ChatToken
	if err := h.db.WithContext(ctx).Where("token = ?", tokenStr).First(&ct).Error; err != nil {
		c.JSON(404, models.Err("lien invalide ou expiré"))
		return
	}
	if !ct.IsValid() {
		c.JSON(403, models.Err("lien révoqué ou expiré"))
		return
	}

	var body struct {
		SessionID string `json:"session_id"`
		Message   string `json:"message"`
		Strict    bool   `json:"strict"` // mode strict : nomenclature only
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Message == "" {
		c.JSON(400, models.Err("message requis"))
		return
	}
	if body.SessionID == "" {
		body.SessionID = uuid.New().String()
	}

	// Increment use count
	h.db.WithContext(ctx).Model(&ct).UpdateColumn("use_count", gorm.Expr("use_count + 1"))

	// Save user message
	userMsg := ChatMessage{
		TokenID:   ct.ID,
		SessionID: body.SessionID,
		Role:      "user",
		Content:   body.Message,
	}
	h.db.WithContext(ctx).Create(&userMsg)

	// Load nomenclature for this tenant
	systemPrompt := h.buildSystemPrompt(ctx, ct.TenantID, body.Strict)

	// Load conversation history (last 10 exchanges)
	var history []ChatMessage
	h.db.WithContext(ctx).
		Where("token_id = ? AND session_id = ?", ct.ID, body.SessionID).
		Order("created_at ASC").
		Limit(20).
		Find(&history)

	// Build Anthropic messages
	response, err := h.callClaude(ctx, systemPrompt, history)
	if err != nil {
		c.JSON(500, models.Err(fmt.Sprintf("erreur IA: %v", err)))
		return
	}

	// Save assistant response
	assistantMsg := ChatMessage{
		TokenID:   ct.ID,
		SessionID: body.SessionID,
		Role:      "assistant",
		Content:   response,
	}
	h.db.WithContext(ctx).Create(&assistantMsg)

	c.JSON(200, models.OK(gin.H{
		"session_id": body.SessionID,
		"message_id": assistantMsg.ID,
		"response":   response,
	}))
}

// GET /api/public/chat/:token/history?session_id=
func (h *Handler) History(c *gin.Context) {
	tokenStr := c.Param("token")
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(400, models.Err("session_id requis"))
		return
	}

	var ct ChatToken
	if err := h.db.WithContext(c.Request.Context()).Where("token = ?", tokenStr).First(&ct).Error; err != nil {
		c.JSON(404, models.Err("lien invalide"))
		return
	}

	var msgs []ChatMessage
	h.db.WithContext(c.Request.Context()).
		Where("token_id = ? AND session_id = ?", ct.ID, sessionID).
		Order("created_at ASC").
		Find(&msgs)
	c.JSON(200, models.OK(msgs))
}

// POST /api/public/chat/:token/feedback
func (h *Handler) Feedback(c *gin.Context) {
	tokenStr := c.Param("token")

	var ct ChatToken
	if err := h.db.WithContext(c.Request.Context()).Where("token = ?", tokenStr).First(&ct).Error; err != nil {
		c.JSON(404, models.Err("lien invalide"))
		return
	}

	var body struct {
		SessionID string    `json:"session_id"`
		MessageID uuid.UUID `json:"message_id"`
		Liked     bool      `json:"liked"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("body invalide"))
		return
	}

	fb := ChatFeedback{
		TokenID:   ct.ID,
		SessionID: body.SessionID,
		MessageID: body.MessageID,
		Liked:     body.Liked,
	}
	h.db.WithContext(c.Request.Context()).Create(&fb)

	// Also update the message liked field
	liked := body.Liked
	h.db.WithContext(c.Request.Context()).
		Model(&ChatMessage{}).
		Where("id = ?", body.MessageID).
		Update("liked", &liked)

	c.JSON(200, models.Msg("feedback enregistré"))
}

// ── Helpers ───────────────────────────────────────────────────────────────

func (h *Handler) buildSystemPrompt(ctx context.Context, tenantID uuid.UUID, strict bool) string {
	var nodes []nomenclaturemod.NomenclatureNode
	h.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("code ASC").
		Limit(500).
		Find(&nodes)

	var sb strings.Builder
	sb.WriteString(`Tu es un assistant expert en commande publique spécialisé dans la classification budgétaire et la nomenclature M14/M57 des collectivités territoriales françaises.

Ton rôle est d'aider les agents à trouver le bon code de nomenclature pour leurs achats.

Pour chaque demande :
1. Identifie le ou les codes les plus pertinents
2. Donne le code exact, le libellé complet et la famille
3. Explique brièvement pourquoi ce code est approprié
4. Propose 1-2 codes alternatifs si la classification est ambiguë
5. Donne des exemples concrets d'inclus/exclus

Format de réponse souhaité :
**Code principal :** [CODE] — [Libellé]
**Famille :** [Famille]
**Pourquoi :** [Explication courte]
**Alternatives :** [Code1] — [Libellé1], [Code2] — [Libellé2]
**Inclus :** [exemples] | **Exclus :** [exemples]
`)

	if len(nodes) > 0 {
		sb.WriteString("\n\n**Nomenclature de la collectivité :**\n")
		for _, n := range nodes {
			sb.WriteString(fmt.Sprintf("- %s : %s\n", n.Code, n.Label))
		}
	}

	if strict {
		sb.WriteString("\n\n**Mode strict activé** : réponds UNIQUEMENT en utilisant les codes de la nomenclature de la collectivité ci-dessus. Si le code n'existe pas dans cette nomenclature, indique-le clairement.")
	}

	return sb.String()
}

func (h *Handler) callClaude(ctx context.Context, systemPrompt string, history []ChatMessage) (string, error) {
	if h.anthropicKey == "" {
		return "[Clé API Anthropic non configurée — définissez ANTHROPIC_API_KEY]", nil
	}

	client := anthropic.NewClient() // uses ANTHROPIC_API_KEY env var

	var msgs []anthropic.MessageParam
	for _, m := range history {
		if m.Role == "user" {
			msgs = append(msgs, anthropic.NewUserMessage(anthropic.NewTextBlock(m.Content)))
		} else {
			msgs = append(msgs, anthropic.NewAssistantMessage(anthropic.NewTextBlock(m.Content)))
		}
	}

	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     anthropic.ModelClaude3_5HaikuLatest,
		MaxTokens: 1024,
		System: []anthropic.TextBlockParam{
			{Text: systemPrompt},
		},
		Messages: msgs,
	})
	if err != nil {
		return "", err
	}

	if len(resp.Content) == 0 {
		return "", fmt.Errorf("réponse vide de l'API")
	}

	return resp.Content[0].Text, nil
}
