package crm

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	// Contacts
	r.GET("/contacts", h.ListContacts)
	r.POST("/contacts", h.CreateContact)
	r.GET("/contacts/:id", h.GetContact)
	r.PUT("/contacts/:id", h.UpdateContact)
	r.DELETE("/contacts/:id", h.DeleteContact)

	// Leads
	r.GET("/leads", h.ListLeads)
	r.POST("/leads", h.CreateLead)
	r.GET("/leads/:id", h.GetLead)
	r.PUT("/leads/:id", h.UpdateLead)

	// Deals / Pipeline
	r.GET("/deals", h.ListDeals)
	r.POST("/deals", h.CreateDeal)
	r.GET("/deals/:id", h.GetDeal)
	r.PUT("/deals/:id", h.UpdateDeal)
}
