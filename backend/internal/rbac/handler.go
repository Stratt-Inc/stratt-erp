package rbac

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

// GET /api/v1/roles
func (h *Handler) ListRoles(c *gin.Context) {
	orgID, _ := ctxutil.GetOrgID(c)
	roles, err := h.svc.ListRoles(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(500, models.Err("failed to fetch roles"))
		return
	}
	c.JSON(200, models.OK(roles))
}

// POST /api/v1/roles
func (h *Handler) CreateRole(c *gin.Context) {
	orgID, _ := ctxutil.GetOrgID(c)
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	if body.Name == "" {
		c.JSON(400, models.Err("name is required"))
		return
	}
	role, err := h.svc.CreateRole(c.Request.Context(), orgID, body.Name, body.Description)
	if err != nil {
		c.JSON(500, models.Err("failed to create role"))
		return
	}
	c.JSON(201, models.OK(role))
}

// PUT /api/v1/roles/:id
func (h *Handler) UpdateRole(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid role ID"))
		return
	}
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	role, err := h.svc.UpdateRole(c.Request.Context(), id, body.Name, body.Description)
	if err != nil {
		if err == ErrSystemRole {
			c.JSON(403, models.Err(err.Error()))
			return
		}
		c.JSON(500, models.Err("failed to update role"))
		return
	}
	c.JSON(200, models.OK(role))
}

// DELETE /api/v1/roles/:id
func (h *Handler) DeleteRole(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid role ID"))
		return
	}
	if err := h.svc.DeleteRole(c.Request.Context(), id); err != nil {
		if err == ErrSystemRole {
			c.JSON(403, models.Err(err.Error()))
			return
		}
		c.JSON(500, models.Err("failed to delete role"))
		return
	}
	c.JSON(200, models.Msg("role deleted"))
}

// GET /api/v1/permissions
func (h *Handler) ListPermissions(c *gin.Context) {
	perms, err := h.svc.ListPermissions(c.Request.Context())
	if err != nil {
		c.JSON(500, models.Err("failed to fetch permissions"))
		return
	}
	c.JSON(200, models.OK(perms))
}

// POST /api/v1/roles/:id/permissions
func (h *Handler) AssignPermission(c *gin.Context) {
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid role ID"))
		return
	}
	var body struct {
		Permission string `json:"permission"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	if err := h.svc.AssignPermissionToRole(c.Request.Context(), roleID, body.Permission); err != nil {
		c.JSON(500, models.Err("failed to assign permission"))
		return
	}
	c.JSON(200, models.Msg("permission assigned"))
}

// POST /api/v1/users/:id/roles
func (h *Handler) AssignRoleToUser(c *gin.Context) {
	orgID, _ := ctxutil.GetOrgID(c)
	targetUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid user ID"))
		return
	}
	var body struct {
		RoleID string `json:"role_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	roleID, err := uuid.Parse(body.RoleID)
	if err != nil {
		c.JSON(400, models.Err("invalid role ID"))
		return
	}
	if err := h.svc.AssignRoleToUser(c.Request.Context(), targetUserID, orgID, roleID); err != nil {
		c.JSON(500, models.Err("failed to assign role"))
		return
	}
	c.JSON(200, models.Msg("role assigned"))
}
