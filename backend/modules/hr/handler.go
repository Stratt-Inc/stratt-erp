package hr

import (
	"github.com/axiora/backend/internal/models"
	"github.com/axiora/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct{ db *gorm.DB }

func NewHandler(db *gorm.DB) *Handler { return &Handler{db: db} }

func (h *Handler) ListEmployees(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var employees []Employee
	if err := h.db.WithContext(c.Context()).Where("tenant_id = ?", orgID).Order("last_name ASC").Find(&employees).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch employees"))
	}
	return c.JSON(models.OK(employees))
}

func (h *Handler) CreateEmployee(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var emp Employee
	if err := c.BodyParser(&emp); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	emp.TenantID = orgID
	if err := h.db.WithContext(c.Context()).Create(&emp).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create employee"))
	}
	return c.Status(201).JSON(models.OK(emp))
}

func (h *Handler) GetEmployee(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(models.Err("invalid employee ID"))
	}
	var emp Employee
	if err := h.db.WithContext(c.Context()).Where("id = ? AND tenant_id = ?", id, orgID).First(&emp).Error; err != nil {
		return c.Status(404).JSON(models.Err("employee not found"))
	}
	return c.JSON(models.OK(emp))
}

func (h *Handler) ListLeaveRequests(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var requests []LeaveRequest
	q := h.db.WithContext(c.Context()).Preload("Employee").Where("tenant_id = ?", orgID)
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("created_at DESC").Find(&requests).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to fetch leave requests"))
	}
	return c.JSON(models.OK(requests))
}

func (h *Handler) CreateLeaveRequest(c *fiber.Ctx) error {
	orgID, _ := middleware.GetOrgID(c)
	var req LeaveRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	req.TenantID = orgID
	if err := h.db.WithContext(c.Context()).Create(&req).Error; err != nil {
		return c.Status(500).JSON(models.Err("failed to create leave request"))
	}
	return c.Status(201).JSON(models.OK(req))
}
