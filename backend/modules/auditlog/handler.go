package auditlog

import (
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/audit"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
)

type Handler struct{ svc *audit.Service }

func NewHandler(svc *audit.Service) *Handler { return &Handler{svc: svc} }

// GET /audit?page=1&limit=50&resource_type=marche&action=create&from=2026-01-01&to=2026-12-31
func (h *Handler) List(c *gin.Context) {
	orgID, ok := middleware.GetOrgID(c)
	if !ok {
		c.JSON(403, models.Err("organization required"))
		return
	}

	page  := atoi(c.DefaultQuery("page",  "1"),  1)
	limit := atoi(c.DefaultQuery("limit", "50"), 50)
	if limit > 200 { limit = 200 }

	filters := audit.ListFilters{
		ResourceType: c.Query("resource_type"),
		Action:       c.Query("action"),
		UserID:       c.Query("user_id"),
	}
	if f := c.Query("from"); f != "" {
		if t, err := time.Parse("2006-01-02", f); err == nil {
			filters.From = &t
		}
	}
	if t := c.Query("to"); t != "" {
		if parsed, err := time.Parse("2006-01-02", t); err == nil {
			end := parsed.Add(24*time.Hour - time.Second)
			filters.To = &end
		}
	}

	logs, total, err := h.svc.ListFiltered(c.Request.Context(), orgID, page, limit, filters)
	if err != nil {
		c.JSON(500, models.Err("failed to fetch audit logs"))
		return
	}

	c.JSON(200, models.OK(gin.H{
		"logs":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
		"pages": (int(total) + limit - 1) / limit,
	}))
}

// GET /audit/export.csv?from=2026-01-01&to=2026-12-31
func (h *Handler) ExportCSV(c *gin.Context) {
	orgID, ok := middleware.GetOrgID(c)
	if !ok {
		c.JSON(403, models.Err("organization required"))
		return
	}

	filters := audit.ListFilters{
		ResourceType: c.Query("resource_type"),
		Action:       c.Query("action"),
	}
	if f := c.Query("from"); f != "" {
		if t, err := time.Parse("2006-01-02", f); err == nil {
			filters.From = &t
		}
	}
	if t := c.Query("to"); t != "" {
		if parsed, err := time.Parse("2006-01-02", t); err == nil {
			end := parsed.Add(24*time.Hour - time.Second)
			filters.To = &end
		}
	}

	// Fetch up to 10 000 rows for export
	logs, _, err := h.svc.ListFiltered(c.Request.Context(), orgID, 1, 10000, filters)
	if err != nil {
		c.JSON(500, models.Err("failed to fetch audit logs"))
		return
	}

	filename := fmt.Sprintf("journal-audit-%s.csv", time.Now().Format("2006-01-02"))
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Header("Content-Type", "text/csv; charset=utf-8")
	// UTF-8 BOM for Excel compatibility
	c.Writer.Write([]byte("\xEF\xBB\xBF"))

	w := csv.NewWriter(c.Writer)
	w.Comma = ';'
	_ = w.Write([]string{"Date", "Utilisateur", "Action", "Ressource", "ID Ressource", "IP", "Détail"})

	for _, l := range logs {
		userID := ""
		if l.UserID != nil {
			userID = l.UserID.String()
		}
		detail := ""
		if l.Metadata != nil {
			detail = strings.ReplaceAll(string(l.Metadata), "\n", " ")
		}
		_ = w.Write([]string{
			l.CreatedAt.Format("02/01/2006 15:04:05"),
			userID,
			l.Action,
			l.ResourceType,
			l.ResourceID,
			l.IPAddress,
			detail,
		})
	}
	w.Flush()
}

func atoi(s string, def int) int {
	v, err := strconv.Atoi(s)
	if err != nil || v < 1 {
		return def
	}
	return v
}

// ── Middleware helper ─────────────────────────────────────────────────────────
// LogAction returns a gin middleware that logs an action after a successful response.
func LogAction(svc *audit.Service, action, resourceType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if c.Writer.Status() >= 200 && c.Writer.Status() < 300 {
			orgID, _ := middleware.GetOrgID(c)
			userIDVal, _ := c.Get("user_id")
			var userID *uuid.UUID
			if uid, ok := userIDVal.(uuid.UUID); ok {
				userID = &uid
			}
			orgPtr := &orgID
			svc.Log(c.Request.Context(), audit.LogInput{
				OrganizationID: orgPtr,
				UserID:         userID,
				Action:         action,
				ResourceType:   resourceType,
				ResourceID:     c.Param("id"),
				IPAddress:      c.ClientIP(),
				UserAgent:      c.Request.UserAgent(),
			})
		}
	}
}
