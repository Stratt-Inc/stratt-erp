package hr

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router, h *Handler) {
	r.Get("/employees", h.ListEmployees)
	r.Post("/employees", h.CreateEmployee)
	r.Get("/employees/:id", h.GetEmployee)
	r.Get("/leave-requests", h.ListLeaveRequests)
	r.Post("/leave-requests", h.CreateLeaveRequest)
}
