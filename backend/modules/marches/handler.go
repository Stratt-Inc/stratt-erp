package marches

import (
	"math"
	"sort"
	"time"

	"github.com/axiora/backend/internal/ctxutil"
	"github.com/axiora/backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// GET /api/v1/marches
func (h *Handler) List(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	var ms []Marche
	q := h.db.WithContext(c.Context()).Where("tenant_id = ?", orgID)
	if statut := c.Query("statut"); statut != "" {
		q = q.Where("statut = ?", statut)
	}
	if procedure := c.Query("procedure"); procedure != "" {
		q = q.Where("procedure = ?", procedure)
	}
	if service := c.Query("service"); service != "" {
		q = q.Where("service = ?", service)
	}
	if err := q.Order("date_lancement ASC, created_at DESC").Find(&ms).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch marchés"))
	}
	return c.JSON(models.OK(ms))
}

// POST /api/v1/marches
func (h *Handler) Create(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	userID, _ := ctxutil.GetUserID(c)
	var m Marche
	if err := c.BodyParser(&m); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	if m.Objet == "" {
		return c.Status(400).JSON(models.Err("l'objet du marché est requis"))
	}
	m.TenantID = orgID
	m.CreatedBy = userID
	if err := h.db.WithContext(c.Context()).Create(&m).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create marché"))
	}
	return c.Status(201).JSON(models.OK(m))
}

// GET /api/v1/marches/:id
func (h *Handler) Get(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid marché ID"))
	}
	var m Marche
	if err := h.db.WithContext(c.Context()).Where("id = ? AND tenant_id = ?", id, orgID).First(&m).Error; err != nil {
		return c.Status(404).JSON(models.Err("marché not found"))
	}
	return c.JSON(models.OK(m))
}

// PUT /api/v1/marches/:id
func (h *Handler) Update(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid marché ID"))
	}
	var m Marche
	if err := h.db.WithContext(c.Context()).Where("id = ? AND tenant_id = ?", id, orgID).First(&m).Error; err != nil {
		return c.Status(404).JSON(models.Err("marché not found"))
	}
	if err := c.BodyParser(&m); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	m.ID = id
	m.TenantID = orgID
	if err := h.db.WithContext(c.Context()).Save(&m).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to update marché"))
	}
	return c.JSON(models.OK(m))
}

// DELETE /api/v1/marches/:id
func (h *Handler) Delete(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid marché ID"))
	}
	if err := h.db.WithContext(c.Context()).Where("id = ? AND tenant_id = ?", id, orgID).Delete(&Marche{}).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to delete marché"))
	}
	return c.JSON(models.Msg("marché deleted"))
}

// GET /api/v1/marches/calendrier
// Retourne les marchés du mois/année demandé + les alertes J30/J90/J180.
func (h *Handler) Calendrier(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	now := time.Now()

	var ms []Marche
	if err := h.db.WithContext(c.Context()).
		Where("tenant_id = ? AND statut NOT IN ('clos','annule')", orgID).
		Find(&ms).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch marchés"))
	}

	var alertes []AlerteCalendrier
	for _, m := range ms {
		dates := []struct {
			val  *string
			kind string
		}{
			{m.DateLancement, "lancement"},
			{m.DateEcheance, "echeance"},
			{m.DateAttribution, "attribution"},
			{m.DateFin, "fin"},
		}
		for _, d := range dates {
			if d.val == nil || *d.val == "" {
				continue
			}
			t, err := time.Parse("2006-01-02", *d.val)
			if err != nil {
				continue
			}
			jours := int(math.Round(t.Sub(now).Hours() / 24))
			urgence := "normal"
			if jours < 0 {
				urgence = "depasse"
			} else if jours <= 30 {
				urgence = "urgent"
			} else if jours <= 90 {
				urgence = "proche"
			}
			alertes = append(alertes, AlerteCalendrier{
				MarcheID:      m.ID,
				Objet:         m.Objet,
				Service:       m.Service,
				Procedure:     m.Procedure,
				Statut:        m.Statut,
				Date:          *d.val,
				Type:          d.kind,
				JoursRestants: jours,
				Urgence:       urgence,
			})
		}
	}

	// Trier par date croissante
	sort.Slice(alertes, func(i, j int) bool {
		return alertes[i].Date < alertes[j].Date
	})

	return c.JSON(models.OK(fiber.Map{
		"marches": ms,
		"alertes": alertes,
	}))
}

// GET /api/v1/marches/stats
func (h *Handler) Stats(c *fiber.Ctx) error {
	orgID, _ := ctxutil.GetOrgID(c)
	ctx := c.Context()

	type stats struct {
		Total        int64   `json:"total"`
		Planifies    int64   `json:"planifies"`
		EnCours      int64   `json:"en_cours"`
		Attribues    int64   `json:"attribues"`
		BudgetTotal  float64 `json:"budget_total"`
		AlertesJ30   int64   `json:"alertes_j30"`
	}
	var s stats
	h.db.WithContext(ctx).Model(&Marche{}).Where("tenant_id = ?", orgID).Count(&s.Total)
	h.db.WithContext(ctx).Model(&Marche{}).Where("tenant_id = ? AND statut = 'planifie'", orgID).Count(&s.Planifies)
	h.db.WithContext(ctx).Model(&Marche{}).Where("tenant_id = ? AND statut = 'en_cours'", orgID).Count(&s.EnCours)
	h.db.WithContext(ctx).Model(&Marche{}).Where("tenant_id = ? AND statut = 'attribue'", orgID).Count(&s.Attribues)
	h.db.WithContext(ctx).Model(&Marche{}).Where("tenant_id = ?", orgID).Select("COALESCE(SUM(montant), 0)").Scan(&s.BudgetTotal)

	// Alertes J30 : marchés avec date_lancement dans les 30 prochains jours
	in30 := time.Now().AddDate(0, 0, 30).Format("2006-01-02")
	today := time.Now().Format("2006-01-02")
	h.db.WithContext(ctx).Model(&Marche{}).
		Where("tenant_id = ? AND date_lancement BETWEEN ? AND ? AND statut = 'planifie'", orgID, today, in30).
		Count(&s.AlertesJ30)

	return c.JSON(models.OK(s))
}
