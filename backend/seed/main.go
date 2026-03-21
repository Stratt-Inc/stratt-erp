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
	var marcheCount int64
	db.Model(&marchesmod.Marche{}).Where("tenant_id = ?", org.ID).Count(&marcheCount)
	if marcheCount == 0 {
		marches := []marchesmod.Marche{
			{TenantID: org.ID, Reference: "M2026-001", Objet: "Fournitures de bureau et consommables", Service: "DRH", Montant: 15000, Procedure: "MAPA", Echeance: "2026-04-15", Statut: "planifie", Priorite: "normale", Charge: 5, Notes: "Renouvellement annuel fournitures"},
			{TenantID: org.ID, Reference: "M2026-012", Objet: "Maintenance du réseau informatique", Service: "DSI", Montant: 85000, Procedure: "AO ouvert", Echeance: "2026-03-31", Statut: "en_cours", Priorite: "haute", Charge: 15, Notes: "Contrat pluriannuel 3 ans"},
			{TenantID: org.ID, Reference: "M2026-023", Objet: "Acquisition de véhicules de service", Service: "DGS", Montant: 120000, Procedure: "AO restreint", Echeance: "2026-03-20", Statut: "alerte", Priorite: "critique", Charge: 20, Notes: "Dossier incomplet — relance fournisseur"},
			{TenantID: org.ID, Reference: "M2026-034", Objet: "Nettoyage et entretien des locaux", Service: "DPAT", Montant: 45000, Procedure: "Accord-cadre", Echeance: "2026-05-01", Statut: "en_cours", Priorite: "normale", Charge: 8, Notes: "Accord-cadre mono-attributaire 2 ans"},
			{TenantID: org.ID, Reference: "M2026-045", Objet: "Logiciels métiers et licences", Service: "DSI", Montant: 250000, Procedure: "AO ouvert", Echeance: "2026-06-30", Statut: "planifie", Priorite: "haute", Charge: 25, Notes: "Digitalisation des services — projet stratégique"},
			{TenantID: org.ID, Reference: "M2026-056", Objet: "Formation des agents — plan 2026", Service: "DRH", Montant: 22000, Procedure: "MAPA", Echeance: "2026-04-30", Statut: "en_cours", Priorite: "normale", Charge: 6, Notes: "Formation obligatoire + développement compétences"},
			{TenantID: org.ID, Reference: "M2026-061", Objet: "Travaux de voirie — secteur Nord", Service: "DT", Montant: 380000, Procedure: "AO ouvert", Echeance: "2026-03-25", Statut: "alerte", Priorite: "critique", Charge: 30, Notes: "Délai serré — lancement travaux prévu mai 2026"},
			{TenantID: org.ID, Reference: "M2026-072", Objet: "Fournitures médicales et matériel de soins", Service: "DS", Montant: 18000, Procedure: "MAPA", Echeance: "2026-02-28", Statut: "termine", Priorite: "normale", Charge: 5, Notes: "Marché exécuté — clôture administrative"},
		}
		for i := range marches {
			db.Create(&marches[i])
		}
		fmt.Printf("✓ %d marchés publics seeded\n", len(marches))
	} else {
		fmt.Println("✓ Marchés already seeded — skipping")
	}

	// ── Nomenclature ──────────────────────────────────────
	var nomCount int64
	db.Model(&nomenclaturemod.NomenclatureNode{}).Where("tenant_id = ?", org.ID).Count(&nomCount)
	if nomCount == 0 {
		// Familles (racines)
		fam1 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "01", Label: "Fournitures et équipements", Type: "famille", Montant: 147500, Seuil: 0, Conforme: true}
		fam2 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "02", Label: "Prestations intellectuelles", Type: "famille", Montant: 40000, Seuil: 0, Conforme: true}
		fam3 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "03", Label: "Travaux", Type: "famille", Montant: 380000, Seuil: 0, Conforme: true}
		fam4 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "04", Label: "Services courants", Type: "famille", Montant: 130000, Seuil: 0, Conforme: true}
		db.Create(&fam1)
		db.Create(&fam2)
		db.Create(&fam3)
		db.Create(&fam4)

		// Sous-familles
		sf1 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "01.01", Label: "Fournitures bureautiques", Type: "sous-famille", ParentID: &fam1.ID, Montant: 20500, Seuil: 0, Conforme: true}
		sf2 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "01.02", Label: "Équipements informatiques", Type: "sous-famille", ParentID: &fam1.ID, Montant: 127000, Seuil: 0, Conforme: true}
		sf3 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "02.01", Label: "Conseils et études", Type: "sous-famille", ParentID: &fam2.ID, Montant: 18000, Seuil: 0, Conforme: true}
		sf4 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "02.02", Label: "Formations professionnelles", Type: "sous-famille", ParentID: &fam2.ID, Montant: 22000, Seuil: 0, Conforme: true}
		sf5 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "03.01", Label: "Bâtiments et génie civil", Type: "sous-famille", ParentID: &fam3.ID, Montant: 0, Seuil: 0, Conforme: true}
		sf6 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "03.02", Label: "Voirie et réseaux divers", Type: "sous-famille", ParentID: &fam3.ID, Montant: 380000, Seuil: 0, Conforme: true}
		sf7 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "04.01", Label: "Nettoyage et entretien", Type: "sous-famille", ParentID: &fam4.ID, Montant: 45000, Seuil: 0, Conforme: true}
		sf8 := nomenclaturemod.NomenclatureNode{TenantID: org.ID, Code: "04.02", Label: "Maintenance", Type: "sous-famille", ParentID: &fam4.ID, Montant: 85000, Seuil: 0, Conforme: true}
		db.Create(&sf1)
		db.Create(&sf2)
		db.Create(&sf3)
		db.Create(&sf4)
		db.Create(&sf5)
		db.Create(&sf6)
		db.Create(&sf7)
		db.Create(&sf8)

		// Codes feuilles
		codes := []nomenclaturemod.NomenclatureNode{
			{TenantID: org.ID, Code: "01.01.01", Label: "Papier et consommables", Type: "code", ParentID: &sf1.ID, Montant: 8500, Seuil: 40000, Conforme: true},
			{TenantID: org.ID, Code: "01.01.02", Label: "Mobilier de bureau", Type: "code", ParentID: &sf1.ID, Montant: 12000, Seuil: 40000, Conforme: true},
			{TenantID: org.ID, Code: "01.02.01", Label: "Matériel informatique", Type: "code", ParentID: &sf2.ID, Montant: 85000, Seuil: 90000, Conforme: true},
			{TenantID: org.ID, Code: "01.02.02", Label: "Logiciels et licences", Type: "code", ParentID: &sf2.ID, Montant: 42000, Seuil: 40000, Conforme: false},
			{TenantID: org.ID, Code: "02.01.01", Label: "Études et conseils juridiques", Type: "code", ParentID: &sf3.ID, Montant: 18000, Seuil: 40000, Conforme: true},
			{TenantID: org.ID, Code: "02.02.01", Label: "Formations professionnelles réglementées", Type: "code", ParentID: &sf4.ID, Montant: 22000, Seuil: 40000, Conforme: true},
			{TenantID: org.ID, Code: "03.02.01", Label: "Travaux de voirie communale", Type: "code", ParentID: &sf6.ID, Montant: 380000, Seuil: 5382000, Conforme: true},
			{TenantID: org.ID, Code: "04.02.01", Label: "Maintenance systèmes informatiques", Type: "code", ParentID: &sf8.ID, Montant: 85000, Seuil: 90000, Conforme: true},
		}
		for i := range codes {
			db.Create(&codes[i])
		}
		fmt.Printf("✓ %d nomenclature nodes seeded\n", 4+8+len(codes))
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
	purchaseOrders := []procurementmod.PurchaseOrder{
		{TenantID: org.ID, Number: "BC-2026-001", Status: "received", OrderDate: "2026-01-10", DeliveryDate: "2026-01-20", Currency: "EUR", Subtotal: 15625, TaxAmount: 3125, Total: 18750, Notes: "15 laptops Dell Latitude 5540", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-002", Status: "received", OrderDate: "2026-01-25", DeliveryDate: "2026-02-05", Currency: "EUR", Subtotal: 4500, TaxAmount: 900, Total: 5400, Notes: "Licences Adobe Suite — 10 postes", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-003", Status: "sent", OrderDate: "2026-02-20", DeliveryDate: "2026-03-15", Currency: "EUR", Subtotal: 3500, TaxAmount: 700, Total: 4200, Notes: "Hébergement cloud OVH — Q2 2026", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-004", Status: "draft", OrderDate: "2026-03-05", DeliveryDate: "2026-04-05", Currency: "EUR", Subtotal: 7083.33, TaxAmount: 1416.67, Total: 8500, Notes: "Serveur Dell PowerEdge R750 — Datacenter", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-005", Status: "sent", OrderDate: "2026-03-08", DeliveryDate: "2026-03-22", Currency: "EUR", Subtotal: 1000, TaxAmount: 200, Total: 1200, Notes: "NAS Synology DS923+ — Backup local", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2025-048", Status: "received", OrderDate: "2025-11-15", DeliveryDate: "2025-12-01", Currency: "EUR", Subtotal: 8333.33, TaxAmount: 1666.67, Total: 10000, Notes: "Mobilier bureaux — 8 postes de travail", CreatedBy: admin.ID},
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

	// ── Purchase Order items ──────────────────────────────
	poItems := []procurementmod.PurchaseOrderItem{
		{OrderID: purchaseOrders[0].ID, Description: "Dell Latitude 5540 i7/16GB/512GB", Quantity: 15, UnitPrice: 980, Total: 14700},
		{OrderID: purchaseOrders[0].ID, Description: "Souris et claviers sans fil", Quantity: 15, UnitPrice: 62, Total: 930},
		{OrderID: purchaseOrders[1].ID, Description: "Adobe Creative Cloud Business — 1 an", Quantity: 10, UnitPrice: 540, Total: 5400},
		{OrderID: purchaseOrders[2].ID, Description: "OVH Hosted Private Cloud — 6 mois", Quantity: 1, UnitPrice: 3500, Total: 3500},
		{OrderID: purchaseOrders[3].ID, Description: "Dell PowerEdge R750 — 64GB/4TB NVMe", Quantity: 1, UnitPrice: 6200, Total: 6200},
		{OrderID: purchaseOrders[3].ID, Description: "Garantie étendue 3 ans on-site", Quantity: 1, UnitPrice: 883.33, Total: 883.33},
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
