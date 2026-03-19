package chatbot

import "github.com/gin-gonic/gin"

// RegisterRoutes enregistre les routes authentifiées (gestion des tokens + analytics).
func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.POST("/tokens", h.CreateToken)
	r.GET("/tokens", h.ListTokens)
	r.DELETE("/tokens/:id", h.RevokeToken)
	r.GET("/analytics", h.Analytics)
}

// RegisterPublicRoutes enregistre les routes publiques (chat sans authentification).
func RegisterPublicRoutes(r *gin.RouterGroup, h *Handler) {
	r.POST("/chat/:token", h.Chat)
	r.GET("/chat/:token/history", h.History)
	r.POST("/chat/:token/feedback", h.Feedback)
}
