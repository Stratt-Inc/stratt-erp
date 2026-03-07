package billing

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Get("/invoices", h.ListInvoices)
	r.Post("/invoices", h.CreateInvoice)
	r.Get("/invoices/:id", h.GetInvoice)
	r.Patch("/invoices/:id/status", h.UpdateInvoiceStatus)
}
