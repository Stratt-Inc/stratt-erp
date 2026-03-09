package middleware

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/internal/rbac"
	"github.com/gin-gonic/gin"
)

// RequirePermission checks that the authenticated user has the given permission
// within the current organization (set by RequireOrganization).
func RequirePermission(rbacSvc *rbac.Service, permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := GetUserID(c)
		if !ok {
			c.JSON(401, models.Err("authentication required"))
			c.Abort()
			return
		}

		orgID, ok := GetOrgID(c)
		if !ok {
			c.JSON(400, models.Err("organization context required"))
			c.Abort()
			return
		}

		has, err := rbacSvc.HasPermission(c.Request.Context(), userID, orgID, permission)
		if err != nil {
			c.JSON(500, models.Err("permission check failed"))
			c.Abort()
			return
		}
		if !has {
			c.JSON(403, models.Err("insufficient permissions: "+permission+" required"))
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission checks that the user has at least one of the given permissions.
func RequireAnyPermission(rbacSvc *rbac.Service, permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := GetUserID(c)
		if !ok {
			c.JSON(401, models.Err("authentication required"))
			c.Abort()
			return
		}

		orgID, ok := GetOrgID(c)
		if !ok {
			c.JSON(400, models.Err("organization context required"))
			c.Abort()
			return
		}

		for _, perm := range permissions {
			has, err := rbacSvc.HasPermission(c.Request.Context(), userID, orgID, perm)
			if err != nil {
				continue
			}
			if has {
				c.Next()
				return
			}
		}

		c.JSON(403, models.Err("insufficient permissions"))
		c.Abort()
	}
}
