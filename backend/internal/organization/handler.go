package organization

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/internal/ctxutil"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// POST /api/v1/organizations
func (h *Handler) Create(c *fiber.Ctx) error {
	userID, _ := ctxutil.GetUserID(c)

	var body struct {
		Name string `json:"name"`
		Slug string `json:"slug"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	if body.Name == "" {
		return c.Status(400).JSON(models.Err("name is required"))
	}

	org, err := h.svc.Create(c.Context(), CreateInput{
		Name:    body.Name,
		Slug:    body.Slug,
		OwnerID: userID,
	})
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to create organization"))
	}

	return c.Status(201).JSON(models.OK(org))
}

// GET /api/v1/organizations
func (h *Handler) List(c *fiber.Ctx) error {
	userID, _ := ctxutil.GetUserID(c)

	orgs, err := h.svc.ListByUser(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch organizations"))
	}

	return c.JSON(models.OK(orgs))
}

// GET /api/v1/organizations/:id
func (h *Handler) Get(c *fiber.Ctx) error {
	orgID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid organization ID"))
	}

	org, err := h.svc.GetByID(c.Context(), orgID)
	if err != nil {
		return c.Status(404).JSON(models.Err("organization not found"))
	}

	return c.JSON(models.OK(org))
}

// GET /api/v1/organizations/:id/members
func (h *Handler) ListMembers(c *fiber.Ctx) error {
	orgID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid organization ID"))
	}

	members, err := h.svc.ListMembers(c.Context(), orgID)
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch members"))
	}

	return c.JSON(models.OK(members))
}

// DELETE /api/v1/organizations/:id/members/:userId
func (h *Handler) RemoveMember(c *fiber.Ctx) error {
	orgID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid organization ID"))
	}

	targetUserID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid user ID"))
	}

	requestingUserID, _ := ctxutil.GetUserID(c)

	if err := h.svc.RemoveMember(c.Context(), orgID, targetUserID, requestingUserID); err != nil {
		return c.Status(400).JSON(models.Err(err.Error()))
	}

	return c.JSON(models.Msg("member removed"))
}
