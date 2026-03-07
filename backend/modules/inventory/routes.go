package inventory

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Get("/products", h.ListProducts)
	r.Post("/products", h.CreateProduct)
	r.Get("/products/:id", h.GetProduct)
	r.Post("/stock-movements", h.AddStockMovement)
}
