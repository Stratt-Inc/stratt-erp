package boamp

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

// GET /api/v1/boamp/search?q=&cpv=&dept=&montant_min=&montant_max=&page=&page_size=
func (h *Handler) Search(c *gin.Context) {
	params := SearchParams{
		MotsCles:    c.Query("q"),
		CodeCPV:     c.Query("cpv"),
		Departement: c.Query("dept"),
		MontantMin:  parseFloat64(c.Query("montant_min"), 0),
		MontantMax:  parseFloat64(c.Query("montant_max"), 0),
		Page:        parseInt(c.DefaultQuery("page", "1"), 1),
		PageSize:    parseInt(c.DefaultQuery("page_size", "20"), 20),
	}

	avis, total, err := Search(params)
	if err != nil {
		// Return empty result instead of 500 when BOAMP is unreachable
		c.JSON(200, models.OK(gin.H{
			"avis":      []BOAMPAvis{},
			"total":     0,
			"page":      params.Page,
			"page_size": params.PageSize,
			"error":     err.Error(),
		}))
		return
	}

	c.JSON(200, models.OK(gin.H{
		"avis":      avis,
		"total":     total,
		"page":      params.Page,
		"page_size": params.PageSize,
	}))
}

// GET /api/v1/boamp/veille
func (h *Handler) ListVeille(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var veilles []BOAMPVeille
	h.db.WithContext(c.Request.Context()).
		Where("tenant_id = ?", orgID).
		Order("created_at DESC").
		Find(&veilles)
	c.JSON(200, models.OK(veilles))
}

// POST /api/v1/boamp/veille
func (h *Handler) CreateVeille(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var body BOAMPVeille
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	if body.Nom == "" {
		c.JSON(400, models.Err("nom est requis"))
		return
	}
	body.TenantID = orgID
	if err := h.db.WithContext(c.Request.Context()).Create(&body).Error; err != nil {
		c.JSON(500, models.Err("failed to create veille"))
		return
	}
	c.JSON(201, models.OK(body))
}

// DELETE /api/v1/boamp/veille/:id
func (h *Handler) DeleteVeille(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid ID"))
		return
	}
	orgID, _ := middleware.GetOrgID(c)
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", id, orgID).
		Delete(&BOAMPVeille{}).Error; err != nil {
		c.JSON(500, models.Err("failed to delete veille"))
		return
	}
	c.JSON(200, models.Msg("veille supprimée"))
}

// GET /api/v1/boamp/veille/:id/run
// Executes a saved veille and returns the matching AOs.
func (h *Handler) RunVeille(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid ID"))
		return
	}
	orgID, _ := middleware.GetOrgID(c)

	var veille BOAMPVeille
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND tenant_id = ?", id, orgID).
		First(&veille).Error; err != nil {
		c.JSON(404, models.Err("veille not found"))
		return
	}

	// Use first CPV code if multiple
	cpv := ""
	if veille.CodesCPV != "" {
		cpv = strings.SplitN(veille.CodesCPV, ",", 2)[0]
	}

	avis, total, err := Search(SearchParams{
		MotsCles:    veille.MotsCles,
		CodeCPV:     cpv,
		Departement: veille.Departement,
		MontantMin:  veille.MontantMin,
		MontantMax:  veille.MontantMax,
		PageSize:    50,
	})
	if err != nil {
		c.JSON(200, models.OK(gin.H{"avis": []BOAMPAvis{}, "total": 0, "error": err.Error()}))
		return
	}

	c.JSON(200, models.OK(gin.H{
		"veille": veille,
		"avis":   avis,
		"total":  total,
	}))
}

func parseFloat64(s string, def float64) float64 {
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return def
	}
	return v
}

func parseInt(s string, def int) int {
	v, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return v
}
