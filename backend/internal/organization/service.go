package organization

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
)

var (
	ErrNotFound    = errors.New("organization not found")
	ErrSlugTaken   = errors.New("organization slug already in use")
	ErrNotMember   = errors.New("user is not a member of this organization")
	ErrOwnerRemove = errors.New("cannot remove the organization owner")

	slugRegexp = regexp.MustCompile(`[^a-z0-9-]`)
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type CreateInput struct {
	Name   string
	Slug   string
	OwnerID uuid.UUID
}

func (s *Service) Create(ctx context.Context, in CreateInput) (*models.Organization, error) {
	slug := normalizeSlug(in.Slug)
	if slug == "" {
		slug = normalizeSlug(in.Name)
	}

	// Ensure slug is unique
	base := slug
	for i := 1; s.repo.SlugExists(ctx, slug); i++ {
		slug = base + "-" + string(rune('0'+i))
	}

	org := &models.Organization{
		Name: in.Name,
		Slug: slug,
	}
	if err := s.repo.Create(ctx, org); err != nil {
		return nil, err
	}

	// Add creator as owner
	member := &models.OrganizationMember{
		OrganizationID: org.ID,
		UserID:         in.OwnerID,
		Status:         "active",
	}
	if err := s.repo.CreateMember(ctx, member); err != nil {
		return nil, err
	}

	return org, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*models.Organization, error) {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return org, nil
}

func (s *Service) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Organization, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *Service) GetMember(ctx context.Context, orgID, userID uuid.UUID) (*models.OrganizationMember, error) {
	m, err := s.repo.FindMember(ctx, orgID, userID)
	if err != nil {
		return nil, ErrNotMember
	}
	return m, nil
}

func (s *Service) ListMembers(ctx context.Context, orgID uuid.UUID) ([]models.OrganizationMember, error) {
	return s.repo.ListMembers(ctx, orgID)
}

func (s *Service) RemoveMember(ctx context.Context, orgID, targetUserID, requestingUserID uuid.UUID) error {
	return s.repo.RemoveMember(ctx, orgID, targetUserID)
}

func normalizeSlug(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	s = slugRegexp.ReplaceAllString(s, "")
	return strings.Trim(s, "-")
}
