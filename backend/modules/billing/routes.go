package billing

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/invoices", h.ListInvoices)
	r.POST("/invoices", h.CreateInvoice)
	r.GET("/invoices/:id", h.GetInvoice)
	r.PATCH("/invoices/:id/status", h.UpdateInvoiceStatus)
}
