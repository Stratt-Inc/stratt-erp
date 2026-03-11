package crm

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func paginate(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}

// ─── Contacts ────────────────────────────────────────────

// GET /api/v1/crm/contacts
func (h *Handler) ListContacts(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	page, limit := paginate(c)
	contacts, total, err := h.repo.ListContacts(c.Request.Context(), orgID, c.Query("search"), page, limit)
	if err != nil {
		c.JSON(500, models.Err("failed to fetch contacts"))
		return
	}
	c.JSON(200, models.OK(gin.H{"items": contacts, "total": total, "page": page, "limit": limit}))
}

// POST /api/v1/crm/contacts
func (h *Handler) CreateContact(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var contact Contact
	if err := c.ShouldBindJSON(&contact); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	contact.TenantID = orgID
	if err := h.repo.CreateContact(c.Request.Context(), &contact); err != nil {
		c.JSON(500, models.Err("failed to create contact"))
		return
	}
	c.JSON(201, models.OK(contact))
}

// GET /api/v1/crm/contacts/:id
func (h *Handler) GetContact(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid contact ID"))
		return
	}
	contact, err := h.repo.FindContact(c.Request.Context(), id, orgID)
	if err != nil {
		c.JSON(404, models.Err("contact not found"))
		return
	}
	c.JSON(200, models.OK(contact))
}

// PUT /api/v1/crm/contacts/:id
func (h *Handler) UpdateContact(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid contact ID"))
		return
	}
	contact, err := h.repo.FindContact(c.Request.Context(), id, orgID)
	if err != nil {
		c.JSON(404, models.Err("contact not found"))
		return
	}
	if err := c.ShouldBindJSON(contact); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	contact.TenantID = orgID
	if err := h.repo.UpdateContact(c.Request.Context(), contact); err != nil {
		c.JSON(500, models.Err("failed to update contact"))
		return
	}
	c.JSON(200, models.OK(contact))
}

// DELETE /api/v1/crm/contacts/:id
func (h *Handler) DeleteContact(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid contact ID"))
		return
	}
	if err := h.repo.DeleteContact(c.Request.Context(), id, orgID); err != nil {
		c.JSON(500, models.Err("failed to delete contact"))
		return
	}
	c.JSON(200, models.Msg("contact deleted"))
}

// ─── Leads ───────────────────────────────────────────────

func (h *Handler) ListLeads(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	page, limit := paginate(c)
	leads, total, err := h.repo.ListLeads(c.Request.Context(), orgID, c.Query("status"), page, limit)
	if err != nil {
		c.JSON(500, models.Err("failed to fetch leads"))
		return
	}
	c.JSON(200, models.OK(gin.H{"items": leads, "total": total, "page": page, "limit": limit}))
}

func (h *Handler) CreateLead(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var lead Lead
	if err := c.ShouldBindJSON(&lead); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	lead.TenantID = orgID
	if err := h.repo.CreateLead(c.Request.Context(), &lead); err != nil {
		c.JSON(500, models.Err("failed to create lead"))
		return
	}
	c.JSON(201, models.OK(lead))
}

func (h *Handler) GetLead(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid lead ID"))
		return
	}
	lead, err := h.repo.FindLead(c.Request.Context(), id, orgID)
	if err != nil {
		c.JSON(404, models.Err("lead not found"))
		return
	}
	c.JSON(200, models.OK(lead))
}

func (h *Handler) UpdateLead(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid lead ID"))
		return
	}
	lead, err := h.repo.FindLead(c.Request.Context(), id, orgID)
	if err != nil {
		c.JSON(404, models.Err("lead not found"))
		return
	}
	if err := c.ShouldBindJSON(lead); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	lead.TenantID = orgID
	if err := h.repo.UpdateLead(c.Request.Context(), lead); err != nil {
		c.JSON(500, models.Err("failed to update lead"))
		return
	}
	c.JSON(200, models.OK(lead))
}

// ─── Deals ───────────────────────────────────────────────

func (h *Handler) ListDeals(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	page, limit := paginate(c)
	deals, total, err := h.repo.ListDeals(c.Request.Context(), orgID, c.Query("stage"), page, limit)
	if err != nil {
		c.JSON(500, models.Err("failed to fetch deals"))
		return
	}
	c.JSON(200, models.OK(gin.H{"items": deals, "total": total, "page": page, "limit": limit}))
}

func (h *Handler) CreateDeal(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var deal Deal
	if err := c.ShouldBindJSON(&deal); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	deal.TenantID = orgID
	if err := h.repo.CreateDeal(c.Request.Context(), &deal); err != nil {
		c.JSON(500, models.Err("failed to create deal"))
		return
	}
	c.JSON(201, models.OK(deal))
}

func (h *Handler) GetDeal(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid deal ID"))
		return
	}
	deal, err := h.repo.FindDeal(c.Request.Context(), id, orgID)
	if err != nil {
		c.JSON(404, models.Err("deal not found"))
		return
	}
	c.JSON(200, models.OK(deal))
}

func (h *Handler) UpdateDeal(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid deal ID"))
		return
	}
	deal, err := h.repo.FindDeal(c.Request.Context(), id, orgID)
	if err != nil {
		c.JSON(404, models.Err("deal not found"))
		return
	}
	if err := c.ShouldBindJSON(deal); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	deal.TenantID = orgID
	if err := h.repo.UpdateDeal(c.Request.Context(), deal); err != nil {
		c.JSON(500, models.Err("failed to update deal"))
		return
	}
	c.JSON(200, models.OK(deal))
}
