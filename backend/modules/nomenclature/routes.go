package nomenclature

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/:id", h.Update)
}
