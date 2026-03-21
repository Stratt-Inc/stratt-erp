package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stratt/backend/internal/config"
	"github.com/stratt/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailTaken         = errors.New("email already in use")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrNotVerified        = errors.New("email not verified")
)

type Service struct {
	repo *Repository
	cfg  *config.Config
}

func NewService(repo *Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
}

// --- Signup ---

type SignupInput struct {
	Name     string
	Email    string
	Password string
}

func (s *Service) Signup(ctx context.Context, in SignupInput) (*models.User, string, string, error) {
	// Check email uniqueness
	_, err := s.repo.FindUserByEmail(ctx, in.Email)
	if err == nil {
		return nil, "", "", ErrEmailTaken
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, "", "", err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", "", err
	}

	user := &models.User{
		Name:         in.Name,
		Email:        in.Email,
		PasswordHash: string(hash),
	}
	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, "", "", err
	}

	accessToken, refreshToken, err := s.issueTokenPair(ctx, user, "", "")
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

// --- Login ---

type LoginInput struct {
	Email     string
	Password  string
	UserAgent string
	IP        string
}

func (s *Service) Login(ctx context.Context, in LoginInput) (*models.User, string, string, error) {
	user, err := s.repo.FindUserByEmail(ctx, in.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", ErrInvalidCredentials
		}
		return nil, "", "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(in.Password)); err != nil {
		return nil, "", "", ErrInvalidCredentials
	}

	accessToken, refreshToken, err := s.issueTokenPair(ctx, user, in.UserAgent, in.IP)
	if err != nil {
		return nil, "", "", err
	}

	// Best-effort — don't fail login if this update fails
	_ = s.repo.UpdateLastLogin(ctx, user.ID)

	return user, accessToken, refreshToken, nil
}

// --- Refresh ---

func (s *Service) Refresh(ctx context.Context, rawRefreshToken string) (string, string, error) {
	session, err := s.repo.FindSessionByRefreshToken(ctx, rawRefreshToken)
	if err != nil {
		return "", "", ErrInvalidToken
	}

	// Rotate: delete old session, issue new pair
	if err := s.repo.DeleteSession(ctx, session.ID); err != nil {
		return "", "", err
	}

	access, refresh, err := s.issueTokenPair(ctx, &session.User, session.UserAgent, session.IPAddress)
	if err != nil {
		return "", "", err
	}

	return access, refresh, nil
}

// --- Logout ---

func (s *Service) Logout(ctx context.Context, sessionID uuid.UUID) error {
	return s.repo.DeleteSession(ctx, sessionID)
}

// --- Me ---

func (s *Service) Me(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	return s.repo.FindUserByID(ctx, userID)
}

// --- JWT helpers ---

type Claims struct {
	UserID    uuid.UUID  `json:"uid"`
	SessionID uuid.UUID  `json:"sid"`
	OrgID     *uuid.UUID `json:"oid,omitempty"`
	jwt.RegisteredClaims
}

func (s *Service) issueTokenPair(ctx context.Context, user *models.User, userAgent, ip string) (string, string, error) {
	rawRefresh := generateToken(48)
	expiry := time.Now().Add(time.Duration(s.cfg.JWTRefreshExpDays) * 24 * time.Hour)

	session := &models.Session{
		UserID:       user.ID,
		RefreshToken: rawRefresh,
		UserAgent:    userAgent,
		IPAddress:    ip,
		ExpiresAt:    expiry,
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return "", "", err
	}

	accessToken, err := s.SignAccessToken(user.ID, session.ID, nil)
	if err != nil {
		return "", "", err
	}

	return accessToken, rawRefresh, nil
}

func (s *Service) SignAccessToken(userID, sessionID uuid.UUID, orgID *uuid.UUID) (string, error) {
	claims := Claims{
		UserID:    userID,
		SessionID: sessionID,
		OrgID:     orgID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(s.cfg.JWTAccessExpMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "stratt",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *Service) ParseAccessToken(raw string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(raw, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, ErrInvalidToken
	}
	return claims, nil
}

func generateToken(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
