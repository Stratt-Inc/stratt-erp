// Package ctxutil provides helpers for extracting typed values from Gin context.
package ctxutil

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetUserID returns the authenticated user's UUID stored in Gin context.
func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

// GetOrgID returns the current organization's UUID stored in Gin context.
func GetOrgID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("org_id")
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

// GetSessionID returns the session UUID stored in Gin context.
func GetSessionID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get("session_id")
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}
