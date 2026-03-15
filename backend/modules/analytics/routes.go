package analytics

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/overview", h.Overview)
	r.GET("/abc", h.ABC)
}
