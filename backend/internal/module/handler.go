package module

import (
	"time"

	"github.com/axiora/backend/internal/ctxutil"
	"github.com/axiora/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// GET /api/v1/modules
func (h *Handler) List(c *gin.Context) {
	orgID, _ := ctxutil.GetOrgID(c)

	var all []models.Module
	if err := h.db.WithContext(c.Request.Context()).Find(&all).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch modules"))
		return
	}

	var enabled []models.OrganizationModule
	h.db.WithContext(c.Request.Context()).Where("organization_id = ?", orgID).Find(&enabled)

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

	c.JSON(200, models.OK(views))
}

// POST /api/v1/modules/:id/enable
func (h *Handler) Enable(c *gin.Context) {
	orgID, _ := ctxutil.GetOrgID(c)
	moduleID := c.Param("id")

	var mod models.Module
	if err := h.db.WithContext(c.Request.Context()).First(&mod, "id = ?", moduleID).Error; err != nil {
		c.JSON(404, models.Err("module not found"))
		return
	}

	om := models.OrganizationModule{
		OrganizationID: orgID,
		ModuleID:       moduleID,
		EnabledAt:      time.Now(),
	}
	if err := h.db.WithContext(c.Request.Context()).
		Where("organization_id = ? AND module_id = ?", orgID, moduleID).
		FirstOrCreate(&om).Error; err != nil {
		c.JSON(500, models.Err("failed to enable module"))
		return
	}

	c.JSON(200, models.Msg("module enabled"))
}

// POST /api/v1/modules/:id/disable
func (h *Handler) Disable(c *gin.Context) {
	orgID, _ := ctxutil.GetOrgID(c)
	moduleID := c.Param("id")

	if err := h.db.WithContext(c.Request.Context()).
		Where("organization_id = ? AND module_id = ?", orgID, moduleID).
		Delete(&models.OrganizationModule{}).Error; err != nil {
		c.JSON(500, models.Err("failed to disable module"))
		return
	}

	c.JSON(200, models.Msg("module disabled"))
}
