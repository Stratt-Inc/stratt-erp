package procurement

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/purchase-orders", h.ListOrders)
	r.POST("/purchase-orders", h.CreateOrder)
	r.GET("/purchase-orders/:id", h.GetOrder)
	r.GET("/compliance", h.Compliance)
}
