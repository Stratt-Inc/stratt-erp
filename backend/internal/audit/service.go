package audit

import (
	"context"
	"encoding/json"

	"github.com/axiora/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

type LogInput struct {
	OrganizationID *uuid.UUID
	UserID         *uuid.UUID
	Action         string
	ResourceType   string
	ResourceID     string
	Metadata       any
	IPAddress      string
	UserAgent      string
}

func (s *Service) Log(ctx context.Context, in LogInput) {
	var metaJSON []byte
	if in.Metadata != nil {
		metaJSON, _ = json.Marshal(in.Metadata)
	}

	entry := &models.AuditLog{
		OrganizationID: in.OrganizationID,
		UserID:         in.UserID,
		Action:         in.Action,
		ResourceType:   in.ResourceType,
		ResourceID:     in.ResourceID,
		Metadata:       metaJSON,
		IPAddress:      in.IPAddress,
		UserAgent:      in.UserAgent,
	}

	// Fire and forget — don't block the request
	go s.db.WithContext(ctx).Create(entry)
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID, page, limit int) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64
	q := s.db.WithContext(ctx).Where("organization_id = ?", orgID)
	q.Model(&models.AuditLog{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * limit).Limit(limit).Find(&logs).Error
	return logs, total, err
}
