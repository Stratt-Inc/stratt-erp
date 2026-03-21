package share

import "github.com/gin-gonic/gin"

// RegisterRoutes registers the authenticated share token creation endpoint.
func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.POST("", h.CreateShareToken)
}

// RegisterPublicRoutes registers the public (token-authenticated) elu stats endpoint.
func RegisterPublicRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/:token/stats", h.EluStats)
}
