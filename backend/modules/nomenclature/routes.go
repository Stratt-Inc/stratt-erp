package nomenclature

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	// Nodes
	r.GET("", h.List)
	r.GET("/search", h.Search)
	r.POST("", h.Create)
	r.PUT("/:id", h.Update)
	r.DELETE("/:id", h.Delete)

	// Node ↔ Tag association
	r.POST("/:id/tags/:tagId", h.AddTagToNode)
	r.DELETE("/:id/tags/:tagId", h.RemoveTagFromNode)

	// Tags CRUD
	r.GET("/tags", h.ListTags)
	r.POST("/tags", h.CreateTag)
	r.DELETE("/tags/:tagId", h.DeleteTag)
}
