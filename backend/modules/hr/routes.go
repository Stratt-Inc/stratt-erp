package hr

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, h *Handler) {
	r.GET("/employees", h.ListEmployees)
	r.POST("/employees", h.CreateEmployee)
	r.GET("/employees/:id", h.GetEmployee)
	r.GET("/leave-requests", h.ListLeaveRequests)
	r.POST("/leave-requests", h.CreateLeaveRequest)
}
