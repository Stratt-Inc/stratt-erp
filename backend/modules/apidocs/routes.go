package apidocs

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/openapi.json", h.OpenAPISpec)
	// API key management (requires org auth)
	r.GET("/api-keys", h.ListAPIKeys)
	r.POST("/api-keys", h.CreateAPIKey)
	r.DELETE("/api-keys/:id", h.DeleteAPIKey)
}

// RegisterDocsRoute adds the public Swagger UI at /docs.
func RegisterDocsRoute(r *gin.Engine, h *Handler) {
	r.GET("/docs", h.SwaggerUI)
}
