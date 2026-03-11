package auth

import (
	"errors"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// POST /api/v1/auth/signup
func (h *Handler) Signup(c *gin.Context) {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}
	if body.Name == "" || body.Email == "" || body.Password == "" {
		c.JSON(400, models.Err("name, email and password are required"))
		return
	}
	if len(body.Password) < 8 {
		c.JSON(400, models.Err("password must be at least 8 characters"))
		return
	}

	user, access, refresh, err := h.svc.Signup(c.Request.Context(), SignupInput{
		Name:     body.Name,
		Email:    body.Email,
		Password: body.Password,
	})
	if err != nil {
		if errors.Is(err, ErrEmailTaken) {
			c.JSON(409, models.Err(err.Error()))
			return
		}
		c.JSON(500, models.Err("signup failed"))
		return
	}

	setRefreshCookie(c, refresh, 30*24*time.Hour)
	c.JSON(201, models.OK(gin.H{
		"user":         user,
		"access_token": access,
	}))
}

// POST /api/v1/auth/login
func (h *Handler) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, models.Err("invalid request body"))
		return
	}

	user, access, refresh, err := h.svc.Login(c.Request.Context(), LoginInput{
		Email:     body.Email,
		Password:  body.Password,
		UserAgent: c.GetHeader("User-Agent"),
		IP:        c.ClientIP(),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			c.JSON(401, models.Err(err.Error()))
			return
		}
		c.JSON(500, models.Err("login failed"))
		return
	}

	setRefreshCookie(c, refresh, 30*24*time.Hour)
	c.JSON(200, models.OK(gin.H{
		"user":         user,
		"access_token": access,
	}))
}

// POST /api/v1/auth/logout
func (h *Handler) Logout(c *gin.Context) {
	val, exists := c.Get("session_id")
	if !exists {
		c.JSON(401, models.Err("not authenticated"))
		return
	}

	if uid, ok := val.(uuid.UUID); ok {
		_ = h.svc.Logout(c.Request.Context(), uid)
	}
	clearRefreshCookie(c)
	c.JSON(200, models.Msg("logged out successfully"))
}

// POST /api/v1/auth/refresh
func (h *Handler) Refresh(c *gin.Context) {
	refreshToken, _ := c.Cookie("refresh_token")
	if refreshToken == "" {
		// Also accept in body for non-cookie clients
		var body struct {
			RefreshToken string `json:"refresh_token"`
		}
		_ = c.ShouldBindJSON(&body)
		refreshToken = body.RefreshToken
	}
	if refreshToken == "" {
		c.JSON(401, models.Err("refresh token required"))
		return
	}

	access, refresh, err := h.svc.Refresh(c.Request.Context(), refreshToken)
	if err != nil {
		clearRefreshCookie(c)
		c.JSON(401, models.Err("invalid or expired refresh token"))
		return
	}

	setRefreshCookie(c, refresh, 30*24*time.Hour)
	c.JSON(200, models.OK(gin.H{"access_token": access}))
}

// GET /api/v1/auth/me
func (h *Handler) Me(c *gin.Context) {
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, models.Err("not authenticated"))
		return
	}

	uid, ok := val.(uuid.UUID)
	if !ok {
		c.JSON(401, models.Err("invalid session"))
		return
	}
	user, err := h.svc.Me(c.Request.Context(), uid)
	if err != nil {
		c.JSON(404, models.Err("user not found"))
		return
	}
	c.JSON(200, models.OK(user))
}

func setRefreshCookie(c *gin.Context, token string, maxAge time.Duration) {
	c.SetCookie("refresh_token", token, int(maxAge.Seconds()), "/api/v1/auth", "", true, true)
}

func clearRefreshCookie(c *gin.Context) {
	c.SetCookie("refresh_token", "", -1, "/api/v1/auth", "", true, true)
}
