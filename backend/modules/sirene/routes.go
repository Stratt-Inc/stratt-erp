package sirene

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/lookup", h.Lookup)
	r.POST("/enrich/:contact_id", h.EnrichContact)
	r.GET("/enrichments", h.ListEnrichments)
	r.DELETE("/enrichments/:contact_id", h.ClearCache)
	r.GET("/alerts", h.Alerts)
}
