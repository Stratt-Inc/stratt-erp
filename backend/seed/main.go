// Package seed populates the database with initial data.
// Usage: go run ./seed/main.go
package main

import (
	"fmt"
	"log"

	"github.com/axiora/backend/internal/config"
	"github.com/axiora/backend/internal/database"
	"github.com/axiora/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	db, err := database.Connect(cfg.DatabaseURL, false)
	if err != nil {
		log.Fatalf("database error: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("migration error: %v", err)
	}

	// ── Permissions ───────────────────────────────────────
	permissions := []models.Permission{
		// CRM
		{Name: "crm.read", Description: "View CRM data", Module: "crm", Action: "read"},
		{Name: "crm.write", Description: "Create/edit CRM data", Module: "crm", Action: "write"},
		{Name: "crm.delete", Description: "Delete CRM data", Module: "crm", Action: "delete"},
		// Accounting
		{Name: "accounting.read", Description: "View accounting data", Module: "accounting", Action: "read"},
		{Name: "accounting.write", Description: "Create/edit accounting data", Module: "accounting", Action: "write"},
		// Billing
		{Name: "billing.read", Description: "View invoices", Module: "billing", Action: "read"},
		{Name: "billing.write", Description: "Create/edit invoices", Module: "billing", Action: "write"},
		// Inventory
		{Name: "inventory.read", Description: "View inventory", Module: "inventory", Action: "read"},
		{Name: "inventory.write", Description: "Manage inventory", Module: "inventory", Action: "write"},
		// HR
		{Name: "hr.read", Description: "View HR data", Module: "hr", Action: "read"},
		{Name: "hr.write", Description: "Manage HR data", Module: "hr", Action: "write"},
		// Procurement
		{Name: "procurement.read", Description: "View purchase orders", Module: "procurement", Action: "read"},
		{Name: "procurement.write", Description: "Manage purchase orders", Module: "procurement", Action: "write"},
		// Analytics
		{Name: "analytics.read", Description: "View analytics", Module: "analytics", Action: "read"},
		// Admin
		{Name: "admin.manage", Description: "Full organization administration", Module: "admin", Action: "manage"},
	}

	for _, p := range permissions {
		db.Where("name = ?", p.Name).FirstOrCreate(&p)
	}
	fmt.Printf("✓ %d permissions seeded\n", len(permissions))

	// ── ERP Modules ───────────────────────────────────────
	modules := []models.Module{
		{ID: "crm", Name: "CRM", Description: "Customer Relationship Management", Icon: "users", Color: "#5B6BF5"},
		{ID: "accounting", Name: "Comptabilité", Description: "Gestion comptable et financière", Icon: "calculator", Color: "#10B981"},
		{ID: "billing", Name: "Facturation", Description: "Devis, factures et paiements", Icon: "file-text", Color: "#F59E0B"},
		{ID: "inventory", Name: "Inventaire", Description: "Gestion des stocks et produits", Icon: "package", Color: "#6366F1"},
		{ID: "hr", Name: "RH", Description: "Ressources humaines et paie", Icon: "briefcase", Color: "#EC4899"},
		{ID: "procurement", Name: "Achats", Description: "Commandes fournisseurs", Icon: "shopping-cart", Color: "#8B5CF6"},
		{ID: "analytics", Name: "Analytics", Description: "Tableaux de bord et rapports", Icon: "bar-chart-2", Color: "#06B6D4"},
	}

	for _, m := range modules {
		db.Where("id = ?", m.ID).FirstOrCreate(&m)
	}
	fmt.Printf("✓ %d modules seeded\n", len(modules))

	// ── Admin user ────────────────────────────────────────
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin1234"), bcrypt.DefaultCost)
	admin := models.User{
		Name:          "Admin Axiora",
		Email:         "admin@axiora.io",
		PasswordHash:  string(hash),
		EmailVerified: true,
	}
	result := db.Where("email = ?", admin.Email).FirstOrCreate(&admin)
	if result.RowsAffected > 0 {
		fmt.Printf("✓ Admin user created: %s / admin1234\n", admin.Email)
	} else {
		fmt.Printf("✓ Admin user already exists: %s\n", admin.Email)
	}

	// ── Demo organization ─────────────────────────────────
	org := models.Organization{
		Name: "Axiora Demo",
		Slug: "axiora-demo",
		Plan: "pro",
	}
	db.Where("slug = ?", org.Slug).FirstOrCreate(&org)

	// Add admin as member
	member := models.OrganizationMember{
		OrganizationID: org.ID,
		UserID:         admin.ID,
		Status:         "active",
	}
	db.Where("organization_id = ? AND user_id = ?", org.ID, admin.ID).FirstOrCreate(&member)

	// Create admin role for the org
	adminRole := models.Role{
		OrganizationID: &org.ID,
		Name:           "Admin",
		Description:    "Full organization access",
		IsSystem:       true,
	}
	db.Where("organization_id = ? AND name = ?", org.ID, adminRole.Name).FirstOrCreate(&adminRole)

	// Assign all permissions to admin role
	var allPerms []models.Permission
	db.Find(&allPerms)
	db.Model(&adminRole).Association("Permissions").Replace(allPerms)

	// Assign admin role to admin user
	userRole := models.UserRole{
		UserID:         admin.ID,
		OrganizationID: org.ID,
		RoleID:         adminRole.ID,
	}
	db.Where(userRole).FirstOrCreate(&userRole)

	// Enable all modules for demo org
	for _, m := range modules {
		om := models.OrganizationModule{
			OrganizationID: org.ID,
			ModuleID:       m.ID,
		}
		db.Where("organization_id = ? AND module_id = ?", org.ID, m.ID).FirstOrCreate(&om)
	}

	fmt.Printf("✓ Demo org: %s (all modules enabled)\n", org.Name)
	fmt.Println("\n🚀 Seed completed successfully!")
}
