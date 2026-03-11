package rbac

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
)

var ErrSystemRole = errors.New("cannot modify a system role")

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) HasPermission(ctx context.Context, userID, orgID uuid.UUID, permission string) (bool, error) {
	return s.repo.HasPermission(ctx, userID, orgID, permission)
}

func (s *Service) ListRoles(ctx context.Context, orgID uuid.UUID) ([]models.Role, error) {
	return s.repo.ListRoles(ctx, orgID)
}

func (s *Service) CreateRole(ctx context.Context, orgID uuid.UUID, name, description string) (*models.Role, error) {
	role := &models.Role{
		OrganizationID: &orgID,
		Name:           name,
		Description:    description,
	}
	if err := s.repo.CreateRole(ctx, role); err != nil {
		return nil, err
	}
	return role, nil
}

func (s *Service) UpdateRole(ctx context.Context, id uuid.UUID, name, description string) (*models.Role, error) {
	role, err := s.repo.FindRoleByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if role.IsSystem {
		return nil, ErrSystemRole
	}
	role.Name = name
	role.Description = description
	if err := s.repo.UpdateRole(ctx, role); err != nil {
		return nil, err
	}
	return role, nil
}

func (s *Service) DeleteRole(ctx context.Context, id uuid.UUID) error {
	role, err := s.repo.FindRoleByID(ctx, id)
	if err != nil {
		return err
	}
	if role.IsSystem {
		return ErrSystemRole
	}
	return s.repo.DeleteRole(ctx, id)
}

func (s *Service) ListPermissions(ctx context.Context) ([]models.Permission, error) {
	return s.repo.ListPermissions(ctx)
}

func (s *Service) AssignPermissionToRole(ctx context.Context, roleID uuid.UUID, permName string) error {
	return s.repo.AssignPermissionToRole(ctx, roleID, permName)
}

func (s *Service) AssignRoleToUser(ctx context.Context, userID, orgID, roleID uuid.UUID) error {
	return s.repo.AssignRoleToUser(ctx, userID, orgID, roleID)
}
