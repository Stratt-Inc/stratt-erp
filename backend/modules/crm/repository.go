package crm

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// --- Contacts ---

func (r *Repository) ListContacts(ctx context.Context, tenantID uuid.UUID, search string, page, limit int) ([]Contact, int64, error) {
	var contacts []Contact
	var total int64
	q := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID)
	if search != "" {
		q = q.Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ? OR company ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	q.Model(&Contact{}).Count(&total)
	err := q.Offset((page - 1) * limit).Limit(limit).Order("created_at DESC").Find(&contacts).Error
	return contacts, total, err
}

func (r *Repository) CreateContact(ctx context.Context, c *Contact) error {
	return r.db.WithContext(ctx).Create(c).Error
}

func (r *Repository) FindContact(ctx context.Context, id, tenantID uuid.UUID) (*Contact, error) {
	var c Contact
	err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, tenantID).First(&c).Error
	return &c, err
}

func (r *Repository) UpdateContact(ctx context.Context, c *Contact) error {
	return r.db.WithContext(ctx).Save(c).Error
}

func (r *Repository) DeleteContact(ctx context.Context, id, tenantID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&Contact{}).Error
}

// --- Leads ---

func (r *Repository) ListLeads(ctx context.Context, tenantID uuid.UUID, status string, page, limit int) ([]Lead, int64, error) {
	var leads []Lead
	var total int64
	q := r.db.WithContext(ctx).Preload("Contact").Where("tenant_id = ?", tenantID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Model(&Lead{}).Count(&total)
	err := q.Offset((page - 1) * limit).Limit(limit).Order("created_at DESC").Find(&leads).Error
	return leads, total, err
}

func (r *Repository) CreateLead(ctx context.Context, l *Lead) error {
	return r.db.WithContext(ctx).Create(l).Error
}

func (r *Repository) FindLead(ctx context.Context, id, tenantID uuid.UUID) (*Lead, error) {
	var l Lead
	err := r.db.WithContext(ctx).Preload("Contact").Where("id = ? AND tenant_id = ?", id, tenantID).First(&l).Error
	return &l, err
}

func (r *Repository) UpdateLead(ctx context.Context, l *Lead) error {
	return r.db.WithContext(ctx).Save(l).Error
}

func (r *Repository) DeleteLead(ctx context.Context, id, tenantID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&Lead{}).Error
}

// --- Deals ---

func (r *Repository) ListDeals(ctx context.Context, tenantID uuid.UUID, stage string, page, limit int) ([]Deal, int64, error) {
	var deals []Deal
	var total int64
	q := r.db.WithContext(ctx).Preload("Contact").Where("tenant_id = ?", tenantID)
	if stage != "" {
		q = q.Where("stage = ?", stage)
	}
	q.Model(&Deal{}).Count(&total)
	err := q.Offset((page - 1) * limit).Limit(limit).Order("created_at DESC").Find(&deals).Error
	return deals, total, err
}

func (r *Repository) CreateDeal(ctx context.Context, d *Deal) error {
	return r.db.WithContext(ctx).Create(d).Error
}

func (r *Repository) FindDeal(ctx context.Context, id, tenantID uuid.UUID) (*Deal, error) {
	var d Deal
	err := r.db.WithContext(ctx).Preload("Contact").Where("id = ? AND tenant_id = ?", id, tenantID).First(&d).Error
	return &d, err
}

func (r *Repository) UpdateDeal(ctx context.Context, d *Deal) error {
	return r.db.WithContext(ctx).Save(d).Error
}

func (r *Repository) DeleteDeal(ctx context.Context, id, tenantID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&Deal{}).Error
}
