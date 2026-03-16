package marches

import (
	"strconv"
	"time"

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

// GET /api/v1/marches/calendar?year=2026&month=3
// Returns all marchés that overlap the given month (have at least one date field in range).
func (h *Handler) Calendar(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	now := time.Now()
	year := parseInt(c.DefaultQuery("year", strconv.Itoa(now.Year())), now.Year())
	month := parseInt(c.DefaultQuery("month", strconv.Itoa(int(now.Month()))), int(now.Month()))
	if month < 1 || month > 12 {
		month = int(now.Month())
	}

	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)

	var marches []Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ?", orgID).
		Where(
			// overlap: marche starts before end of month AND ends after start of month
			// A marché is included if any of its dates falls in the month, or it spans across it.
			`(date_lancement < ? AND (date_fin IS NULL OR date_fin >= ?)) OR
			 (date_lancement IS NULL AND date_fin >= ? AND date_fin < ?) OR
			 (date_attribution >= ? AND date_attribution < ?) OR
			 (date_lancement >= ? AND date_lancement < ?)`,
			end, start,
			start, end,
			start, end,
			start, end,
		).
		Order("date_lancement ASC NULLS LAST, created_at ASC").
		Find(&marches)

	c.JSON(200, models.OK(gin.H{
		"year":    year,
		"month":   month,
		"marches": marches,
	}))
}

// GET /api/v1/marches/alertes?days=30
// Returns marchés with date_attribution or date_fin within the next N days.
func (h *Handler) Alertes(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	ctx := c.Request.Context()

	days := parseInt(c.DefaultQuery("days", "30"), 30)
	if days < 1 || days > 365 {
		days = 30
	}

	horizon := time.Now().AddDate(0, 0, days)
	now := time.Now()

	var marches []Marche
	h.db.WithContext(ctx).
		Where("tenant_id = ? AND statut NOT IN ('termine','annule')", orgID).
		Where(
			`(date_attribution >= ? AND date_attribution <= ?) OR
			 (date_fin >= ? AND date_fin <= ?)`,
			now, horizon,
			now, horizon,
		).
		Order("date_attribution ASC NULLS LAST, date_fin ASC NULLS LAST").
		Find(&marches)

	c.JSON(200, models.OK(gin.H{
		"days":    days,
		"horizon": horizon.Format(time.RFC3339),
		"marches": marches,
	}))
}

func parseInt(s string, def int) int {
	v, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return v
}
