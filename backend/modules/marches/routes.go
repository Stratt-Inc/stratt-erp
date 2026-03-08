package marches

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Get("/stats", h.Stats)
	r.Get("/", h.List)
	r.Post("/", h.Create)
}
