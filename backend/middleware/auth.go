package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/auth"
	"github.com/stratt/backend/internal/models"
)

// RequireAuth validates the JWT access token and sets user context values.
func RequireAuth(authSvc *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := extractBearerToken(c)
		if raw == "" {
			c.JSON(401, models.Err("authentication required"))
			c.Abort()
			return
		}

		claims, err := authSvc.ParseAccessToken(raw)
		if err != nil {
			c.JSON(401, models.Err("invalid or expired access token"))
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("session_id", claims.SessionID)
		if claims.OrgID != nil {
			c.Set("org_id", *claims.OrgID)
		}

		c.Next()
	}
}

func extractBearerToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		return strings.TrimPrefix(header, "Bearer ")
	}
	return ""
}

// GetUserID extracts the authenticated user UUID from Gin context.
func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

// GetOrgID extracts the current organization UUID from Gin context.
func GetOrgID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("org_id")
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

// GetSessionID extracts the session UUID from Gin context.
func GetSessionID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("session_id")
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}
