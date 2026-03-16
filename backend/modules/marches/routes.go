package marches

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/stats", h.Stats)
	r.GET("/calendar", h.Calendar)
	r.GET("/alertes", h.Alertes)
	r.GET("", h.List)
	r.POST("", h.Create)
}
