package quiz

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/themes", h.ThemeList)
	r.GET("/questions", h.Questions)
	r.POST("/check", h.Check)
}
