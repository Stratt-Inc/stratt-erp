package rbac

import (
	"context"

	"github.com/google/uuid"
	"github.com/stratt/backend/internal/models"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// --- Roles ---

func (r *Repository) CreateRole(ctx context.Context, role *models.Role) error {
	return r.db.WithContext(ctx).Create(role).Error
}

func (r *Repository) FindRoleByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	var role models.Role
	err := r.db.WithContext(ctx).Preload("Permissions").First(&role, "id = ?", id).Error
	return &role, err
}

func (r *Repository) ListRoles(ctx context.Context, orgID uuid.UUID) ([]models.Role, error) {
	var roles []models.Role
	err := r.db.WithContext(ctx).
		Preload("Permissions").
		Where("organization_id = ? OR is_system = true", orgID).
		Find(&roles).Error
	return roles, err
}

func (r *Repository) UpdateRole(ctx context.Context, role *models.Role) error {
	return r.db.WithContext(ctx).Save(role).Error
}

func (r *Repository) DeleteRole(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Role{}, "id = ?", id).Error
}

// --- Permissions ---

func (r *Repository) ListPermissions(ctx context.Context) ([]models.Permission, error) {
	var perms []models.Permission
	err := r.db.WithContext(ctx).Find(&perms).Error
	return perms, err
}

func (r *Repository) FindPermissionByName(ctx context.Context, name string) (*models.Permission, error) {
	var perm models.Permission
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&perm).Error
	return &perm, err
}

// --- Role Permissions ---

func (r *Repository) AssignPermissionToRole(ctx context.Context, roleID uuid.UUID, permName string) error {
	perm, err := r.FindPermissionByName(ctx, permName)
	if err != nil {
		return err
	}
	role, err := r.FindRoleByID(ctx, roleID)
	if err != nil {
		return err
	}
	return r.db.WithContext(ctx).Model(role).Association("Permissions").Append(perm)
}

func (r *Repository) RemovePermissionFromRole(ctx context.Context, roleID uuid.UUID, permName string) error {
	perm, err := r.FindPermissionByName(ctx, permName)
	if err != nil {
		return err
	}
	role, err := r.FindRoleByID(ctx, roleID)
	if err != nil {
		return err
	}
	return r.db.WithContext(ctx).Model(role).Association("Permissions").Delete(perm)
}

// --- User Roles ---

func (r *Repository) AssignRoleToUser(ctx context.Context, userID, orgID, roleID uuid.UUID) error {
	ur := models.UserRole{UserID: userID, OrganizationID: orgID, RoleID: roleID}
	return r.db.WithContext(ctx).
		Where(ur).
		FirstOrCreate(&ur).Error
}

func (r *Repository) RemoveRoleFromUser(ctx context.Context, userID, orgID, roleID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("user_id = ? AND organization_id = ? AND role_id = ?", userID, orgID, roleID).
		Delete(&models.UserRole{}).Error
}

// --- Permission check ---

func (r *Repository) HasPermission(ctx context.Context, userID, orgID uuid.UUID, permission string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Raw(`
			SELECT COUNT(*)
			FROM role_permissions rp
			JOIN permissions p ON p.id = rp.permission_id
			JOIN user_roles ur ON ur.role_id = rp.role_id
			WHERE ur.user_id = ?
			  AND ur.organization_id = ?
			  AND p.name = ?
		`, userID, orgID, permission).
		Scan(&count).Error
	return count > 0, err
}
