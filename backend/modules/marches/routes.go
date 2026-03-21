package marches

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/stats", h.Stats)
	r.GET("/calendar", h.Calendar)
	r.GET("/alertes", h.Alertes)
	r.GET("/alertes/dashboard", h.AlertesDashboard)
	r.GET("/rapport", h.Rapport)
	r.POST("/import/preview", h.ImportPreview)
	r.POST("/import/confirm", h.ImportConfirm)
	r.GET("/:id/export", h.ExportDossier)
	r.GET("", h.List)
	r.POST("", h.Create)
}
