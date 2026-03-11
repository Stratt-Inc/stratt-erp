package accounting

import (
	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListAccounts(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var accounts []Account
	if err := h.db.WithContext(c.Request.Context()).Where("tenant_id = ?", orgID).Find(&accounts).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch accounts"))
		return
	}
	c.JSON(200, models.OK(accounts))
}

func (h *Handler) CreateAccount(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var acc Account
	if err := c.ShouldBindJSON(&acc); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	acc.TenantID = orgID
	if err := h.db.WithContext(c.Request.Context()).Create(&acc).Error; err != nil {
		c.JSON(500, models.Err("failed to create account"))
		return
	}
	c.JSON(201, models.OK(acc))
}

func (h *Handler) ListTransactions(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var txs []Transaction
	if err := h.db.WithContext(c.Request.Context()).Where("tenant_id = ?", orgID).Order("date DESC").Find(&txs).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch transactions"))
		return
	}
	c.JSON(200, models.OK(txs))
}

func (h *Handler) CreateTransaction(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	userID, _ := middleware.GetUserID(c)
	var tx Transaction
	if err := c.ShouldBindJSON(&tx); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	tx.TenantID = orgID
	tx.CreatedBy = userID
	if err := h.db.WithContext(c.Request.Context()).Create(&tx).Error; err != nil {
		c.JSON(500, models.Err("failed to create transaction"))
		return
	}
	c.JSON(201, models.OK(tx))
}
