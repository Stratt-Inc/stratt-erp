package accounting

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListAccounts(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var accounts []Account
	if err := h.db.WithContext(c.Context()).Where("tenant_id = ?", orgID).Find(&accounts).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch accounts"))
	}
	return c.JSON(models.OK(accounts))
}

func (h *Handler) CreateAccount(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var acc Account
	if err := c.BodyParser(&acc); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	acc.TenantID = orgID
	if err := h.db.WithContext(c.Context()).Create(&acc).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create account"))
	}
	return c.Status(201).JSON(models.OK(acc))
}

func (h *Handler) ListTransactions(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var txs []Transaction
	if err := h.db.WithContext(c.Context()).Where("tenant_id = ?", orgID).Order("date DESC").Find(&txs).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch transactions"))
	}
	return c.JSON(models.OK(txs))
}

func (h *Handler) CreateTransaction(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)
	var tx Transaction
	if err := c.BodyParser(&tx); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	tx.TenantID = orgID
	tx.CreatedBy = userID
	if err := h.db.WithContext(c.Context()).Create(&tx).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create transaction"))
	}
	return c.Status(201).JSON(models.OK(tx))
}
