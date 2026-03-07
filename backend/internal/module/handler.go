package module

import (
	"time"

	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/internal/ctxutil"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// GET /api/v1/modules
func (h *Handler) List(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)

	var all []models.Module
	if err := h.db.WithContext(c.Context()).Find(&all).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch modules"))
	}

	var enabled []models.OrganizationModule
	h.db.WithContext(c.Context()).Where("organization_id = ?", orgID).Find(&enabled)

	enabledMap := make(map[string]bool, len(enabled))
	for _, m := range enabled {
		enabledMap[m.ModuleID] = true
	}

	type moduleView struct {
		models.Module
		Enabled bool `json:"enabled"`
	}
	views := make([]moduleView, len(all))
	for i, m := range all {
		views[i] = moduleView{Module: m, Enabled: enabledMap[m.ID]}
	}

	return c.JSON(models.OK(views))
}

// POST /api/v1/modules/:id/enable
func (h *Handler) Enable(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	moduleID := c.Params("id")

	var mod models.Module
	if err := h.db.WithContext(c.Context()).First(&mod, "id = ?", moduleID).Error; err != nil {
		return c.Status(404).JSON(models.Err("module not found"))
	}

	om := models.OrganizationModule{
		OrganizationID: orgID,
		ModuleID:       moduleID,
		EnabledAt:      time.Now(),
	}
	if err := h.db.WithContext(c.Context()).
		Where("organization_id = ? AND module_id = ?", orgID, moduleID).
		FirstOrCreate(&om).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to enable module"))
	}

	return c.JSON(models.Msg("module enabled"))
}

// POST /api/v1/modules/:id/disable
func (h *Handler) Disable(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	moduleID := c.Params("id")

	if err := h.db.WithContext(c.Context()).
		Where("organization_id = ? AND module_id = ?", orgID, moduleID).
		Delete(&models.OrganizationModule{}).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to disable module"))
	}

	return c.JSON(models.Msg("module disabled"))
}
