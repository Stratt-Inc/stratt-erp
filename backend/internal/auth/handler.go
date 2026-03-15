package auth

import (
	"errors"
	"time"

	"github.com/axiora/backend/internal/ctxutil"
	"github.com/axiora/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// POST /api/v1/auth/signup
func (h *Handler) Signup(c *fiber.Ctx) error {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}
	if body.Name == "" || body.Email == "" || body.Password == "" {
		return c.Status(400).JSON(models.Err("name, email and password are required"))
	}
	if len(body.Password) < 8 {
		return c.Status(400).JSON(models.Err("password must be at least 8 characters"))
	}

	user, access, refresh, err := h.svc.Signup(c.Context(), SignupInput{
		Name:     body.Name,
		Email:    body.Email,
		Password: body.Password,
	})
	if err != nil {
		if errors.Is(err, ErrEmailTaken) {
			return c.Status(409).JSON(models.Err(err.Error()))
		}
		return c.Status(500).JSON(models.Err("signup failed"))
	}

	setRefreshCookie(c, refresh, 30*24*time.Hour)
	return c.Status(201).JSON(models.OK(fiber.Map{
		"user":         user,
		"access_token": access,
	}))
}

// POST /api/v1/auth/login
func (h *Handler) Login(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(models.Err("invalid request body"))
	}

	user, access, refresh, err := h.svc.Login(c.Context(), LoginInput{
		Email:     body.Email,
		Password:  body.Password,
		UserAgent: c.Get("User-Agent"),
		IP:        c.IP(),
	})
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			return c.Status(401).JSON(models.Err(err.Error()))
		}
		return c.Status(500).JSON(models.Err("login failed"))
	}

	setRefreshCookie(c, refresh, 30*24*time.Hour)
	return c.JSON(models.OK(fiber.Map{
		"user":         user,
		"access_token": access,
	}))
}

// POST /api/v1/auth/logout
func (h *Handler) Logout(c *fiber.Ctx) error {
	sid, ok := ctxutil.GetSessionID(c)
	if !ok {
		return c.Status(401).JSON(models.Err("not authenticated"))
	}
	_ = h.svc.Logout(c.Context(), sid)
	clearRefreshCookie(c)
	return c.JSON(models.Msg("logged out successfully"))
}

// POST /api/v1/auth/refresh
func (h *Handler) Refresh(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		// Also accept in body for non-cookie clients
		var body struct {
			RefreshToken string `json:"refresh_token"`
		}
		_ = c.BodyParser(&body)
		refreshToken = body.RefreshToken
	}
	if refreshToken == "" {
		return c.Status(401).JSON(models.Err("refresh token required"))
	}

	access, refresh, err := h.svc.Refresh(c.Context(), refreshToken)
	if err != nil {
		clearRefreshCookie(c)
		return c.Status(401).JSON(models.Err("invalid or expired refresh token"))
	}

	setRefreshCookie(c, refresh, 30*24*time.Hour)
	return c.JSON(models.OK(fiber.Map{"access_token": access}))
}

// GET /api/v1/auth/me
func (h *Handler) Me(c *fiber.Ctx) error {
	uid, ok := ctxutil.GetUserID(c)
	if !ok {
		return c.Status(401).JSON(models.Err("not authenticated"))
	}

	user, err := h.svc.Me(c.Context(), uid)
	if err != nil {
		return c.Status(404).JSON(models.Err("user not found"))
	}
	return c.JSON(models.OK(user))
}

func setRefreshCookie(c *fiber.Ctx, token string, maxAge time.Duration) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    token,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Strict",
		MaxAge:   int(maxAge.Seconds()),
		Path:     "/api/v1/auth",
	})
}

func clearRefreshCookie(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HTTPOnly: true,
		MaxAge:   -1,
		Path:     "/api/v1/auth",
	})
}
