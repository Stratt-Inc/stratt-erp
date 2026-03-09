package inventory

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/products", h.ListProducts)
	r.POST("/products", h.CreateProduct)
	r.GET("/products/:id", h.GetProduct)
	r.POST("/stock-movements", h.AddStockMovement)
}
