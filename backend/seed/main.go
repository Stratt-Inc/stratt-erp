// Package seed populates the database with initial data.
// Usage: go run ./seed/main.go
package main

import (
	"fmt"
	"log"

	accountingmod "github.com/stratt/backend/modules/accounting"
	billingmod "github.com/stratt/backend/modules/billing"
	crmmod "github.com/stratt/backend/modules/crm"
	hrmod "github.com/stratt/backend/modules/hr"
	inventorymod "github.com/stratt/backend/modules/inventory"
	marchesmod "github.com/stratt/backend/modules/marches"
	nomenclaturemod "github.com/stratt/backend/modules/nomenclature"
	procurementmod "github.com/stratt/backend/modules/procurement"

	"github.com/google/uuid"
	"github.com/stratt/backend/internal/config"
	"github.com/stratt/backend/internal/database"
	"github.com/stratt/backend/internal/models"
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
		{Name: "crm.read", Description: "View CRM data", Module: "crm", Action: "read"},
		{Name: "crm.write", Description: "Create/edit CRM data", Module: "crm", Action: "write"},
		{Name: "crm.delete", Description: "Delete CRM data", Module: "crm", Action: "delete"},
		{Name: "accounting.read", Description: "View accounting data", Module: "accounting", Action: "read"},
		{Name: "accounting.write", Description: "Create/edit accounting data", Module: "accounting", Action: "write"},
		{Name: "billing.read", Description: "View invoices", Module: "billing", Action: "read"},
		{Name: "billing.write", Description: "Create/edit invoices", Module: "billing", Action: "write"},
		{Name: "inventory.read", Description: "View inventory", Module: "inventory", Action: "read"},
		{Name: "inventory.write", Description: "Manage inventory", Module: "inventory", Action: "write"},
		{Name: "hr.read", Description: "View HR data", Module: "hr", Action: "read"},
		{Name: "hr.write", Description: "Manage HR data", Module: "hr", Action: "write"},
		{Name: "procurement.read", Description: "View purchase orders", Module: "procurement", Action: "read"},
		{Name: "procurement.write", Description: "Manage purchase orders", Module: "procurement", Action: "write"},
		{Name: "analytics.read", Description: "View analytics", Module: "analytics", Action: "read"},
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
		Name:          "Admin STRATT",
		Email:         "admin@stratt.io",
		PasswordHash:  string(hash),
		EmailVerified: true,
	}
	db.Where("email = ?", admin.Email).FirstOrCreate(&admin)
	db.Model(&admin).Updates(models.User{PasswordHash: string(hash), EmailVerified: true})
	fmt.Printf("✓ Admin user: %s / admin1234\n", admin.Email)

	// ── Demo organization ─────────────────────────────────
	org := models.Organization{Name: "STRATT Demo", Slug: "stratt-demo", Plan: "pro"}
	db.Where("slug = ?", org.Slug).FirstOrCreate(&org)

	// ── Roles ─────────────────────────────────────────────
	// Admin — accès complet
	adminRole := models.Role{OrganizationID: &org.ID, Name: "Admin", Description: "Accès complet à l'organisation", IsSystem: true}
	db.Where("organization_id = ? AND name = ?", org.ID, adminRole.Name).FirstOrCreate(&adminRole)
	var allPerms []models.Permission
	db.Find(&allPerms)
	db.Model(&adminRole).Association("Permissions").Replace(allPerms)

	// Responsable Commercial — CRM
	commercialRole := models.Role{OrganizationID: &org.ID, Name: "Commercial", Description: "Accès CRM et facturation", IsSystem: false}
	db.Where("organization_id = ? AND name = ?", org.ID, commercialRole.Name).FirstOrCreate(&commercialRole)
	var commercialPerms []models.Permission
	db.Where("name IN ?", []string{"crm.read", "crm.write", "billing.read"}).Find(&commercialPerms)
	db.Model(&commercialRole).Association("Permissions").Replace(commercialPerms)

	// Comptable — comptabilité + facturation
	comptableRole := models.Role{OrganizationID: &org.ID, Name: "Comptable", Description: "Accès comptabilité et facturation", IsSystem: false}
	db.Where("organization_id = ? AND name = ?", org.ID, comptableRole.Name).FirstOrCreate(&comptableRole)
	var comptablePerms []models.Permission
	db.Where("name IN ?", []string{"accounting.read", "accounting.write", "billing.read", "billing.write"}).Find(&comptablePerms)
	db.Model(&comptableRole).Association("Permissions").Replace(comptablePerms)

	// Logisticien — inventaire + achats
	logistiqueRole := models.Role{OrganizationID: &org.ID, Name: "Logisticien", Description: "Accès inventaire et achats", IsSystem: false}
	db.Where("organization_id = ? AND name = ?", org.ID, logistiqueRole.Name).FirstOrCreate(&logistiqueRole)
	var logistiquePerms []models.Permission
	db.Where("name IN ?", []string{"inventory.read", "inventory.write", "procurement.read", "procurement.write"}).Find(&logistiquePerms)
	db.Model(&logistiqueRole).Association("Permissions").Replace(logistiquePerms)

	// ── Admin member ──────────────────────────────────────
	member := models.OrganizationMember{OrganizationID: org.ID, UserID: admin.ID, Status: "active"}
	db.Where("organization_id = ? AND user_id = ?", org.ID, admin.ID).FirstOrCreate(&member)
	db.Model(&member).Update("role_id", adminRole.ID)
	db.Where(models.UserRole{UserID: admin.ID, OrganizationID: org.ID, RoleID: adminRole.ID}).FirstOrCreate(&models.UserRole{})

	// ── Demo users (un par rôle métier) ──────────────────
	demoUsers := []struct {
		name, email string
		role        *models.Role
	}{
		{"Sophie Martin", "commercial@stratt.io", &commercialRole},
		{"Julie Henry", "comptable@stratt.io", &comptableRole},
		{"Marc Leroy", "logistique@stratt.io", &logistiqueRole},
	}
	demoHash, _ := bcrypt.GenerateFromPassword([]byte("demo1234"), bcrypt.DefaultCost)
	for _, u := range demoUsers {
		demoUser := models.User{Name: u.name, Email: u.email, PasswordHash: string(demoHash), EmailVerified: true}
		db.Where("email = ?", demoUser.Email).FirstOrCreate(&demoUser)
		db.Model(&demoUser).Updates(models.User{PasswordHash: string(demoHash)})
		orgM := models.OrganizationMember{OrganizationID: org.ID, UserID: demoUser.ID, Status: "active"}
		db.Where("organization_id = ? AND user_id = ?", org.ID, demoUser.ID).FirstOrCreate(&orgM)
		db.Model(&orgM).Update("role_id", u.role.ID)
		db.Where(models.UserRole{UserID: demoUser.ID, OrganizationID: org.ID, RoleID: u.role.ID}).FirstOrCreate(&models.UserRole{})
		fmt.Printf("✓ Demo %s: %s / demo1234\n", u.role.Name, u.email)
	}

	for _, m := range modules {
		om := models.OrganizationModule{OrganizationID: org.ID, ModuleID: m.ID}
		db.Where("organization_id = ? AND module_id = ?", org.ID, m.ID).FirstOrCreate(&om)
	}
	fmt.Printf("✓ Demo org: %s (all modules enabled)\n", org.Name)

	// ── Marchés publics ───────────────────────────────────
	// 25 marchés couvrant toutes les familles nomenclature (~5.6M€ total)
	var marcheCount int64
	db.Model(&marchesmod.Marche{}).Where("tenant_id = ?", org.ID).Count(&marcheCount)
	if marcheCount == 0 {
		marches := []marchesmod.Marche{
			// ── Fournitures ──────────────────────────────────────────────────────────
			{TenantID: org.ID, Reference: "M2026-F10", Objet: "Denrées alimentaires — restaurants scolaires", Service: "DS", Montant: 85000, Procedure: "MAPA", Echeance: "2026-09-01", Statut: "en_cours", Priorite: "haute", Charge: 8, Categorie: "Fournitures", FamilleCode: "10", Notes: "Accord-cadre annuel — 4 lots (fruits/légumes, produits laitiers, viandes, épicerie)"},
			{TenantID: org.ID, Reference: "M2026-F11", Objet: "Fournitures administratives et de bureau", Service: "DRH", Montant: 28000, Procedure: "MAPA", Echeance: "2026-04-15", Statut: "planifie", Priorite: "normale", Charge: 4, Categorie: "Fournitures", FamilleCode: "11", Notes: "Renouvellement annuel — papier, cartouches, consommables"},
			{TenantID: org.ID, Reference: "M2026-F12", Objet: "Fournitures scolaires — rentrée 2026", Service: "DE", Montant: 45000, Procedure: "MAPA", Echeance: "2026-06-30", Statut: "planifie", Priorite: "normale", Charge: 6, Categorie: "Fournitures", FamilleCode: "12", Notes: "Livraison avant rentrée scolaire — 8 établissements"},
			{TenantID: org.ID, Reference: "M2026-F13", Objet: "Produits d'entretien et d'hygiène", Service: "DPAT", Montant: 62000, Procedure: "MAPA", Echeance: "2026-05-01", Statut: "en_cours", Priorite: "normale", Charge: 5, Categorie: "Fournitures", FamilleCode: "13", Notes: "Accord-cadre 2 ans — produits ménagers et EPI hygiène"},
			{TenantID: org.ID, Reference: "M2026-F14", Objet: "Équipements de protection individuelle", Service: "DPAT", Montant: 38000, Procedure: "MAPA", Echeance: "2026-06-15", Statut: "planifie", Priorite: "normale", Charge: 4, Categorie: "Fournitures", FamilleCode: "14", Notes: "EPI agents terrain — chaussures sécurité, gants, casques"},
			{TenantID: org.ID, Reference: "M2026-F15", Objet: "Fournitures techniques et de maintenance", Service: "DPAT", Montant: 95000, Procedure: "MAPA", Echeance: "2026-04-30", Statut: "en_cours", Priorite: "normale", Charge: 8, Categorie: "Fournitures", FamilleCode: "15", Notes: "Pièces détachées, outillage, quincaillerie — stock permanent"},
			{TenantID: org.ID, Reference: "M2026-F16", Objet: "Matériel informatique — renouvellement parc", Service: "DSI", Montant: 285000, Procedure: "AO ouvert", Echeance: "2026-06-30", Statut: "en_cours", Priorite: "haute", Charge: 22, Categorie: "Fournitures", FamilleCode: "16", Notes: "Plan triennal — 80 postes, serveurs, équipements réseau"},
			{TenantID: org.ID, Reference: "M2026-F17", Objet: "Mobilier et équipements de bureaux", Service: "DPAT", Montant: 120000, Procedure: "AO restreint", Echeance: "2026-05-15", Statut: "planifie", Priorite: "normale", Charge: 10, Categorie: "Fournitures", FamilleCode: "17", Notes: "Réaménagement 3 étages bâtiment principal"},
			{TenantID: org.ID, Reference: "M2026-F18", Objet: "Acquisition de véhicules de service", Service: "DGS", Montant: 420000, Procedure: "AO ouvert", Echeance: "2026-03-20", Statut: "alerte", Priorite: "critique", Charge: 25, Categorie: "Fournitures", FamilleCode: "18", Notes: "14 véhicules légers + 3 utilitaires — dossier incomplet"},
			{TenantID: org.ID, Reference: "M2026-F19", Objet: "Matériel espaces verts et horticulture", Service: "DEV", Montant: 45000, Procedure: "MAPA", Echeance: "2026-03-31", Statut: "en_cours", Priorite: "normale", Charge: 5, Categorie: "Fournitures", FamilleCode: "19", Notes: "Tondeuses, tronçonneuses, plants — renouvellement annuel"},
			{TenantID: org.ID, Reference: "M2026-F20", Objet: "Matériel sportif et équipements gymnases", Service: "DS", Montant: 55000, Procedure: "MAPA", Echeance: "2026-07-01", Statut: "planifie", Priorite: "normale", Charge: 6, Categorie: "Fournitures", FamilleCode: "20", Notes: "Équipements pour 4 gymnases municipaux"},
			// ── Services ─────────────────────────────────────────────────────────────
			{TenantID: org.ID, Reference: "M2026-S60", Objet: "Transport scolaire — réseau communal", Service: "DE", Montant: 185000, Procedure: "AO ouvert", Echeance: "2026-08-31", Statut: "en_cours", Priorite: "haute", Charge: 18, Categorie: "Services", FamilleCode: "60", Notes: "Délégation de service — 12 circuits, rentrée 2026"},
			{TenantID: org.ID, Reference: "M2026-S61", Objet: "Maintenance et entretien des bâtiments", Service: "DPAT", Montant: 210000, Procedure: "Accord-cadre", Echeance: "2026-05-31", Statut: "en_cours", Priorite: "haute", Charge: 20, Categorie: "Services", FamilleCode: "61", Notes: "Accord-cadre 3 ans — 6 lots (plomberie, élec, CVC, menuiserie, peinture, serrurerie)"},
			{TenantID: org.ID, Reference: "M2026-S62", Objet: "Maintenance informatique et télécoms", Service: "DSI", Montant: 95000, Procedure: "MAPA", Echeance: "2026-03-31", Statut: "en_cours", Priorite: "haute", Charge: 12, Categorie: "Services", FamilleCode: "62", Notes: "TMA applicatifs + infogérance réseau + support niveau 2"},
			{TenantID: org.ID, Reference: "M2026-S63", Objet: "Gardiennage et sécurité des bâtiments", Service: "DGS", Montant: 210000, Procedure: "AO ouvert", Echeance: "2026-04-30", Statut: "planifie", Priorite: "haute", Charge: 15, Categorie: "Services", FamilleCode: "63", Notes: "Surveillance 24h/24 — hôtel de ville, gymnases, médiathèque"},
			{TenantID: org.ID, Reference: "M2026-S64", Objet: "Restauration collective — self municipal", Service: "DS", Montant: 380000, Procedure: "AO ouvert", Echeance: "2026-07-31", Statut: "en_cours", Priorite: "critique", Charge: 30, Categorie: "Services", FamilleCode: "64", Notes: "DSP restauration — 1 200 repas/jour — commission spéciale"},
			{TenantID: org.ID, Reference: "M2026-S65", Objet: "Assurances des biens et de la flotte", Service: "DGS", Montant: 125000, Procedure: "Accord-cadre", Echeance: "2026-12-31", Statut: "termine", Priorite: "normale", Charge: 6, Categorie: "Services", FamilleCode: "65", Notes: "Contrat pluriannuel renouvelé — 4 lots: biens, flotte, RC, agents"},
			{TenantID: org.ID, Reference: "M2026-S66", Objet: "Formation professionnelle des agents", Service: "DRH", Montant: 48000, Procedure: "MAPA", Echeance: "2026-04-30", Statut: "en_cours", Priorite: "normale", Charge: 8, Categorie: "Services", FamilleCode: "66", Notes: "Plan de formation 2026 — habilitations, management, numérique"},
			{TenantID: org.ID, Reference: "M2026-S68", Objet: "Études et conseil en organisation", Service: "DGS", Montant: 155000, Procedure: "AO restreint", Echeance: "2026-06-30", Statut: "planifie", Priorite: "haute", Charge: 14, Categorie: "Services", FamilleCode: "68", Notes: "Schéma directeur numérique + audit organisationnel"},
			// ── Travaux ───────────────────────────────────────────────────────────────
			{TenantID: org.ID, Reference: "M2026-T01", Objet: "Réhabilitation école primaire Jean Moulin", Service: "DT", Montant: 850000, Procedure: "AO ouvert", Echeance: "2026-04-15", Statut: "alerte", Priorite: "critique", Charge: 45, Categorie: "Travaux", FamilleCode: "T-BAT", Notes: "Mise aux normes ERP + isolation thermique + accessibilité PMR"},
			{TenantID: org.ID, Reference: "M2026-T02", Objet: "Travaux de voirie — secteur Nord-Est", Service: "DT", Montant: 520000, Procedure: "AO ouvert", Echeance: "2026-03-25", Statut: "alerte", Priorite: "critique", Charge: 35, Categorie: "Travaux", FamilleCode: "T-VRD", Notes: "Réfection chaussée + trottoirs + réseaux — 3 rues"},
			{TenantID: org.ID, Reference: "M2026-T03", Objet: "Démolition bâtiment vétuste — site Lacroix", Service: "DT", Montant: 185000, Procedure: "MAPA", Echeance: "2026-06-30", Statut: "planifie", Priorite: "normale", Charge: 12, Categorie: "Travaux", FamilleCode: "T-DEM", Notes: "Déconstruction + désamiantage + remise en état du terrain"},
			{TenantID: org.ID, Reference: "M2026-T04", Objet: "Extension parking et aménagement paysager", Service: "DT", Montant: 220000, Procedure: "AO restreint", Echeance: "2026-07-31", Statut: "planifie", Priorite: "normale", Charge: 18, Categorie: "Travaux", FamilleCode: "T-AME", Notes: "200 places supplémentaires + espaces verts — Z.A. Les Pins"},
			{TenantID: org.ID, Reference: "M2026-T05", Objet: "Réseaux eau potable — renouvellement", Service: "DT", Montant: 380000, Procedure: "AO ouvert", Echeance: "2026-05-31", Statut: "en_cours", Priorite: "haute", Charge: 28, Categorie: "Travaux", FamilleCode: "T-INF", Notes: "Remplacement 2,4 km de canalisations vétustes — quartier Sud"},
			{TenantID: org.ID, Reference: "M2026-T06", Objet: "Maintenance préventive équipements sportifs", Service: "DS", Montant: 95000, Procedure: "Accord-cadre", Echeance: "2026-12-31", Statut: "en_cours", Priorite: "normale", Charge: 10, Categorie: "Travaux", FamilleCode: "T-MNT", Notes: "Accord-cadre 2 ans — terrains synthétiques, gradins, tribunes"},
			{TenantID: org.ID, Reference: "M2026-T07", Objet: "Gros travaux d'entretien patrimoine bâti", Service: "DT", Montant: 145000, Procedure: "MAPA", Echeance: "2026-09-30", Statut: "planifie", Priorite: "normale", Charge: 12, Categorie: "Travaux", FamilleCode: "T-GTE", Notes: "Toitures, ravalement, menuiseries — programme pluriannuel"},
		}
		for i := range marches {
			db.Create(&marches[i])
		}
		fmt.Printf("✓ %d marchés publics seeded\n", len(marches))
	} else {
		fmt.Println("✓ Marchés already seeded — skipping")
	}

	// ── Nomenclature nationale ────────────────────────────
	var nomCount int64
	db.Model(&nomenclaturemod.NomenclatureNode{}).Where("tenant_id = ?", org.ID).Count(&nomCount)
	if nomCount == 0 {
		seedNomenclatureNationale(db, org.ID)
	} else {
		fmt.Println("✓ Nomenclature already seeded — skipping")
	}

	// ── Check if demo data already exists ─────────────────
	var contactCount int64
	db.Model(&crmmod.Contact{}).Where("tenant_id = ?", org.ID).Count(&contactCount)
	if contactCount > 0 {
		fmt.Println("✓ Demo data already seeded — skipping")
		fmt.Println("\n🚀 Seed completed successfully!")
		return
	}

	// ── CRM: Contacts ─────────────────────────────────────
	contacts := []crmmod.Contact{
		{TenantID: org.ID, Type: "company", FirstName: "Marie", LastName: "Dubois", Company: "TechSolutions SA", Email: "marie.dubois@techsolutions.fr", Phone: "+33 1 42 86 55 10", Address: "12 rue de la Paix, 75001 Paris", Tags: "client,prioritaire"},
		{TenantID: org.ID, Type: "person", FirstName: "Jean-Pierre", LastName: "Martin", Company: "Groupe BTP Nord", Email: "jp.martin@btp-nord.fr", Phone: "+33 3 28 44 12 80", Address: "45 avenue Foch, 59000 Lille", Tags: "prospect"},
		{TenantID: org.ID, Type: "company", FirstName: "Sophie", LastName: "Lefebvre", Company: "Innova Retail", Email: "s.lefebvre@innova-retail.fr", Phone: "+33 4 78 32 55 91", Address: "8 quai Saint-Antoine, 69002 Lyon", Tags: "client"},
		{TenantID: org.ID, Type: "person", FirstName: "Antoine", LastName: "Bernard", Company: "Cabinet Bernard & Associés", Email: "a.bernard@cabinet-bernard.fr", Phone: "+33 5 56 48 22 37", Address: "3 cours du Chapeau-Rouge, 33000 Bordeaux", Tags: "partenaire"},
		{TenantID: org.ID, Type: "company", FirstName: "Camille", LastName: "Dupont", Company: "EcoFrance Industries", Email: "c.dupont@ecofrance.fr", Phone: "+33 2 40 25 77 14", Address: "22 boulevard des Entrepreneurs, 44000 Nantes", Tags: "client,prioritaire"},
		{TenantID: org.ID, Type: "person", FirstName: "Thomas", LastName: "Moreau", Company: "Moreau Logistics", Email: "t.moreau@moreau-logistics.fr", Phone: "+33 1 55 80 34 20", Address: "77 rue d'Amsterdam, 75008 Paris", Tags: "prospect"},
		{TenantID: org.ID, Type: "company", FirstName: "Isabelle", LastName: "Petit", Company: "Groupe Santé Plus", Email: "i.petit@sante-plus.fr", Phone: "+33 4 42 38 19 05", Address: "14 rue de Rome, 13001 Marseille", Tags: "client"},
		{TenantID: org.ID, Type: "person", FirstName: "Nicolas", LastName: "Leroy", Company: "Leroy Consulting", Email: "n.leroy@leroy-consulting.fr", Phone: "+33 3 88 22 61 43", Address: "5 place de la Cathédrale, 67000 Strasbourg", Tags: "partenaire"},
		{TenantID: org.ID, Type: "company", FirstName: "Aurélie", LastName: "Simon", Company: "Digital Wave Agency", Email: "a.simon@digitalwave.fr", Phone: "+33 1 44 71 88 60", Address: "30 rue de Rivoli, 75004 Paris", Tags: "client"},
		{TenantID: org.ID, Type: "person", FirstName: "Marc", LastName: "Michel", Company: "Michel & Fils SAS", Email: "m.michel@michel-fils.fr", Phone: "+33 4 76 44 28 55", Address: "9 avenue Alsace-Lorraine, 38000 Grenoble", Tags: "prospect"},
		{TenantID: org.ID, Type: "company", FirstName: "Céline", LastName: "Garcia", Company: "Pharma Distribution SA", Email: "c.garcia@pharma-dist.fr", Phone: "+33 5 61 38 54 79", Address: "18 allée de Barcelone, 31000 Toulouse", Tags: "client,prioritaire"},
		{TenantID: org.ID, Type: "person", FirstName: "Romain", LastName: "Laurent", Company: "Laurent Immobilier", Email: "r.laurent@laurent-immo.fr", Phone: "+33 2 35 71 43 86", Address: "11 rue Jean Lecanuet, 76000 Rouen", Tags: "prospect"},
		{TenantID: org.ID, Type: "company", FirstName: "Véronique", LastName: "Thomas", Company: "VT Conseil & Formation", Email: "v.thomas@vtconseil.fr", Phone: "+33 1 47 20 64 32", Address: "56 avenue des Champs-Élysées, 75008 Paris", Tags: "partenaire"},
		{TenantID: org.ID, Type: "person", FirstName: "Julien", LastName: "Robert", Company: "Robert Agri SARL", Email: "j.robert@robert-agri.fr", Phone: "+33 3 85 40 17 28", Address: "2 route de Mâcon, 71000 Mâcon", Tags: "client"},
		{TenantID: org.ID, Type: "company", FirstName: "Nathalie", LastName: "Richard", Company: "Richard Événements", Email: "n.richard@richard-events.fr", Phone: "+33 4 93 18 72 55", Address: "7 promenade des Anglais, 06000 Nice", Tags: "prospect"},
	}
	for i := range contacts {
		db.Create(&contacts[i])
	}
	fmt.Printf("✓ %d contacts seeded\n", len(contacts))

	// ── CRM: Leads ────────────────────────────────────────
	leads := []crmmod.Lead{
		{TenantID: org.ID, Title: "Migration ERP — TechSolutions SA", Status: "qualified", Source: "Inbound", Value: 45000, Notes: "Intéressé par la suite complète + formation"},
		{TenantID: org.ID, Title: "Logiciel RH — Groupe Santé Plus", Status: "contacted", Source: "Salon B2B", Value: 18000, Notes: "Besoin d'un module congés et paie"},
		{TenantID: org.ID, Title: "Gestion stocks — Michel & Fils", Status: "new", Source: "Référencement", Value: 12000, Notes: "PME industrielle, 3 entrepôts"},
		{TenantID: org.ID, Title: "CRM sur mesure — Leroy Consulting", Status: "qualified", Source: "Bouche à oreille", Value: 8500, Notes: "Cabinet de conseil, 25 utilisateurs"},
		{TenantID: org.ID, Title: "Facturation automatisée — Innova Retail", Status: "contacted", Source: "LinkedIn", Value: 22000, Notes: "100+ factures par mois"},
		{TenantID: org.ID, Title: "Analytics BI — EcoFrance Industries", Status: "new", Source: "Webinar", Value: 35000, Notes: "Consolidation reporting multi-sites"},
		{TenantID: org.ID, Title: "Module Achats — BTP Nord", Status: "lost", Source: "Appel d'offres", Value: 28000, Notes: "Perdu au profit d'un concurrent"},
		{TenantID: org.ID, Title: "Comptabilité cloud — Laurent Immobilier", Status: "qualified", Source: "Email campaign", Value: 9500, Notes: "Transition depuis Excel"},
	}
	for i := range leads {
		db.Create(&leads[i])
	}
	fmt.Printf("✓ %d leads seeded\n", len(leads))

	// ── CRM: Deals ────────────────────────────────────────
	exp1 := "2026-03-31"
	exp2 := "2026-04-15"
	exp3 := "2026-05-01"
	exp4 := "2026-03-20"
	deals := []crmmod.Deal{
		{TenantID: org.ID, Title: "Contrat ERP Full Suite — TechSolutions SA", Stage: "negotiation", Value: 45000, Currency: "EUR", Probability: 75, ExpectedAt: &exp1, Notes: "Négociation sur le prix de la licence"},
		{TenantID: org.ID, Title: "Module RH Premium — Groupe Santé Plus", Stage: "proposal", Value: 18000, Currency: "EUR", Probability: 50, ExpectedAt: &exp2, Notes: "Devis envoyé, attente validation DG"},
		{TenantID: org.ID, Title: "Licence Analytics — EcoFrance Industries", Stage: "prospecting", Value: 35000, Currency: "EUR", Probability: 20, ExpectedAt: &exp3, Notes: "Démonstration prévue semaine prochaine"},
		{TenantID: org.ID, Title: "CRM + Facturation — Digital Wave Agency", Stage: "closed_won", Value: 15500, Currency: "EUR", Probability: 100, ExpectedAt: &exp4, Notes: "Contrat signé ! Onboarding en cours"},
		{TenantID: org.ID, Title: "Inventaire Multi-sites — Michel & Fils", Stage: "proposal", Value: 12000, Currency: "EUR", Probability: 60, ExpectedAt: &exp2, Notes: "3 sites, besoins spécifiques"},
		{TenantID: org.ID, Title: "Suite Comptabilité — Laurent Immobilier", Stage: "closed_won", Value: 9500, Currency: "EUR", Probability: 100, Notes: "Déployé avec succès"},
	}
	for i := range deals {
		db.Create(&deals[i])
	}
	fmt.Printf("✓ %d deals seeded\n", len(deals))

	// ── Accounting: Accounts ──────────────────────────────
	accounts := []accountingmod.Account{
		{TenantID: org.ID, Code: "512", Name: "Banque principale — BNP Paribas", Type: "asset", Currency: "EUR", Balance: 127450.00, IsActive: true},
		{TenantID: org.ID, Code: "411", Name: "Clients — Comptes débiteurs", Type: "asset", Currency: "EUR", Balance: 89320.50, IsActive: true},
		{TenantID: org.ID, Code: "401", Name: "Fournisseurs — Comptes créditeurs", Type: "liability", Currency: "EUR", Balance: -42180.75, IsActive: true},
		{TenantID: org.ID, Code: "706", Name: "Prestations de services", Type: "revenue", Currency: "EUR", Balance: 385000.00, IsActive: true},
		{TenantID: org.ID, Code: "607", Name: "Achats de marchandises", Type: "expense", Currency: "EUR", Balance: -156800.00, IsActive: true},
		{TenantID: org.ID, Code: "641", Name: "Charges de personnel", Type: "expense", Currency: "EUR", Balance: -198500.00, IsActive: true},
		{TenantID: org.ID, Code: "101", Name: "Capital social", Type: "equity", Currency: "EUR", Balance: 250000.00, IsActive: true},
		{TenantID: org.ID, Code: "445", Name: "TVA — État créditeur", Type: "liability", Currency: "EUR", Balance: -31200.00, IsActive: true},
	}
	for i := range accounts {
		db.Create(&accounts[i])
	}
	fmt.Printf("✓ %d accounting accounts seeded\n", len(accounts))

	// ── Accounting: Transactions ──────────────────────────
	transactions := []accountingmod.Transaction{
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "VIR-2026-001", Description: "Virement client TechSolutions SA — Facture FAC-2026-008", Amount: 15500, Type: "credit", Date: "2026-02-28", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "VIR-2026-002", Description: "Paiement fournisseur — Hébergement cloud Q1", Amount: 4200, Type: "debit", Date: "2026-03-01", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "VIR-2026-003", Description: "Règlement Digital Wave Agency — Contrat annuel", Amount: 9500, Type: "credit", Date: "2026-03-02", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "CHQ-2026-014", Description: "Loyers bureaux — Mars 2026", Amount: 3500, Type: "debit", Date: "2026-03-03", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[3].ID, Reference: "FACT-2026-022", Description: "Licence ERP — Groupe Santé Plus — Mars", Amount: 1800, Type: "credit", Date: "2026-03-04", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[4].ID, Reference: "ACH-2026-007", Description: "Matériel informatique — Dell 15 laptops", Amount: 18750, Type: "debit", Date: "2026-03-05", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "VIR-2026-004", Description: "Acompte projet EcoFrance Industries", Amount: 8750, Type: "credit", Date: "2026-03-06", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[5].ID, Reference: "PAIE-2026-03", Description: "Salaires Mars 2026 — 12 collaborateurs", Amount: 52400, Type: "debit", Date: "2026-03-07", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "VIR-2026-005", Description: "Remboursement frais déplacement", Amount: 1240, Type: "debit", Date: "2026-03-07", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[3].ID, Reference: "FACT-2026-023", Description: "Formation utilisateurs — Innova Retail", Amount: 3200, Type: "credit", Date: "2026-03-08", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "CB-2026-031", Description: "Abonnements SaaS (GitHub, Figma, Notion)", Amount: 480, Type: "debit", Date: "2026-03-08", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "VIR-2026-006", Description: "Paiement client Michel & Fils — Facture FAC-2026-011", Amount: 6000, Type: "credit", Date: "2026-02-20", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[4].ID, Reference: "ACH-2026-008", Description: "Licences logiciels — Adobe Suite 10 postes", Amount: 5400, Type: "debit", Date: "2026-02-18", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "VIR-2026-007", Description: "Encaissement Laurent Immobilier — Projet cloud", Amount: 9500, Type: "credit", Date: "2026-02-15", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[0].ID, Reference: "PRIMES-2026-01", Description: "Primes de performance T4 2025", Amount: 12000, Type: "debit", Date: "2026-01-31", CreatedBy: admin.ID},
	}
	for i := range transactions {
		db.Create(&transactions[i])
	}
	fmt.Printf("✓ %d transactions seeded\n", len(transactions))

	// ── Billing: Invoices ─────────────────────────────────
	invoices := []billingmod.Invoice{
		{TenantID: org.ID, Number: "FAC-2026-001", Status: "paid", IssueDate: "2026-01-05", DueDate: "2026-02-05", Currency: "EUR", Subtotal: 12916.67, TaxRate: 20, TaxAmount: 2583.33, Total: 15500, Notes: "Contrat ERP — Digital Wave Agency", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-002", Status: "paid", IssueDate: "2026-01-12", DueDate: "2026-02-12", Currency: "EUR", Subtotal: 7916.67, TaxRate: 20, TaxAmount: 1583.33, Total: 9500, Notes: "Module Comptabilité — Laurent Immobilier", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-003", Status: "sent", IssueDate: "2026-02-01", DueDate: "2026-03-01", Currency: "EUR", Subtotal: 15000, TaxRate: 20, TaxAmount: 3000, Total: 18000, Notes: "Module RH Premium — Groupe Santé Plus", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-004", Status: "paid", IssueDate: "2026-02-10", DueDate: "2026-03-10", Currency: "EUR", Subtotal: 2666.67, TaxRate: 20, TaxAmount: 533.33, Total: 3200, Notes: "Formation utilisateurs — Innova Retail", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-005", Status: "overdue", IssueDate: "2026-01-20", DueDate: "2026-02-20", Currency: "EUR", Subtotal: 29166.67, TaxRate: 20, TaxAmount: 5833.33, Total: 35000, Notes: "Analytics BI — EcoFrance Industries", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-006", Status: "draft", IssueDate: "2026-03-01", DueDate: "2026-04-01", Currency: "EUR", Subtotal: 37500, TaxRate: 20, TaxAmount: 7500, Total: 45000, Notes: "Contrat ERP Full Suite — TechSolutions SA", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-007", Status: "paid", IssueDate: "2026-02-15", DueDate: "2026-03-15", Currency: "EUR", Subtotal: 1500, TaxRate: 20, TaxAmount: 300, Total: 1800, Notes: "Abonnement mensuel — Groupe Santé Plus", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-008", Status: "sent", IssueDate: "2026-03-01", DueDate: "2026-04-01", Currency: "EUR", Subtotal: 10000, TaxRate: 20, TaxAmount: 2000, Total: 12000, Notes: "Inventaire Multi-sites — Michel & Fils", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-009", Status: "paid", IssueDate: "2026-01-28", DueDate: "2026-02-28", Currency: "EUR", Subtotal: 7083.33, TaxRate: 20, TaxAmount: 1416.67, Total: 8500, Notes: "CRM — Leroy Consulting", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "FAC-2026-010", Status: "cancelled", IssueDate: "2026-02-05", DueDate: "2026-03-05", Currency: "EUR", Subtotal: 23333.33, TaxRate: 20, TaxAmount: 4666.67, Total: 28000, Notes: "Module Achats — BTP Nord (annulé)", CreatedBy: admin.ID},
	}
	for i := range invoices {
		db.Create(&invoices[i])
	}
	fmt.Printf("✓ %d invoices seeded\n", len(invoices))

	// ── Inventory: Products ───────────────────────────────
	products := []inventorymod.Product{
		{TenantID: org.ID, SKU: "LIC-ERP-STD", Name: "Licence ERP Standard", Description: "Accès complet plateforme ERP — 1 an", Category: "Licences", UnitPrice: 1800, CostPrice: 400, Stock: 250, ReorderAt: 20, Unit: "licence", IsActive: true},
		{TenantID: org.ID, SKU: "LIC-ERP-PRO", Name: "Licence ERP Pro", Description: "Suite ERP complète + IA — 1 an", Category: "Licences", UnitPrice: 4800, CostPrice: 900, Stock: 85, ReorderAt: 10, Unit: "licence", IsActive: true},
		{TenantID: org.ID, SKU: "SRV-IMPL-01", Name: "Prestation implémentation", Description: "Déploiement et configuration ERP (journée)", Category: "Services", UnitPrice: 1200, CostPrice: 600, Stock: 500, ReorderAt: 0, Unit: "jour", IsActive: true},
		{TenantID: org.ID, SKU: "SRV-FORM-01", Name: "Formation utilisateurs", Description: "Session formation demi-journée (8 pers. max)", Category: "Services", UnitPrice: 800, CostPrice: 350, Stock: 200, ReorderAt: 0, Unit: "session", IsActive: true},
		{TenantID: org.ID, SKU: "HW-SRV-DELL", Name: "Serveur Dell PowerEdge R750", Description: "Serveur rack 2U, 64GB RAM, 4TB NVMe", Category: "Matériel", UnitPrice: 8500, CostPrice: 6200, Stock: 12, ReorderAt: 3, Unit: "unité", IsActive: true},
		{TenantID: org.ID, SKU: "HW-LAP-001", Name: "Laptop Dell Latitude 5540", Description: "i7, 16GB RAM, 512GB SSD, 15.6\"", Category: "Matériel", UnitPrice: 1450, CostPrice: 980, Stock: 8, ReorderAt: 5, Unit: "unité", IsActive: true},
		{TenantID: org.ID, SKU: "SRV-MAINT-12", Name: "Maintenance annuelle", Description: "Support prioritaire + mises à jour — 1 an", Category: "Services", UnitPrice: 600, CostPrice: 120, Stock: 999, ReorderAt: 0, Unit: "contrat", IsActive: true},
		{TenantID: org.ID, SKU: "LIC-API-01", Name: "Accès API avancé", Description: "10 000 appels API/mois + webhooks", Category: "Licences", UnitPrice: 299, CostPrice: 50, Stock: 500, ReorderAt: 0, Unit: "mois", IsActive: true},
		{TenantID: org.ID, SKU: "SRV-AUDIT-01", Name: "Audit sécurité", Description: "Audit complet infrastructure et code", Category: "Services", UnitPrice: 3500, CostPrice: 1800, Stock: 50, ReorderAt: 0, Unit: "prestation", IsActive: true},
		{TenantID: org.ID, SKU: "HW-NAS-001", Name: "NAS Synology DS923+", Description: "NAS 4 baies, 32TB, RAID 5", Category: "Matériel", UnitPrice: 1200, CostPrice: 780, Stock: 3, ReorderAt: 3, Unit: "unité", IsActive: true},
		{TenantID: org.ID, SKU: "SRV-MIGR-01", Name: "Migration données", Description: "Import et migration depuis système existant", Category: "Services", UnitPrice: 2400, CostPrice: 900, Stock: 100, ReorderAt: 0, Unit: "projet", IsActive: true},
		{TenantID: org.ID, SKU: "LIC-AI-01", Name: "Module IA Claude", Description: "Agents IA — 1 mois, usage illimité", Category: "Licences", UnitPrice: 450, CostPrice: 180, Stock: 300, ReorderAt: 0, Unit: "mois", IsActive: true},
	}
	for i := range products {
		db.Create(&products[i])
	}
	fmt.Printf("✓ %d products seeded\n", len(products))

	// ── HR: Employees ─────────────────────────────────────
	employees := []hrmod.Employee{
		{TenantID: org.ID, FirstName: "Lucas", LastName: "Fontaine", Email: "l.fontaine@stratt.io", Phone: "+33 6 12 34 56 78", Department: "Ingénierie", JobTitle: "Lead Développeur Backend", HireDate: "2023-03-15", Salary: 58000, Status: "active"},
		{TenantID: org.ID, FirstName: "Emma", LastName: "Girard", Email: "e.girard@stratt.io", Phone: "+33 6 23 45 67 89", Department: "Ingénierie", JobTitle: "Développeuse Frontend", HireDate: "2023-06-01", Salary: 48000, Status: "active"},
		{TenantID: org.ID, FirstName: "Hugo", LastName: "Leclerc", Email: "h.leclerc@stratt.io", Phone: "+33 6 34 56 78 90", Department: "Produit", JobTitle: "Product Manager", HireDate: "2022-09-12", Salary: 62000, Status: "active"},
		{TenantID: org.ID, FirstName: "Léa", LastName: "Rousseau", Email: "l.rousseau@stratt.io", Phone: "+33 6 45 67 89 01", Department: "Commercial", JobTitle: "Account Executive", HireDate: "2024-01-08", Salary: 42000, Status: "active"},
		{TenantID: org.ID, FirstName: "Pierre", LastName: "Fournier", Email: "p.fournier@stratt.io", Phone: "+33 6 56 78 90 12", Department: "Support", JobTitle: "Customer Success Manager", HireDate: "2023-11-20", Salary: 38000, Status: "active"},
		{TenantID: org.ID, FirstName: "Anaïs", LastName: "Morin", Email: "a.morin@stratt.io", Phone: "+33 6 67 89 01 23", Department: "Marketing", JobTitle: "Marketing Manager", HireDate: "2022-04-03", Salary: 52000, Status: "active"},
		{TenantID: org.ID, FirstName: "Théo", LastName: "Blanc", Email: "t.blanc@stratt.io", Phone: "+33 6 78 90 12 34", Department: "Ingénierie", JobTitle: "DevOps Engineer", HireDate: "2024-02-14", Salary: 55000, Status: "active"},
		{TenantID: org.ID, FirstName: "Julie", LastName: "Henry", Email: "j.henry@stratt.io", Phone: "+33 6 89 01 23 45", Department: "Finance", JobTitle: "Contrôleur de Gestion", HireDate: "2021-08-30", Salary: 50000, Status: "on_leave"},
	}
	for i := range employees {
		db.Create(&employees[i])
	}
	fmt.Printf("✓ %d employees seeded\n", len(employees))

	// ── HR: Leave Requests ────────────────────────────────
	leaveRequests := []hrmod.LeaveRequest{
		{TenantID: org.ID, EmployeeID: employees[0].ID, Type: "annual", StartDate: "2026-03-24", EndDate: "2026-03-28", Days: 5, Reason: "Vacances Pâques", Status: "approved"},
		{TenantID: org.ID, EmployeeID: employees[7].ID, Type: "sick", StartDate: "2026-03-04", EndDate: "2026-03-15", Days: 10, Reason: "Arrêt maladie", Status: "approved"},
		{TenantID: org.ID, EmployeeID: employees[3].ID, Type: "annual", StartDate: "2026-04-07", EndDate: "2026-04-11", Days: 5, Reason: "Congés personnels", Status: "pending"},
		{TenantID: org.ID, EmployeeID: employees[1].ID, Type: "annual", StartDate: "2026-05-19", EndDate: "2026-05-23", Days: 5, Reason: "Long week-end de Pentecôte", Status: "pending"},
		{TenantID: org.ID, EmployeeID: employees[5].ID, Type: "unpaid", StartDate: "2026-02-02", EndDate: "2026-02-06", Days: 5, Reason: "Projet personnel", Status: "approved"},
	}
	for i := range leaveRequests {
		db.Create(&leaveRequests[i])
	}
	fmt.Printf("✓ %d leave requests seeded\n", len(leaveRequests))

	// ── Procurement: Purchase Orders ──────────────────────
	// 18 commandes couvrant les familles nomenclature — descriptions = noms familles
	// pour que l'ABC Pareto par catégorie soit cohérent avec la nomenclature
	purchaseOrders := []procurementmod.PurchaseOrder{
		// Matériel informatique (F16)
		{TenantID: org.ID, Number: "BC-2026-001", Status: "received", OrderDate: "2026-01-10", DeliveryDate: "2026-01-20", Currency: "EUR", Subtotal: 56250, TaxAmount: 11250, Total: 67500, Notes: "Lot 1 renouvellement parc informatique — 45 postes", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-002", Status: "received", OrderDate: "2026-01-28", DeliveryDate: "2026-02-15", Currency: "EUR", Subtotal: 35833, TaxAmount: 7167, Total: 43000, Notes: "Lot 2 — serveurs et équipements réseau DSI", CreatedBy: admin.ID},
		// Logiciels et licences (F16 / S62)
		{TenantID: org.ID, Number: "BC-2026-003", Status: "received", OrderDate: "2026-01-25", DeliveryDate: "2026-02-05", Currency: "EUR", Subtotal: 89167, TaxAmount: 17833, Total: 107000, Notes: "Licences logiciels métiers — suite bureautique + ERP + BI", CreatedBy: admin.ID},
		// Services informatiques (S62)
		{TenantID: org.ID, Number: "BC-2026-004", Status: "sent", OrderDate: "2026-02-01", DeliveryDate: "2026-03-31", Currency: "EUR", Subtotal: 62500, TaxAmount: 12500, Total: 75000, Notes: "TMA et infogérance réseau — Q1/Q2 2026", CreatedBy: admin.ID},
		// Maintenance bâtiments (S61)
		{TenantID: org.ID, Number: "BC-2026-005", Status: "received", OrderDate: "2026-01-05", DeliveryDate: "2026-01-31", Currency: "EUR", Subtotal: 29167, TaxAmount: 5833, Total: 35000, Notes: "Maintenance préventive — lot plomberie/CVC hiver 2026", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-006", Status: "received", OrderDate: "2026-02-10", DeliveryDate: "2026-02-28", Currency: "EUR", Subtotal: 20833, TaxAmount: 4167, Total: 25000, Notes: "Maintenance électricité bâtiments communaux — T1 2026", CreatedBy: admin.ID},
		// Denrées alimentaires (F10)
		{TenantID: org.ID, Number: "BC-2026-007", Status: "received", OrderDate: "2026-01-02", DeliveryDate: "2026-01-08", Currency: "EUR", Subtotal: 14167, TaxAmount: 2833, Total: 17000, Notes: "Lot fruits et légumes frais — janvier/février 2026", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-008", Status: "received", OrderDate: "2026-02-03", DeliveryDate: "2026-02-10", Currency: "EUR", Subtotal: 11667, TaxAmount: 2333, Total: 14000, Notes: "Produits laitiers et viandes — restauration scolaire", CreatedBy: admin.ID},
		// Fournitures administratives (F11)
		{TenantID: org.ID, Number: "BC-2026-009", Status: "received", OrderDate: "2026-01-15", DeliveryDate: "2026-01-22", Currency: "EUR", Subtotal: 7083, TaxAmount: 1417, Total: 8500, Notes: "Fournitures de bureau T1 — papier, cartouches, enveloppes", CreatedBy: admin.ID},
		// Produits entretien (F13)
		{TenantID: org.ID, Number: "BC-2026-010", Status: "received", OrderDate: "2026-02-15", DeliveryDate: "2026-02-25", Currency: "EUR", Subtotal: 12500, TaxAmount: 2500, Total: 15000, Notes: "Produits ménagers et d'entretien — stock trimestriel", CreatedBy: admin.ID},
		// Véhicules (F18)
		{TenantID: org.ID, Number: "BC-2026-011", Status: "draft", OrderDate: "2026-03-01", DeliveryDate: "2026-06-30", Currency: "EUR", Subtotal: 145833, TaxAmount: 29167, Total: 175000, Notes: "Lot 1 véhicules légers — 7 Renault Kangoo E-Tech", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-012", Status: "draft", OrderDate: "2026-03-01", DeliveryDate: "2026-07-15", Currency: "EUR", Subtotal: 103333, TaxAmount: 20667, Total: 124000, Notes: "Lot 2 utilitaires — 3 Renault Master + équipements", CreatedBy: admin.ID},
		// Gardiennage / Sécurité (S63)
		{TenantID: org.ID, Number: "BC-2026-013", Status: "received", OrderDate: "2026-01-02", DeliveryDate: "2026-01-31", Currency: "EUR", Subtotal: 13750, TaxAmount: 2750, Total: 16500, Notes: "Surveillance bâtiments municipaux — janvier 2026", CreatedBy: admin.ID},
		// Formation (S66)
		{TenantID: org.ID, Number: "BC-2026-014", Status: "received", OrderDate: "2026-02-05", DeliveryDate: "2026-03-28", Currency: "EUR", Subtotal: 10000, TaxAmount: 2000, Total: 12000, Notes: "Formations habilitations électriques + secourisme — 40 agents", CreatedBy: admin.ID},
		// Mobilier (F17)
		{TenantID: org.ID, Number: "BC-2025-048", Status: "received", OrderDate: "2025-11-15", DeliveryDate: "2025-12-15", Currency: "EUR", Subtotal: 25000, TaxAmount: 5000, Total: 30000, Notes: "Mobilier bureaux — réaménagement 2e étage", CreatedBy: admin.ID},
		// Espaces verts (F19)
		{TenantID: org.ID, Number: "BC-2026-015", Status: "received", OrderDate: "2026-02-20", DeliveryDate: "2026-03-10", Currency: "EUR", Subtotal: 10833, TaxAmount: 2167, Total: 13000, Notes: "Tondeuses tractées + équipements taille-haie — printemps 2026", CreatedBy: admin.ID},
		// Fournitures techniques (F15)
		{TenantID: org.ID, Number: "BC-2026-016", Status: "received", OrderDate: "2026-01-20", DeliveryDate: "2026-02-05", Currency: "EUR", Subtotal: 16667, TaxAmount: 3333, Total: 20000, Notes: "Pièces détachées et outillage — ateliers municipaux T1", CreatedBy: admin.ID},
		// EPI / Sécurité (F14)
		{TenantID: org.ID, Number: "BC-2026-017", Status: "sent", OrderDate: "2026-03-05", DeliveryDate: "2026-04-15", Currency: "EUR", Subtotal: 14167, TaxAmount: 2833, Total: 17000, Notes: "EPI agents voirie — chaussures, gilets, gants — renouvellement", CreatedBy: admin.ID},
		// Études et conseil (S68)
		{TenantID: org.ID, Number: "BC-2026-018", Status: "sent", OrderDate: "2026-03-10", DeliveryDate: "2026-06-30", Currency: "EUR", Subtotal: 37500, TaxAmount: 7500, Total: 45000, Notes: "Mission AMO schéma directeur numérique — phase 1/3", CreatedBy: admin.ID},
	}
	for i := range purchaseOrders {
		db.Create(&purchaseOrders[i])
	}
	fmt.Printf("✓ %d purchase orders seeded\n", len(purchaseOrders))

	// ── Invoice items ─────────────────────────────────────
	invoiceItems := []billingmod.InvoiceItem{
		{InvoiceID: invoices[0].ID, Description: "Licence ERP Digital Wave — 1 an", Quantity: 1, UnitPrice: 9600, Total: 9600},
		{InvoiceID: invoices[0].ID, Description: "Implémentation et configuration", Quantity: 2, UnitPrice: 1200, Total: 2400},
		{InvoiceID: invoices[0].ID, Description: "Formation équipe (2 sessions)", Quantity: 2, UnitPrice: 800, Total: 1600},
		{InvoiceID: invoices[1].ID, Description: "Licence Comptabilité — Laurent Immo", Quantity: 1, UnitPrice: 4800, Total: 4800},
		{InvoiceID: invoices[1].ID, Description: "Migration données depuis Excel", Quantity: 1, UnitPrice: 2400, Total: 2400},
		{InvoiceID: invoices[1].ID, Description: "Maintenance annuelle", Quantity: 1, UnitPrice: 600, Total: 600},
		{InvoiceID: invoices[2].ID, Description: "Licence RH Premium — 10 utilisateurs", Quantity: 10, UnitPrice: 1200, Total: 12000},
		{InvoiceID: invoices[2].ID, Description: "Module paie intégré", Quantity: 1, UnitPrice: 2000, Total: 2000},
		{InvoiceID: invoices[2].ID, Description: "Support prioritaire — 1 an", Quantity: 1, UnitPrice: 1000, Total: 1000},
	}
	for i := range invoiceItems {
		db.Create(&invoiceItems[i])
	}
	fmt.Printf("✓ %d invoice items seeded\n", len(invoiceItems))

	// ── Purchase Order items ─────────────────────────────
	// Descriptions = noms des familles nomenclature → ABC Pareto cohérent
	poItems := []procurementmod.PurchaseOrderItem{
		// BC-2026-001 Matériel informatique
		{OrderID: purchaseOrders[0].ID, Description: "Matériel informatique", Quantity: 45, UnitPrice: 1150, Total: 51750},
		{OrderID: purchaseOrders[0].ID, Description: "Matériel informatique", Quantity: 1, UnitPrice: 4500, Total: 4500},
		// BC-2026-002 Matériel informatique (serveurs)
		{OrderID: purchaseOrders[1].ID, Description: "Matériel informatique", Quantity: 2, UnitPrice: 8500, Total: 17000},
		{OrderID: purchaseOrders[1].ID, Description: "Matériel informatique", Quantity: 1, UnitPrice: 18833, Total: 18833},
		// BC-2026-003 Logiciels métiers et licences
		{OrderID: purchaseOrders[2].ID, Description: "Logiciels métiers et licences", Quantity: 80, UnitPrice: 890, Total: 71200},
		{OrderID: purchaseOrders[2].ID, Description: "Logiciels métiers et licences", Quantity: 1, UnitPrice: 17967, Total: 17967},
		// BC-2026-004 Maintenance informatique
		{OrderID: purchaseOrders[3].ID, Description: "Maintenance informatique", Quantity: 6, UnitPrice: 10417, Total: 62500},
		// BC-2026-005 Maintenance bâtiments
		{OrderID: purchaseOrders[4].ID, Description: "Maintenance bâtiments", Quantity: 1, UnitPrice: 29167, Total: 29167},
		// BC-2026-006 Maintenance bâtiments
		{OrderID: purchaseOrders[5].ID, Description: "Maintenance bâtiments", Quantity: 1, UnitPrice: 20833, Total: 20833},
		// BC-2026-007 Denrées alimentaires
		{OrderID: purchaseOrders[6].ID, Description: "Denrées alimentaires", Quantity: 4, UnitPrice: 3542, Total: 14167},
		// BC-2026-008 Denrées alimentaires
		{OrderID: purchaseOrders[7].ID, Description: "Denrées alimentaires", Quantity: 4, UnitPrice: 2917, Total: 11667},
		// BC-2026-009 Fournitures administratives
		{OrderID: purchaseOrders[8].ID, Description: "Fournitures administratives et de bureau", Quantity: 1, UnitPrice: 7083, Total: 7083},
		// BC-2026-010 Produits entretien
		{OrderID: purchaseOrders[9].ID, Description: "Produits d'entretien et d'hygiène", Quantity: 1, UnitPrice: 12500, Total: 12500},
		// BC-2026-011 Véhicules
		{OrderID: purchaseOrders[10].ID, Description: "Véhicules et mobilité", Quantity: 7, UnitPrice: 20833, Total: 145833},
		// BC-2026-012 Véhicules
		{OrderID: purchaseOrders[11].ID, Description: "Véhicules et mobilité", Quantity: 3, UnitPrice: 34444, Total: 103333},
		// BC-2026-013 Gardiennage
		{OrderID: purchaseOrders[12].ID, Description: "Gardiennage et sécurité des bâtiments", Quantity: 1, UnitPrice: 13750, Total: 13750},
		// BC-2026-014 Formation
		{OrderID: purchaseOrders[13].ID, Description: "Formation professionnelle des agents", Quantity: 5, UnitPrice: 2000, Total: 10000},
		// BC-2025-048 Mobilier
		{OrderID: purchaseOrders[14].ID, Description: "Mobilier et équipements de bureaux", Quantity: 8, UnitPrice: 3125, Total: 25000},
		// BC-2026-015 Espaces verts
		{OrderID: purchaseOrders[15].ID, Description: "Matériel espaces verts et horticulture", Quantity: 4, UnitPrice: 2708, Total: 10833},
		// BC-2026-016 Fournitures techniques
		{OrderID: purchaseOrders[16].ID, Description: "Fournitures techniques maintenance", Quantity: 1, UnitPrice: 16667, Total: 16667},
		// BC-2026-017 EPI
		{OrderID: purchaseOrders[17].ID, Description: "Équipements de protection individuelle", Quantity: 50, UnitPrice: 283, Total: 14167},
		// BC-2026-018 Études et conseil
		{OrderID: purchaseOrders[18-1].ID, Description: "Études et conseil en organisation", Quantity: 25, UnitPrice: 1500, Total: 37500},
	}
	for i := range poItems {
		db.Create(&poItems[i])
	}
	fmt.Printf("✓ %d purchase order items seeded\n", len(poItems))

	// ── Stock Movements ───────────────────────────────────
	stockMovements := []inventorymod.StockMovement{
		{TenantID: org.ID, ProductID: products[4].ID, Type: "in", Quantity: 5, Reference: "BC-2026-004", Notes: "Réception commande Dell", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[5].ID, Type: "in", Quantity: 15, Reference: "BC-2026-001", Notes: "Réception 15 laptops", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[5].ID, Type: "out", Quantity: 7, Reference: "LIVR-2026-03", Notes: "Livraison client TechSolutions", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[0].ID, Type: "out", Quantity: 12, Reference: "FAC-2026-001", Notes: "Vente licences Digital Wave", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[9].ID, Type: "in", Quantity: 2, Reference: "BC-2026-005", Notes: "Réception NAS Synology", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[9].ID, Type: "adjustment", Quantity: -1, Reference: "ADJ-2026-01", Notes: "Ajustement inventaire — unité défectueuse", CreatedBy: admin.ID},
	}
	for i := range stockMovements {
		db.Create(&stockMovements[i])
	}
	fmt.Printf("✓ %d stock movements seeded\n", len(stockMovements))

	_ = uuid.Nil // suppress unused import warning

	fmt.Println("\n🚀 Seed completed successfully!")
	fmt.Printf("   Contacts: %d | Leads: %d | Deals: %d\n", len(contacts), len(leads), len(deals))
	fmt.Printf("   Factures: %d | Employés: %d | Produits: %d\n", len(invoices), len(employees), len(products))
	fmt.Printf("   Commandes: %d | Transactions: %d\n", len(purchaseOrders), len(transactions))
}
