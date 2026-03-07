package middleware

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/internal/organization"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// RequireOrganization validates the X-Organization-Id header and ensures
// the authenticated user is a member of that organization.
func RequireOrganization(orgSvc *organization.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		rawOrgID := c.Get("X-Organization-Id")
		if rawOrgID == "" {
			// Also accept as query param
			rawOrgID = c.Query("org_id")
		}
		if rawOrgID == "" {
			return c.Status(400).JSON(models.Err("X-Organization-Id header is required"))
		}

		orgID, err := uuid.Parse(rawOrgID)
		if err != nil {
			return c.Status(400).JSON(models.Err("invalid organization ID"))
		}

		userID, ok := GetUserID(c)
		if !ok {
			return c.Status(401).JSON(models.Err("authentication required"))
		}

		member, err := orgSvc.GetMember(c.Context(), orgID, userID)
		if err != nil {
			return c.Status(403).JSON(models.Err("you are not a member of this organization"))
		}

		c.Locals("org_id", orgID)
		c.Locals("org_member", member)

		return c.Next()
	}
}
