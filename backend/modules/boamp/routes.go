package boamp

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/search", h.Search)
	r.GET("/veille", h.ListVeille)
	r.POST("/veille", h.CreateVeille)
	r.DELETE("/veille/:id", h.DeleteVeille)
	r.GET("/veille/:id/run", h.RunVeille)
}
