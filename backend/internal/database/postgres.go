package database

import (
	"log"

	"github.com/axiora/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(dsn string, isProduction bool) (*gorm.DB, error) {
	logLevel := logger.Info
	if isProduction {
		logLevel = logger.Error
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, err
	}

	DB = db
	log.Println("✓ PostgreSQL connected")
	return db, nil
}

// AutoMigrate runs GORM auto-migration for all models.
// In production, prefer SQL migration files instead.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		// Core
		&models.User{},
		&models.Session{},
		&models.Invite{},
		// Organizations
		&models.Organization{},
		&models.OrganizationMember{},
		// RBAC
		&models.Role{},
		&models.Permission{},
		&models.UserRole{},
		// Modules
		&models.Module{},
		&models.OrganizationModule{},
		// Audit
		&models.AuditLog{},
		// TODO: Add ERP module models when implemented
		// (CRM, Accounting, Billing, Inventory, HR, Procurement)
	)
}
