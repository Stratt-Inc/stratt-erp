package crm

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	// Contacts
	r.Get("/contacts", h.ListContacts)
	r.Post("/contacts", h.CreateContact)
	r.Get("/contacts/:id", h.GetContact)
	r.Put("/contacts/:id", h.UpdateContact)
	r.Delete("/contacts/:id", h.DeleteContact)

	// Leads
	r.Get("/leads", h.ListLeads)
	r.Post("/leads", h.CreateLead)
	r.Get("/leads/:id", h.GetLead)
	r.Put("/leads/:id", h.UpdateLead)

	// Deals / Pipeline
	r.Get("/deals", h.ListDeals)
	r.Post("/deals", h.CreateDeal)
	r.Get("/deals/:id", h.GetDeal)
	r.Put("/deals/:id", h.UpdateDeal)
}
