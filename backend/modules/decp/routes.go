package decp

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/export", h.Export)
	r.GET("/validate", h.Validate)
	r.POST("/publish", h.Publish)
	r.GET("/history", h.History)
	r.GET("/compliance", h.Compliance)
}
