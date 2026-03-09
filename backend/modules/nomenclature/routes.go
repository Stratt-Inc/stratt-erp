package nomenclature

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("", h.List)
	r.POST("", h.Create)
	r.PUT("/:id", h.Update)
}
