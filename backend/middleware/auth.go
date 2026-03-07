package middleware

import (
	"strings"

	"github.com/axiora/backend/internal/auth"
	"github.com/axiora/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// RequireAuth validates the JWT access token and sets user context locals.
func RequireAuth(authSvc *auth.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		raw := extractBearerToken(c)
		if raw == "" {
			return c.Status(401).JSON(models.Err("authentication required"))
		}

		claims, err := authSvc.ParseAccessToken(raw)
		if err != nil {
			return c.Status(401).JSON(models.Err("invalid or expired access token"))
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("session_id", claims.SessionID)
		if claims.OrgID != nil {
			c.Locals("org_id", *claims.OrgID)
		}

		return c.Next()
	}
}

func extractBearerToken(c *fiber.Ctx) string {
	header := c.Get("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		return strings.TrimPrefix(header, "Bearer ")
	}
	return ""
}

// GetUserID extracts the authenticated user UUID from Fiber context.
func GetUserID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("user_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

// GetOrgID extracts the current organization UUID from Fiber context.
func GetOrgID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("org_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

// GetSessionID extracts the session UUID from Fiber context.
func GetSessionID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("session_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}
