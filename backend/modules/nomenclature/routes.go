package nomenclature

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	// Nodes
	r.GET("", h.List)
	r.GET("/search", h.Search)
	r.POST("", h.Create)
	r.PUT("/:id", h.Update)
	r.DELETE("/:id", h.Delete)

	// Propagation — impact preview, merge, recode, delete+remap, rollback
	r.GET("/:id/impact", h.GetImpact)
	r.POST("/:id/merge", h.MergeCode)
	r.POST("/:id/recode", h.RecodeNode)
	r.DELETE("/:id/remap", h.DeleteWithRemap)
	r.POST("/rollback/:auditId", h.RollbackOperation)
	r.GET("/history", h.AuditHistory)

	// Node ↔ Tag association
	r.POST("/:id/tags/:tagId", h.AddTagToNode)
	r.DELETE("/:id/tags/:tagId", h.RemoveTagFromNode)

	// Tags CRUD
	r.GET("/tags", h.ListTags)
	r.POST("/tags", h.CreateTag)
	r.DELETE("/tags/:tagId", h.DeleteTag)
}
