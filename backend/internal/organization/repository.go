package organization

import (
	"context"

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

func (r *Repository) Create(ctx context.Context, org *models.Organization) error {
	return r.db.WithContext(ctx).Create(org).Error
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).
		Preload("Modules.Module").
		First(&org, "id = ?", id).Error
	return &org, err
}

func (r *Repository) FindBySlug(ctx context.Context, slug string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).First(&org, "slug = ?", slug).Error
	return &org, err
}

func (r *Repository) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Organization, error) {
	var orgs []models.Organization
	err := r.db.WithContext(ctx).
		Joins("JOIN organization_members om ON om.organization_id = organizations.id").
		Where("om.user_id = ? AND om.status = 'active'", userID).
		Find(&orgs).Error
	return orgs, err
}

func (r *Repository) Update(ctx context.Context, org *models.Organization) error {
	return r.db.WithContext(ctx).Save(org).Error
}

func (r *Repository) CreateMember(ctx context.Context, m *models.OrganizationMember) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *Repository) FindMember(ctx context.Context, orgID, userID uuid.UUID) (*models.OrganizationMember, error) {
	var m models.OrganizationMember
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Role").
		Where("organization_id = ? AND user_id = ? AND status = 'active'", orgID, userID).
		First(&m).Error
	return &m, err
}

func (r *Repository) ListMembers(ctx context.Context, orgID uuid.UUID) ([]models.OrganizationMember, error) {
	var members []models.OrganizationMember
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Role").
		Where("organization_id = ?", orgID).
		Find(&members).Error
	return members, err
}

func (r *Repository) RemoveMember(ctx context.Context, orgID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("organization_id = ? AND user_id = ?", orgID, userID).
		Delete(&models.OrganizationMember{}).Error
}

func (r *Repository) SlugExists(ctx context.Context, slug string) bool {
	var count int64
	r.db.WithContext(ctx).Model(&models.Organization{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}
