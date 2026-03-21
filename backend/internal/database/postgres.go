package database

import (
	"log"

	"github.com/stratt/backend/internal/models"
	accountingmod "github.com/stratt/backend/modules/accounting"
	billingmod "github.com/stratt/backend/modules/billing"
	crmmod "github.com/stratt/backend/modules/crm"
	hrmod "github.com/stratt/backend/modules/hr"
	inventorymod "github.com/stratt/backend/modules/inventory"
	decpmod "github.com/stratt/backend/modules/decp"
	boampmod "github.com/stratt/backend/modules/boamp"
	marchesmod "github.com/stratt/backend/modules/marches"
	nomenclaturemod "github.com/stratt/backend/modules/nomenclature"
	procurementmod "github.com/stratt/backend/modules/procurement"
	chatbotmod "github.com/stratt/backend/modules/chatbot"
	sirenemod "github.com/stratt/backend/modules/sirene"
	webhooksmod "github.com/stratt/backend/modules/webhooks"
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
		// CRM
		&crmmod.Contact{},
		&crmmod.Lead{},
		&crmmod.Deal{},
		&crmmod.Activity{},
		// Accounting
		&accountingmod.Account{},
		&accountingmod.Transaction{},
		// Billing
		&billingmod.Invoice{},
		&billingmod.InvoiceItem{},
		// Inventory
		&inventorymod.Product{},
		&inventorymod.StockMovement{},
		// HR
		&hrmod.Employee{},
		&hrmod.LeaveRequest{},
		// Procurement
		&procurementmod.PurchaseOrder{},
		&procurementmod.PurchaseOrderItem{},
		// Marchés publics
		&marchesmod.Marche{},
		// DECP
		&decpmod.DECPPublication{},
		// BOAMP
		&boampmod.BOAMPVeille{},
		// Nomenclature
		&nomenclaturemod.NomenclatureTag{},
		&nomenclaturemod.NomenclatureNode{},
		// SIRENE
		&sirenemod.SIRENEEnrichment{},
		// Chatbot
		&chatbotmod.ChatToken{},
		&chatbotmod.ChatMessage{},
		&chatbotmod.ChatFeedback{},
		// Webhooks
		&webhooksmod.Webhook{},
		&webhooksmod.WebhookDelivery{},
	)
}
