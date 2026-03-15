package ctxutil

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetUserID extracts the authenticated user UUID from Fiber context locals.
func GetUserID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("user_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

// GetOrgID extracts the current organization UUID from Fiber context locals.
func GetOrgID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("org_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

// GetSessionID extracts the session UUID from Fiber context locals.
func GetSessionID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("session_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}
