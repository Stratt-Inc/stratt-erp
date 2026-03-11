package hr

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"github.com/stratt/backend/middleware"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListEmployees(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var employees []Employee
	if err := h.db.WithContext(c.Request.Context()).Where("tenant_id = ?", orgID).Order("last_name ASC").Find(&employees).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch employees"))
		return
	}
	c.JSON(200, models.OK(employees))
}

func (h *Handler) CreateEmployee(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var emp Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	emp.TenantID = orgID
	if err := h.db.WithContext(c.Request.Context()).Create(&emp).Error; err != nil {
		c.JSON(500, models.Err("failed to create employee"))
		return
	}
	c.JSON(201, models.OK(emp))
}

func (h *Handler) GetEmployee(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, models.Err("invalid employee ID"))
		return
	}
	var emp Employee
	if err := h.db.WithContext(c.Request.Context()).Where("id = ? AND tenant_id = ?", id, orgID).First(&emp).Error; err != nil {
		c.JSON(404, models.Err("employee not found"))
		return
	}
	c.JSON(200, models.OK(emp))
}

func (h *Handler) ListLeaveRequests(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var requests []LeaveRequest
	q := h.db.WithContext(c.Request.Context()).Preload("Employee").Where("tenant_id = ?", orgID)
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("created_at DESC").Find(&requests).Error; err != nil {
		c.JSON(500, models.Err("failed to fetch leave requests"))
		return
	}
	c.JSON(200, models.OK(requests))
}

func (h *Handler) CreateLeaveRequest(c *gin.Context) {
	orgID, _ := middleware.GetOrgID(c)
	var req LeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	req.TenantID = orgID
	if err := h.db.WithContext(c.Request.Context()).Create(&req).Error; err != nil {
		c.JSON(500, models.Err("failed to create leave request"))
		return
	}
	c.JSON(201, models.OK(req))
}
