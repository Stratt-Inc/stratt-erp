package rbac

import (
	"github.com/axiora/backend/internal/ctxutil"
	"github.com/axiora/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GET /api/v1/roles
func (h *Handler) ListRoles(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	roles, err := h.svc.ListRoles(c.Context(), orgID)
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch roles"))
	}
	return c.JSON(models.OK(roles))
}

// POST /api/v1/roles
func (h *Handler) CreateRole(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	if body.Name == "" {
		return c.Status(400).JSON(models.Err("name is required"))
	}
	role, err := h.svc.CreateRole(c.Context(), orgID, body.Name, body.Description)
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to create role"))
	}
	return c.Status(201).JSON(models.OK(role))
}

// PUT /api/v1/roles/:id
func (h *Handler) UpdateRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid role ID"))
	}
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	role, err := h.svc.UpdateRole(c.Context(), id, body.Name, body.Description)
	if err != nil {
		if err == ErrSystemRole {
			return c.Status(403).JSON(models.Err(err.Error()))
		}
		return c.Status(500).JSON(models.Err("failed to update role"))
	}
	return c.JSON(models.OK(role))
}

// DELETE /api/v1/roles/:id
func (h *Handler) DeleteRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid role ID"))
	}
	if err := h.svc.DeleteRole(c.Context(), id); err != nil {
		if err == ErrSystemRole {
			return c.Status(403).JSON(models.Err(err.Error()))
		}
		return c.Status(500).JSON(models.Err("failed to delete role"))
	}
	return c.JSON(models.Msg("role deleted"))
}

// GET /api/v1/permissions
func (h *Handler) ListPermissions(c *fiber.Ctx) error {
	perms, err := h.svc.ListPermissions(c.Context())
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch permissions"))
	}
	return c.JSON(models.OK(perms))
}

// POST /api/v1/roles/:id/permissions
func (h *Handler) AssignPermission(c *fiber.Ctx) error {
	roleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid role ID"))
	}
	var body struct {
		Permission string `json:"permission"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	if err := h.svc.AssignPermissionToRole(c.Context(), roleID, body.Permission); err != nil {
		return c.Status(500).JSON(models.Err("failed to assign permission"))
	}
	return c.JSON(models.Msg("permission assigned"))
}

// POST /api/v1/users/:id/roles
func (h *Handler) AssignRoleToUser(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	targetUserID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid user ID"))
	}
	var body struct {
		RoleID string `json:"role_id"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	roleID, err := uuid.Parse(body.RoleID)
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid role ID"))
	}
	if err := h.svc.AssignRoleToUser(c.Context(), targetUserID, orgID, roleID); err != nil {
		return c.Status(500).JSON(models.Err("failed to assign role"))
	}
	return c.JSON(models.Msg("role assigned"))
}
