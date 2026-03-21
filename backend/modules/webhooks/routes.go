package webhooks

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/events", h.Events)
	r.GET("", h.List)
	r.POST("", h.Create)
	r.PUT("/:id", h.Update)
	r.DELETE("/:id", h.Delete)
	r.GET("/:id/deliveries", h.Deliveries)
	r.POST("/:id/test", h.Test)
}
