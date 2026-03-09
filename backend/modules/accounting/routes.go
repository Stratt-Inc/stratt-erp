package accounting

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/accounts", h.ListAccounts)
	r.POST("/accounts", h.CreateAccount)
	r.GET("/transactions", h.ListTransactions)
	r.POST("/transactions", h.CreateTransaction)
}
