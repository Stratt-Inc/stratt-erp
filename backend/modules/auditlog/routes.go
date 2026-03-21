package auditlog

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("", h.List)
	r.GET("/export.csv", h.ExportCSV)
}
