package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/internal/organization"
)

// RequireOrganization validates the X-Organization-Id header and ensures
// the authenticated user is a member of that organization.
func RequireOrganization(orgSvc *organization.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawOrgID := c.GetHeader("X-Organization-Id")
		if rawOrgID == "" {
			// Also accept as query param
			rawOrgID = c.Query("org_id")
		}
		if rawOrgID == "" {
			c.JSON(400, models.Err("X-Organization-Id header is required"))
			c.Abort()
			return
		}

		orgID, err := uuid.Parse(rawOrgID)
		if err != nil {
			c.JSON(400, models.Err("invalid organization ID"))
			c.Abort()
			return
		}

		userID, ok := GetUserID(c)
		if !ok {
			c.JSON(401, models.Err("authentication required"))
			c.Abort()
			return
		}

		member, err := orgSvc.GetMember(c.Request.Context(), orgID, userID)
		if err != nil {
			c.JSON(403, models.Err("you are not a member of this organization"))
			c.Abort()
			return
		}

		c.Set("org_id", orgID)
		c.Set("org_member", member)

		c.Next()
	}
}
