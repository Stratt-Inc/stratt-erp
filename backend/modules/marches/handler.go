package marches

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) List(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var marches []Marche
	q := h.db.WithContext(c.Context()).Where("tenant_id = ?", orgID)
	if statut := c.Query("statut"); statut != "" {
		q = q.Where("statut = ?", statut)
	}
	if priorite := c.Query("priorite"); priorite != "" {
		q = q.Where("priorite = ?", priorite)
	}
	if err := q.Order("created_at DESC").Find(&marches).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch marches"))
	}
	return c.JSON(models.OK(marches))
}

func (h *Handler) Create(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var marche Marche
	if err := c.BodyParser(&marche); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	marche.TenantID = orgID
	if err := h.db.WithContext(c.Context()).Create(&marche).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create marche"))
	}
	return c.Status(201).JSON(models.OK(marche))
}

func (h *Handler) Stats(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var total, enCours, alertes int64
	h.db.WithContext(c.Context()).Model(&Marche{}).Where("tenant_id = ?", orgID).Count(&total)
	h.db.WithContext(c.Context()).Model(&Marche{}).Where("tenant_id = ? AND statut = ?", orgID, "en_cours").Count(&enCours)
	h.db.WithContext(c.Context()).Model(&Marche{}).Where("tenant_id = ? AND statut = ?", orgID, "alerte").Count(&alertes)

	type Result struct {
		Budget float64
		Charge int64
	}
	var res Result
	h.db.WithContext(c.Context()).Model(&Marche{}).
		Select("COALESCE(SUM(montant), 0) as budget, COALESCE(SUM(charge), 0) as charge").
		Where("tenant_id = ?", orgID).Scan(&res)

	return c.JSON(models.OK(fiber.Map{
		"total":        total,
		"en_cours":     enCours,
		"alertes":      alertes,
		"budget_total": res.Budget,
		"charge_total": res.Charge,
	}))
}
