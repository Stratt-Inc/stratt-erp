package accounting

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Get("/accounts", h.ListAccounts)
	r.Post("/accounts", h.CreateAccount)
	r.Get("/transactions", h.ListTransactions)
	r.Post("/transactions", h.CreateTransaction)
}
