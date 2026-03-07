package auth

import (
	"context"
	"time"

	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *Repository) FindUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) FindUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) UpdateUser(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *Repository) CreateSession(ctx context.Context, session *models.Session) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *Repository) FindSessionByRefreshToken(ctx context.Context, token string) (*models.Session, error) {
	var session models.Session
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("refresh_token = ? AND expires_at > ?", token, time.Now()).
		First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *Repository) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Session{}, "id = ?", id).Error
}

func (r *Repository) DeleteUserSessions(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Session{}, "user_id = ?", userID).Error
}

func (r *Repository) CreateInvite(ctx context.Context, invite *models.Invite) error {
	return r.db.WithContext(ctx).Create(invite).Error
}

func (r *Repository) FindInviteByToken(ctx context.Context, token string) (*models.Invite, error) {
	var invite models.Invite
	err := r.db.WithContext(ctx).
		Preload("Organization").
		Where("token = ? AND expires_at > ? AND accepted_at IS NULL", token, time.Now()).
		First(&invite).Error
	if err != nil {
		return nil, err
	}
	return &invite, nil
}
