// Package ctxutil provides helpers for extracting typed values from Fiber context locals.
package ctxutil

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetUserID returns the authenticated user's UUID stored in Fiber context locals.
func GetUserID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("user_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

// GetOrgID returns the current organization's UUID stored in Fiber context locals.
func GetOrgID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("org_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

// GetSessionID returns the session UUID stored in Fiber context locals.
func GetSessionID(c *fiber.Ctx) (uuid.UUID, bool) {
	v := c.Locals("session_id")
	if v == nil {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}
