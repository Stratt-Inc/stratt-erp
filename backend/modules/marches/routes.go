package marches

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/calendrier", h.Calendrier)
	r.Get("/stats", h.Stats)
	r.Get("/:id", h.Get)
	r.Put("/:id", h.Update)
	r.Delete("/:id", h.Delete)
}
