package middleware

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/internal/rbac"
	"github.com/gofiber/fiber/v2"
)

// RequirePermission checks that the authenticated user has the given permission
// within the current organization (set by RequireOrganization).
func RequirePermission(rbacSvc *rbac.Service, permission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := GetUserID(c)
		if !ok {
			return c.Status(401).JSON(models.Err("authentication required"))
		}

		orgID, ok := GetOrgID(c)
		if !ok {
			return c.Status(400).JSON(models.Err("organization context required"))
		}

		has, err := rbacSvc.HasPermission(c.Context(), userID, orgID, permission)
		if err != nil {
			return c.Status(500).JSON(models.Err("permission check failed"))
		}
		if !has {
			return c.Status(403).JSON(models.Err("insufficient permissions: " + permission + " required"))
		}

		return c.Next()
	}
}

// RequireAnyPermission checks that the user has at least one of the given permissions.
func RequireAnyPermission(rbacSvc *rbac.Service, permissions ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := GetUserID(c)
		if !ok {
			return c.Status(401).JSON(models.Err("authentication required"))
		}

		orgID, ok := GetOrgID(c)
		if !ok {
			return c.Status(400).JSON(models.Err("organization context required"))
		}

		for _, perm := range permissions {
			has, err := rbacSvc.HasPermission(c.Context(), userID, orgID, perm)
			if err != nil {
				continue
			}
			if has {
				return c.Next()
			}
		}

		return c.Status(403).JSON(models.Err("insufficient permissions"))
	}
}
