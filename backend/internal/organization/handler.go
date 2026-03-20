package organization

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/ctxutil"
	"github.com/stratt/backend/internal/models"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// POST /api/v1/organizations
func (h *Handler) Create(c *gin.Context) {
	userID, _ := ctxutil.GetUserID(c)

	var body struct {
		Name string `json:"name"`
		Slug string `json:"slug"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	if body.Name == "" {
		c.JSON(400, models.Err("name is required"))
		return
	}

	org, err := h.svc.Create(c.Request.Context(), CreateInput{
		Name:    body.Name,
		Slug:    body.Slug,
		OwnerID: userID,
	})
	if err != nil {
		c.JSON(500, models.Err("failed to create organization"))
		return
	}

	c.JSON(201, models.OK(org))
}

// GET /api/v1/organizations
func (h *Handler) List(c *gin.Context) {
	userID, _ := ctxutil.GetUserID(c)

	orgs, err := h.svc.ListByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(500, models.Err("failed to fetch organizations"))
		return
	}

	c.JSON(200, models.OK(orgs))
}

// GET /api/v1/organizations/:id
func (h *Handler) Get(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid organization ID"))
		return
	}

	org, err := h.svc.GetByID(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(404, models.Err("organization not found"))
		return
	}

	c.JSON(200, models.OK(org))
}

// GET /api/v1/organizations/:id/members
func (h *Handler) ListMembers(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid organization ID"))
		return
	}

	members, err := h.svc.ListMembers(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(500, models.Err("failed to fetch members"))
		return
	}

	c.JSON(200, models.OK(members))
}

// GET /api/v1/organizations/:id/my-role
func (h *Handler) GetMyRole(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid organization ID"))
		return
	}

	userID, _ := ctxutil.GetUserID(c)

	member, err := h.svc.GetMember(c.Request.Context(), orgID, userID)
	if err != nil {
		c.JSON(404, models.Err("membership not found"))
		return
	}

	roleName := ""
	if member.Role != nil {
		roleName = member.Role.Name
	}

	c.JSON(200, models.OK(gin.H{"role": roleName}))
}

// DELETE /api/v1/organizations/:id/members/:userId
func (h *Handler) RemoveMember(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid organization ID"))
		return
	}

	targetUserID, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		c.JSON(400, models.Err("invalid user ID"))
		return
	}

	requestingUserID, _ := ctxutil.GetUserID(c)

	if err := h.svc.RemoveMember(c.Request.Context(), orgID, targetUserID, requestingUserID); err != nil {
		c.JSON(400, models.Err(err.Error()))
		return
	}

	c.JSON(200, models.Msg("member removed"))
}
