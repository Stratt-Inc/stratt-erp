package procurement

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Get("/purchase-orders", h.ListOrders)
	r.Post("/purchase-orders", h.CreateOrder)
	r.Get("/purchase-orders/:id", h.GetOrder)
}
