package crm

import (
	"strconv"

	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func paginate(c *fiber.Ctx) (int, int) {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
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
func (h *Handler) ListContacts(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	page, limit := paginate(c)
	contacts, total, err := h.repo.ListContacts(c.Context(), orgID, c.Query("search"), page, limit)
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch contacts"))
	}
	return c.JSON(models.OK(fiber.Map{"items": contacts, "total": total, "page": page, "limit": limit}))
}

// POST /api/v1/crm/contacts
func (h *Handler) CreateContact(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var contact Contact
	if err := c.BodyParser(&contact); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	contact.TenantID = orgID
	if err := h.repo.CreateContact(c.Context(), &contact); err != nil {
		return c.Status(500).JSON(models.Err("failed to create contact"))
	}
	return c.Status(201).JSON(models.OK(contact))
}

// GET /api/v1/crm/contacts/:id
func (h *Handler) GetContact(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid contact ID"))
	}
	contact, err := h.repo.FindContact(c.Context(), id, orgID)
	if err != nil {
		return c.Status(404).JSON(models.Err("contact not found"))
	}
	return c.JSON(models.OK(contact))
}

// PUT /api/v1/crm/contacts/:id
func (h *Handler) UpdateContact(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid contact ID"))
	}
	contact, err := h.repo.FindContact(c.Context(), id, orgID)
	if err != nil {
		return c.Status(404).JSON(models.Err("contact not found"))
	}
	if err := c.BodyParser(contact); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	contact.TenantID = orgID
	if err := h.repo.UpdateContact(c.Context(), contact); err != nil {
		return c.Status(500).JSON(models.Err("failed to update contact"))
	}
	return c.JSON(models.OK(contact))
}

// DELETE /api/v1/crm/contacts/:id
func (h *Handler) DeleteContact(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid contact ID"))
	}
	if err := h.repo.DeleteContact(c.Context(), id, orgID); err != nil {
		return c.Status(500).JSON(models.Err("failed to delete contact"))
	}
	return c.JSON(models.Msg("contact deleted"))
}

// ─── Leads ───────────────────────────────────────────────

func (h *Handler) ListLeads(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	page, limit := paginate(c)
	leads, total, err := h.repo.ListLeads(c.Context(), orgID, c.Query("status"), page, limit)
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch leads"))
	}
	return c.JSON(models.OK(fiber.Map{"items": leads, "total": total, "page": page, "limit": limit}))
}

func (h *Handler) CreateLead(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var lead Lead
	if err := c.BodyParser(&lead); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	lead.TenantID = orgID
	if err := h.repo.CreateLead(c.Context(), &lead); err != nil {
		return c.Status(500).JSON(models.Err("failed to create lead"))
	}
	return c.Status(201).JSON(models.OK(lead))
}

func (h *Handler) GetLead(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid lead ID"))
	}
	lead, err := h.repo.FindLead(c.Context(), id, orgID)
	if err != nil {
		return c.Status(404).JSON(models.Err("lead not found"))
	}
	return c.JSON(models.OK(lead))
}

func (h *Handler) UpdateLead(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid lead ID"))
	}
	lead, err := h.repo.FindLead(c.Context(), id, orgID)
	if err != nil {
		return c.Status(404).JSON(models.Err("lead not found"))
	}
	if err := c.BodyParser(lead); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	lead.TenantID = orgID
	if err := h.repo.UpdateLead(c.Context(), lead); err != nil {
		return c.Status(500).JSON(models.Err("failed to update lead"))
	}
	return c.JSON(models.OK(lead))
}

// ─── Deals ───────────────────────────────────────────────

func (h *Handler) ListDeals(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	page, limit := paginate(c)
	deals, total, err := h.repo.ListDeals(c.Context(), orgID, c.Query("stage"), page, limit)
	if err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch deals"))
	}
	return c.JSON(models.OK(fiber.Map{"items": deals, "total": total, "page": page, "limit": limit}))
}

func (h *Handler) CreateDeal(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var deal Deal
	if err := c.BodyParser(&deal); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	deal.TenantID = orgID
	if err := h.repo.CreateDeal(c.Context(), &deal); err != nil {
		return c.Status(500).JSON(models.Err("failed to create deal"))
	}
	return c.Status(201).JSON(models.OK(deal))
}

func (h *Handler) GetDeal(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid deal ID"))
	}
	deal, err := h.repo.FindDeal(c.Context(), id, orgID)
	if err != nil {
		return c.Status(404).JSON(models.Err("deal not found"))
	}
	return c.JSON(models.OK(deal))
}

func (h *Handler) UpdateDeal(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid deal ID"))
	}
	deal, err := h.repo.FindDeal(c.Context(), id, orgID)
	if err != nil {
		return c.Status(404).JSON(models.Err("deal not found"))
	}
	if err := c.BodyParser(deal); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	deal.TenantID = orgID
	if err := h.repo.UpdateDeal(c.Context(), deal); err != nil {
		return c.Status(500).JSON(models.Err("failed to update deal"))
	}
	return c.JSON(models.OK(deal))
}
