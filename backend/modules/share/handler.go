// Package share provides shareable, time-limited links to the "elu" dashboard.
// Tokens are HMAC-signed and embed the orgID + expiry — no database storage needed.
package share

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/config"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	marchesmod "github.com/stratt/backend/modules/marches"
	"gorm.io/gorm"
)

type Handler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewHandler(db *gorm.DB, cfg *config.Config) *Handler {
	return &Handler{db: db, cfg: cfg}
}

// ── Token helpers ─────────────────────────────────────────────────────────────

// signToken creates a URL-safe HMAC-signed token embedding the orgID and expiry.
// Format: base64url(orgID|expiresUnix) + "." + base64url(hmac256(secret, payload))
func (h *Handler) signToken(orgID string, ttl time.Duration) string {
	expiresAt := time.Now().Add(ttl).Unix()
	payload := fmt.Sprintf("%s|%d", orgID, expiresAt)
	b64payload := base64.RawURLEncoding.EncodeToString([]byte(payload))

	mac := hmac.New(sha256.New, []byte(h.cfg.JWTSecret))
	mac.Write([]byte(b64payload))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return b64payload + "." + sig
}

// verifyToken validates the token signature and expiry.
// Returns the orgID if valid, or ("", false).
func (h *Handler) verifyToken(token string) (orgID string, ok bool) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return "", false
	}
	b64payload, sig := parts[0], parts[1]

	// Verify signature
	mac := hmac.New(sha256.New, []byte(h.cfg.JWTSecret))
	mac.Write([]byte(b64payload))
	expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return "", false
	}

	// Decode payload
	payloadBytes, err := base64.RawURLEncoding.DecodeString(b64payload)
	if err != nil {
		return "", false
	}
	payloadStr := string(payloadBytes)
	sep := strings.LastIndex(payloadStr, "|")
	if sep == -1 {
		return "", false
	}

	org := payloadStr[:sep]
	expiresStr := payloadStr[sep+1:]
	var expiresAt int64
	fmt.Sscanf(expiresStr, "%d", &expiresAt)
	if time.Now().Unix() > expiresAt {
		return "", false // expired
	}

	return org, true
}

// ── Handlers ──────────────────────────────────────────────────────────────────

// CreateShareToken generates a signed share link for the elu dashboard.
//
// POST /api/v1/share
// Body: { "ttl_days": 30, "label": "Conseil municipal 2026" }
func (h *Handler) CreateShareToken(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)

	var body struct {
		TTLDays int    `json:"ttl_days"`
		Label   string `json:"label"`
	}
	_ = c.ShouldBindJSON(&body)
	if body.TTLDays <= 0 || body.TTLDays > 365 {
		body.TTLDays = 30
	}

	token := h.signToken(orgID.String(), time.Duration(body.TTLDays)*24*time.Hour)
	expiresAt := time.Now().AddDate(0, 0, body.TTLDays)

	frontendURL := h.cfg.FrontendURL
	shareURL := fmt.Sprintf("%s/elu?token=%s", frontendURL, token)

	c.JSON(201, models.OK(gin.H{
		"token":      token,
		"url":        shareURL,
		"expires_at": expiresAt.Format(time.RFC3339),
		"ttl_days":   body.TTLDays,
		"label":      body.Label,
	}))
}

// EluStats returns aggregated statistics for the elu dashboard (public endpoint).
// Authenticated via signed share token in :token param.
//
// GET /api/public/share/:token/stats
func (h *Handler) EluStats(c *gin.Context) {
	token := c.Param("token")
	orgID, ok := h.verifyToken(token)
	if !ok {
		c.JSON(401, models.Err("token invalide ou expiré"))
		return
	}

	ctx := c.Request.Context()
	year := time.Now().Year()

	// Load marchés for this year
	var marchesN []marchesmod.Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ? AND deleted_at IS NULL", orgID).
		Where(`EXTRACT(YEAR FROM COALESCE(date_attribution, date_lancement, created_at)) = ?`, year).
		Find(&marchesN)

	// Aggregations
	var totalMontant float64
	var enCours, termines, alertes int
	for _, m := range marchesN {
		totalMontant += m.Montant
		switch m.Statut {
		case "en_cours":
			enCours++
		case "termine":
			termines++
		case "alerte":
			alertes++
		}
	}

	// Top 5 services
	svcAgg := map[string]float64{}
	for _, m := range marchesN {
		svc := m.Service
		if svc == "" {
			svc = "Non renseigné"
		}
		svcAgg[svc] += m.Montant
	}
	type svcItem struct {
		Name  string  `json:"name"`
		Total float64 `json:"total"`
	}
	var topServices []svcItem
	for k, v := range svcAgg {
		topServices = append(topServices, svcItem{k, v})
	}
	// sort descending
	for i := range topServices {
		for j := i + 1; j < len(topServices); j++ {
			if topServices[j].Total > topServices[i].Total {
				topServices[i], topServices[j] = topServices[j], topServices[i]
			}
		}
	}
	if len(topServices) > 5 {
		topServices = topServices[:5]
	}

	// Conformité rate (marchés with procedure set)
	withProc := 0
	for _, m := range marchesN {
		if strings.TrimSpace(m.Procedure) != "" {
			withProc++
		}
	}
	conformite := 0.0
	if len(marchesN) > 0 {
		conformite = float64(withProc) / float64(len(marchesN)) * 100
	}

	c.JSON(200, models.OK(gin.H{
		"year":          year,
		"total_montant": totalMontant,
		"total_marches": len(marchesN),
		"en_cours":      enCours,
		"termines":      termines,
		"alertes":       alertes,
		"conformite":    conformite,
		"top_services":  topServices,
		"generated_at":  time.Now().Format(time.RFC3339),
	}))
}
