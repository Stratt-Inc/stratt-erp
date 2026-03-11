package marches

import (
	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) List(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var marches []Marche
	q := h.db.WithContext(c.Request.Context()).Where("tenant_id = ?", orgID)
	if statut := c.Query("statut"); statut != "" {
		q = q.Where("statut = ?", statut)
	}
	if priorite := c.Query("priorite"); priorite != "" {
		q = q.Where("priorite = ?", priorite)
	}
	if err := q.Order("created_at DESC").Find(&marches).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch marches"))
		return
	}
	c.JSON(200, models.OK(marches))
}

func (h *Handler) Create(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var marche Marche
	if err := c.ShouldBindJSON(&marche); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	marche.TenantID = orgID
	if err := h.db.WithContext(c.Request.Context()).Create(&marche).Error; err != nil {
		c.JSON(500, models.Err("failed to create marche"))
		return
	}
	c.JSON(201, models.OK(marche))
}

func (h *Handler) Stats(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var total, enCours, alertes int64
	ctx := c.Request.Context()
	h.db.WithContext(ctx).Model(&Marche{}).Where("tenant_id = ?", orgID).Count(&total)
	h.db.WithContext(ctx).Model(&Marche{}).Where("tenant_id = ? AND statut = ?", orgID, "en_cours").Count(&enCours)
	h.db.WithContext(ctx).Model(&Marche{}).Where("tenant_id = ? AND statut = ?", orgID, "alerte").Count(&alertes)

	type Result struct {
		Budget float64
		Charge int64
	}
	var res Result
	h.db.WithContext(ctx).Model(&Marche{}).
		Select("COALESCE(SUM(montant), 0) as budget, COALESCE(SUM(charge), 0) as charge").
		Where("tenant_id = ?", orgID).Scan(&res)

	c.JSON(200, models.OK(gin.H{
		"total":        total,
		"en_cours":     enCours,
		"alertes":      alertes,
		"budget_total": res.Budget,
		"charge_total": res.Charge,
	}))
}
