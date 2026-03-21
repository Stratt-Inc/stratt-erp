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

	// ── CRM: Contacts — fournisseurs titulaires + partenaires institutionnels ──
	contacts := []crmmod.Contact{
		// [0] Fournisseurs titulaires de marchés
		{TenantID: org.ID, Type: "company", FirstName: "Direction", LastName: "Régionale", Company: "Sodexo France SAS", Email: "marches-publics@sodexo.com", Phone: "+33 1 30 85 75 00", Address: "255 quai de la Bataille de Stalingrad, 92130 Issy-les-Moulineaux", Tags: "fournisseur,restauration"},
		{TenantID: org.ID, Type: "company", FirstName: "Service", LastName: "Appels d'offres", Company: "Dell Technologies SAS", Email: "secteur-public@dell.com", Phone: "+33 1 55 94 71 00", Address: "1 rond-point Benjamin Franklin, 34000 Montpellier", Tags: "fournisseur,informatique"},
		{TenantID: org.ID, Type: "company", FirstName: "Agence", LastName: "Collectivités", Company: "Bouygues Énergie & Services", Email: "collectivites@bouygues-es.com", Phone: "+33 1 30 60 33 00", Address: "32 avenue Hoche, 75008 Paris", Tags: "fournisseur,maintenance,prioritaire"},
		{TenantID: org.ID, Type: "company", FirstName: "Direction", LastName: "Commerciale", Company: "Renault Trucks SAS", Email: "vehicules-pro@renault-trucks.com", Phone: "+33 4 72 96 40 00", Address: "99 route de Lyon, 69806 Saint-Priest", Tags: "fournisseur,vehicules"},
		{TenantID: org.ID, Type: "company", FirstName: "Secteur", LastName: "Public", Company: "ATALIAN Facility Management", Email: "secteurpublic@atalian.com", Phone: "+33 1 41 38 10 00", Address: "Tour Arago — 5 rue Bellini, 92806 Puteaux", Tags: "fournisseur,gardiennage,entretien"},
		{TenantID: org.ID, Type: "company", FirstName: "Direction", LastName: "Souscription", Company: "SMACL Assurances", Email: "collectivites@smacl.fr", Phone: "+33 5 49 77 80 00", Address: "141 avenue Salvador-Allende, 79000 Niort", Tags: "fournisseur,assurances"},
		{TenantID: org.ID, Type: "company", FirstName: "Responsable", LastName: "Marché", Company: "SEPUR SAS", Email: "dechets@sepur.fr", Phone: "+33 1 34 48 50 00", Address: "19 rue du Maréchal Joffre, 78000 Versailles", Tags: "fournisseur,dechets"},
		{TenantID: org.ID, Type: "company", FirstName: "Pôle", LastName: "Collectivités", Company: "Antea Group", Email: "collectivites@anteagroup.com", Phone: "+33 2 38 49 49 49", Address: "3 avenue Claude-Guillemin, 45000 Orléans", Tags: "fournisseur,etudes"},
		{TenantID: org.ID, Type: "company", FirstName: "Service", LastName: "Certification", Company: "Bureau Veritas Solutions", Email: "collectivites@bureauveritas.com", Phone: "+33 1 55 24 70 00", Address: "67-71 bd du Château, 92200 Neuilly-sur-Seine", Tags: "fournisseur,controle"},
		{TenantID: org.ID, Type: "company", FirstName: "Direction", LastName: "Territoriale", Company: "Veolia Eau — Compagnie Générale des Eaux", Email: "collectivites@veolia.com", Phone: "+33 1 71 75 00 00", Address: "21 rue La Boétie, 75008 Paris", Tags: "fournisseur,eau"},
		// [10] Partenaires institutionnels
		{TenantID: org.ID, Type: "company", FirstName: "Bureau", LastName: "de la Préfecture", Company: "Préfecture de l'Hérault", Email: "pref-marches@herault.gouv.fr", Phone: "+33 4 67 61 61 61", Address: "34 place des Martyrs de la Résistance, 34062 Montpellier", Tags: "partenaire,tutelle"},
		{TenantID: org.ID, Type: "company", FirstName: "Direction", LastName: "Générale", Company: "CA du Bassin de Thau", Email: "direction@agglo-thau.fr", Phone: "+33 4 67 46 47 48", Address: "17 rue du Président Wilson, 34110 Frontignan", Tags: "partenaire,epci"},
		{TenantID: org.ID, Type: "company", FirstName: "Groupement", LastName: "Territorial", Company: "SDIS 34 — Service Départemental Incendie", Email: "dg@sdis34.fr", Phone: "+33 4 67 64 10 00", Address: "435 rue de la Croix-Verte, 34000 Montpellier", Tags: "partenaire,securite"},
		{TenantID: org.ID, Type: "company", FirstName: "Direction", LastName: "des Finances", Company: "Conseil Régional Occitanie", Email: "subventions@laregion.fr", Phone: "+33 4 67 22 80 00", Address: "22 rue Mas Sargon, 34977 Montpellier Cedex 9", Tags: "partenaire,financement"},
		{TenantID: org.ID, Type: "company", FirstName: "Service", LastName: "Courrier", Company: "La Poste — Services Courrier Entreprise", Email: "collectivites@laposte.fr", Phone: "+33 36 31", Address: "Place Alphonse Jourdain, 31000 Toulouse", Tags: "fournisseur,courrier"},
	}
	for i := range contacts {
		db.Create(&contacts[i])
	}
	fmt.Printf("✓ %d contacts seeded\n", len(contacts))

	// ── CRM: Leads — consultations préliminaires de marché ────────────────────
	leads := []crmmod.Lead{
		{TenantID: org.ID, Title: "Consultation préliminaire — restauration scolaire 2027", Status: "qualified", Source: "Planification budgétaire", Value: 420000, Notes: "RFI auprès de 6 opérateurs — résultats attendus fin avril 2026"},
		{TenantID: org.ID, Title: "Sourcing — système de vidéoprotection urbaine", Status: "contacted", Source: "Conseil municipal — délibération 2025-112", Value: 185000, Notes: "Consultation de 4 intégrateurs — cahier des charges en cours"},
		{TenantID: org.ID, Title: "AMI — réhabilitation énergétique groupe scolaire Jean Jaurès", Status: "new", Source: "Plan Rénovation Énergétique Régional", Value: 650000, Notes: "AMI ADEME — dossier subvention à déposer avant 30 juin 2026"},
		{TenantID: org.ID, Title: "Consultation — marché carburant flotte 2027-2029", Status: "qualified", Source: "Renouvellement accord-cadre", Value: 95000, Notes: "Groupement de commandes avec 3 communes voisines envisagé"},
		{TenantID: org.ID, Title: "Sourcing — logiciel gestion espaces verts", Status: "contacted", Source: "Benchmark AMAP", Value: 28000, Notes: "Démonstrations planifiées — 3 éditeurs identifiés"},
		{TenantID: org.ID, Title: "Étude faisabilité — extension réseau fibre noire", Status: "new", Source: "Schéma directeur numérique", Value: 0, Notes: "Étude confiée à Antea Group — résultats attendus T3 2026"},
		{TenantID: org.ID, Title: "Consultation — déchets verts et compostage", Status: "lost", Source: "CA du Bassin de Thau", Value: 55000, Notes: "Mutualisé au niveau intercommunal — abandon procédure propre"},
		{TenantID: org.ID, Title: "Renouvellement — marché impression reprographie", Status: "qualified", Source: "Échéance contrat", Value: 32000, Notes: "Contrat actuel expire sept. 2026 — lancement MAPA prévu mai"},
	}
	for i := range leads {
		db.Create(&leads[i])
	}
	fmt.Printf("✓ %d leads seeded\n", len(leads))

	// ── CRM: Deals ────────────────────────────────────────
	// ── CRM: Deals — conventions de partenariat et subventions ───────────────
	exp1 := "2026-06-30"
	exp2 := "2026-12-31"
	exp3 := "2026-09-01"
	exp4 := "2026-04-15"
	deals := []crmmod.Deal{
		{TenantID: org.ID, Title: "Convention mutualisation DSI — CA du Bassin de Thau", Stage: "closed_won", Value: 85000, Currency: "EUR", Probability: 100, ExpectedAt: &exp2, Notes: "Convention signée — mise à disposition 0,5 ETP + infrastructure partagée"},
		{TenantID: org.ID, Title: "Subvention Région Occitanie — réhabilitation école Jean Jaurès", Stage: "negotiation", Value: 195000, Currency: "EUR", Probability: 75, ExpectedAt: &exp1, Notes: "Dossier déposé — instruction en cours, décision attendue T2 2026"},
		{TenantID: org.ID, Title: "DETR 2026 — voirie secteur Nord-Est (DT-VRD)", Stage: "proposal", Value: 104000, Currency: "EUR", Probability: 60, ExpectedAt: &exp3, Notes: "20 % du montant éligible — délibération adoptée le 18/02/2026"},
		{TenantID: org.ID, Title: "Convention SDIS 34 — premier secours et prévention", Stage: "closed_won", Value: 0, Currency: "EUR", Probability: 100, ExpectedAt: &exp2, Notes: "Renouvellement annuel — convention opérationnelle signée"},
		{TenantID: org.ID, Title: "Fonds Vert — rénovation éclairage public LED", Stage: "prospecting", Value: 62000, Currency: "EUR", Probability: 40, ExpectedAt: &exp1, Notes: "Pré-dossier soumis ANCT — éligibilité à confirmer"},
		{TenantID: org.ID, Title: "Accord-cadre La Poste — collecte et affranchissement 2026-2027", Stage: "closed_won", Value: 18500, Currency: "EUR", Probability: 100, ExpectedAt: &exp4, Notes: "Contrat annuel reconductible — tarifs préférentiels collectivités"},
	}
	for i := range deals {
		db.Create(&deals[i])
	}
	fmt.Printf("✓ %d deals seeded\n", len(deals))

	// ── Accounting: Comptes M57 ───────────────────────────
	accounts := []accountingmod.Account{
		{TenantID: org.ID, Code: "512100", Name: "Compte courant — Trésorerie municipale", Type: "asset", Currency: "EUR", Balance: 1842750.00, IsActive: true},
		{TenantID: org.ID, Code: "411100", Name: "Redevables — Titres de recettes émis", Type: "asset", Currency: "EUR", Balance: 148320.00, IsActive: true},
		{TenantID: org.ID, Code: "401100", Name: "Fournisseurs — Mandats en attente de paiement", Type: "liability", Currency: "EUR", Balance: -385640.00, IsActive: true},
		{TenantID: org.ID, Code: "70611", Name: "Produits des services — Cantine scolaire", Type: "revenue", Currency: "EUR", Balance: 124800.00, IsActive: true},
		{TenantID: org.ID, Code: "60611", Name: "Chap. 011 — Achats et charges à caractère général", Type: "expense", Currency: "EUR", Balance: -892400.00, IsActive: true},
		{TenantID: org.ID, Code: "641100", Name: "Chap. 012 — Rémunérations du personnel titulaire", Type: "expense", Currency: "EUR", Balance: -2184000.00, IsActive: true},
		{TenantID: org.ID, Code: "74111", Name: "DGF — Dotation globale de fonctionnement", Type: "revenue", Currency: "EUR", Balance: 3250000.00, IsActive: true},
		{TenantID: org.ID, Code: "7067", Name: "Redevances et droits de place — Domaine public", Type: "revenue", Currency: "EUR", Balance: 58400.00, IsActive: true},
	}
	for i := range accounts {
		db.Create(&accounts[i])
	}
	fmt.Printf("✓ %d accounting accounts seeded\n", len(accounts))

	// ── Accounting: Mandats et recettes M57 ───────────────
	transactions := []accountingmod.Transaction{
		{TenantID: org.ID, AccountID: accounts[4].ID, Reference: "MDP-2026-0142", Description: "Mandat — Sodexo France / Restauration scolaire jan. 2026", Amount: 31500, Type: "debit", Date: "2026-01-31", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[4].ID, Reference: "MDP-2026-0156", Description: "Mandat — EDF Collectivités / Électricité bâtiments T1 2026", Amount: 14820, Type: "debit", Date: "2026-02-05", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[6].ID, Reference: "REC-2026-0031", Description: "Recette — DGF versement mensuel janvier 2026", Amount: 270833, Type: "credit", Date: "2026-01-15", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[3].ID, Reference: "REC-2026-0044", Description: "Recette — Cantine scolaire, participation familles jan. 2026", Amount: 10400, Type: "credit", Date: "2026-01-31", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[5].ID, Reference: "MDP-2026-0178", Description: "Mandat — Paie agents titulaires + contractuels jan. 2026", Amount: 182000, Type: "debit", Date: "2026-01-28", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[7].ID, Reference: "REC-2026-0058", Description: "Recette — Droits de place marché hebdomadaire jan. 2026", Amount: 3840, Type: "credit", Date: "2026-02-01", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[4].ID, Reference: "MDP-2026-0201", Description: "Mandat — Bouygues É&S / Maintenance préventive jan. 2026", Amount: 17500, Type: "debit", Date: "2026-02-10", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[1].ID, Reference: "REC-2026-0072", Description: "Recette — Location locaux commerciaux — rue du Commerce", Amount: 5200, Type: "credit", Date: "2026-02-05", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[4].ID, Reference: "MDP-2026-0215", Description: "Mandat — Veolia Eau / Eau potable et assainissement T1", Amount: 22400, Type: "debit", Date: "2026-02-15", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[6].ID, Reference: "REC-2026-0088", Description: "Recette — DETR 2025 — solde versement Préfecture", Amount: 95000, Type: "credit", Date: "2026-02-20", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[4].ID, Reference: "MDP-2026-0244", Description: "Mandat — Dell Technologies / Lot 1 matériel informatique", Amount: 67500, Type: "debit", Date: "2026-02-28", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[6].ID, Reference: "REC-2026-0101", Description: "Recette — DGF versement mensuel février 2026", Amount: 270833, Type: "credit", Date: "2026-02-15", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[4].ID, Reference: "MDP-2026-0267", Description: "Mandat — SEPUR / Collecte déchets ménagers jan.-fév. 2026", Amount: 28600, Type: "debit", Date: "2026-03-05", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[7].ID, Reference: "REC-2026-0112", Description: "Recette — Droits de voirie, travaux riverains T1 2026", Amount: 4200, Type: "credit", Date: "2026-03-10", CreatedBy: admin.ID},
		{TenantID: org.ID, AccountID: accounts[5].ID, Reference: "MDP-2026-0289", Description: "Mandat — Paie agents titulaires + contractuels fév. 2026", Amount: 182000, Type: "debit", Date: "2026-02-27", CreatedBy: admin.ID},
	}
	for i := range transactions {
		db.Create(&transactions[i])
	}
	fmt.Printf("✓ %d transactions seeded\n", len(transactions))

	// ── Billing: Titres de recettes ───────────────────────
	// Modèle Facture utilisé pour les titres de recettes communaux
	invoices := []billingmod.Invoice{
		{TenantID: org.ID, Number: "TR-2026-0101", Status: "paid", IssueDate: "2026-01-05", DueDate: "2026-01-31", Currency: "EUR", Subtotal: 1200, TaxRate: 0, TaxAmount: 0, Total: 1200, Notes: "Location salle polyvalente — Assoc. Les Amis du Patrimoine (12 séances jan.)", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0102", Status: "paid", IssueDate: "2026-01-31", DueDate: "2026-02-15", Currency: "EUR", Subtotal: 3840, TaxRate: 0, TaxAmount: 0, Total: 3840, Notes: "Droits de place — Marché hebdomadaire janvier 2026 (1 280 emplacements × 3 €)", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0103", Status: "paid", IssueDate: "2026-01-31", DueDate: "2026-02-15", Currency: "EUR", Subtotal: 10400, TaxRate: 0, TaxAmount: 0, Total: 10400, Notes: "Cantine scolaire — Participation familles janvier 2026 (520 élèves × 20 €)", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0104", Status: "paid", IssueDate: "2026-01-15", DueDate: "2026-02-05", Currency: "EUR", Subtotal: 960, TaxRate: 0, TaxAmount: 0, Total: 960, Notes: "Location terrain de football synthétique — AS Saint-Germain (jan.–mars)", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0105", Status: "paid", IssueDate: "2026-02-01", DueDate: "2026-03-01", Currency: "EUR", Subtotal: 1820, TaxRate: 0, TaxAmount: 0, Total: 1820, Notes: "Concession funéraire 30 ans — Emplacement A-147, Cimetière municipal", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0106", Status: "sent", IssueDate: "2026-03-01", DueDate: "2026-03-31", Currency: "EUR", Subtotal: 1680, TaxRate: 0, TaxAmount: 0, Total: 1680, Notes: "Redevance d'occupation domaine public — Terrasse Café de la Mairie (trim. 1)", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0107", Status: "paid", IssueDate: "2026-01-01", DueDate: "2026-01-15", Currency: "EUR", Subtotal: 5400, TaxRate: 0, TaxAmount: 0, Total: 5400, Notes: "Loyer logement communal — 12 rue des Lilas (agent contractuel DSI)", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0108", Status: "paid", IssueDate: "2026-02-15", DueDate: "2026-03-15", Currency: "EUR", Subtotal: 4200, TaxRate: 0, TaxAmount: 0, Total: 4200, Notes: "Participation riverains — Travaux trottoir avenue de la Gare (quote-part légale)", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0109", Status: "sent", IssueDate: "2026-03-01", DueDate: "2026-03-31", Currency: "EUR", Subtotal: 720, TaxRate: 0, TaxAmount: 0, Total: 720, Notes: "Location gymnase municipal — Club de handball (mars 2026, 12 créneaux)", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "TR-2026-0110", Status: "overdue", IssueDate: "2026-01-20", DueDate: "2026-02-20", Currency: "EUR", Subtotal: 3500, TaxRate: 0, TaxAmount: 0, Total: 3500, Notes: "Cession matériel communal réformé — 2 tracteurs tondeuses (délibération 2025-148)", CreatedBy: admin.ID},
	}
	for i := range invoices {
		db.Create(&invoices[i])
	}
	fmt.Printf("✓ %d invoices seeded\n", len(invoices))

	// ── Inventory: Catalogue stocks commune ───────────────
	products := []inventorymod.Product{
		{TenantID: org.ID, SKU: "PAP-A4-80G", Name: "Papier reprographique A4 80g", Description: "Ramette 500 feuilles, qualité standard administration", Category: "Fournitures administratives", UnitPrice: 5.20, CostPrice: 4.10, Stock: 480, ReorderAt: 100, Unit: "ramette", IsActive: true},
		{TenantID: org.ID, SKU: "SEL-DENEIG", Name: "Sel de déneigement — chlorure de sodium", Description: "Sac 25 kg, stockage cave technique sous la mairie", Category: "Voirie", UnitPrice: 18.50, CostPrice: 14.20, Stock: 85, ReorderAt: 30, Unit: "sac 25 kg", IsActive: true},
		{TenantID: org.ID, SKU: "ENR-FROID-25", Name: "Enrobé à froid — réparations ponctuelles", Description: "Sac 25 kg, réparations nids de poule et bordures", Category: "Voirie", UnitPrice: 22.00, CostPrice: 17.50, Stock: 120, ReorderAt: 40, Unit: "sac 25 kg", IsActive: true},
		{TenantID: org.ID, SKU: "EPI-GILET-HV", Name: "Gilet haute-visibilité classe 3", Description: "Taille universelle, marquage commune obligatoire", Category: "EPI", UnitPrice: 12.80, CostPrice: 8.50, Stock: 62, ReorderAt: 20, Unit: "unité", IsActive: true},
		{TenantID: org.ID, SKU: "MEN-CONC-5L", Name: "Nettoyant multi-surfaces concentré", Description: "Bidon 5L, usage professionnel bâtiments communaux", Category: "Entretien", UnitPrice: 14.90, CostPrice: 9.80, Stock: 38, ReorderAt: 12, Unit: "bidon 5L", IsActive: true},
		{TenantID: org.ID, SKU: "TON-HP-414A", Name: "Toner HP 414A — couleur cyan", Description: "Cartouche originale, parc imprimantes HP Color Pro", Category: "Consommables IT", UnitPrice: 68.00, CostPrice: 52.00, Stock: 18, ReorderAt: 6, Unit: "cartouche", IsActive: true},
		{TenantID: org.ID, SKU: "GAZ-NATUREL", Name: "Gazon naturel — rouleau de 1 m²", Description: "Gazon naturel en rouleau, espaces verts et parcs", Category: "Espaces verts", UnitPrice: 8.50, CostPrice: 6.20, Stock: 200, ReorderAt: 50, Unit: "rouleau 1 m²", IsActive: true},
		{TenantID: org.ID, SKU: "TER-ENRI-40L", Name: "Terreau enrichi universel", Description: "Sac 40 L, plantation massifs et jardinières municipales", Category: "Espaces verts", UnitPrice: 7.20, CostPrice: 5.40, Stock: 95, ReorderAt: 30, Unit: "sac 40L", IsActive: true},
		{TenantID: org.ID, SKU: "GRA-6-10", Name: "Gravier calibré 6/10", Description: "Tonne vrac, allées et parkings — livraison ateliers municipaux", Category: "Voirie", UnitPrice: 42.00, CostPrice: 31.00, Stock: 28, ReorderAt: 10, Unit: "tonne", IsActive: true},
		{TenantID: org.ID, SKU: "PAN-VOIE-B1", Name: "Panneau de signalisation B1 (Stop)", Description: "Panneau réglementaire routier, classe 2, mât non inclus", Category: "Voirie", UnitPrice: 48.50, CostPrice: 35.00, Stock: 14, ReorderAt: 5, Unit: "unité", IsActive: true},
		{TenantID: org.ID, SKU: "DES-SURF-5L", Name: "Désinfectant surfaces toutes zones", Description: "Bidon 5L virucide, bactéricide — gymnases et sanitaires", Category: "Entretien", UnitPrice: 19.80, CostPrice: 13.50, Stock: 45, ReorderAt: 15, Unit: "bidon 5L", IsActive: true},
		{TenantID: org.ID, SKU: "CAB-CAT6-305", Name: "Câble réseau Cat6 UTP — bobine 305 m", Description: "Câble réseau cuivre Cat6, bobine 305 m, DSI", Category: "Consommables IT", UnitPrice: 89.00, CostPrice: 65.00, Stock: 6, ReorderAt: 2, Unit: "bobine 305m", IsActive: true},
	}
	for i := range products {
		db.Create(&products[i])
	}
	fmt.Printf("✓ %d products seeded\n", len(products))

	// ── HR: Agents municipaux ─────────────────────────────
	employees := []hrmod.Employee{
		{TenantID: org.ID, FirstName: "Claire", LastName: "Fontaine", Email: "c.fontaine@mairie.fr", Phone: "+33 6 12 34 56 78", Department: "Direction Générale", JobTitle: "Directrice Générale des Services", HireDate: "2018-09-01", Salary: 62000, Status: "active"},
		{TenantID: org.ID, FirstName: "Bernard", LastName: "Leclerc", Email: "b.leclerc@mairie.fr", Phone: "+33 6 23 45 67 89", Department: "Ressources Humaines", JobTitle: "Directeur des Ressources Humaines", HireDate: "2015-04-15", Salary: 54000, Status: "active"},
		{TenantID: org.ID, FirstName: "Sylvie", LastName: "Morin", Email: "s.morin@mairie.fr", Phone: "+33 6 34 56 78 90", Department: "Numérique et SI", JobTitle: "Chargée de mission numérique et SI", HireDate: "2021-01-10", Salary: 45000, Status: "active"},
		{TenantID: org.ID, FirstName: "Éric", LastName: "Rousseau", Email: "e.rousseau@mairie.fr", Phone: "+33 6 45 67 89 01", Department: "Services Techniques", JobTitle: "Directeur des Services Techniques", HireDate: "2012-06-01", Salary: 57000, Status: "active"},
		{TenantID: org.ID, FirstName: "Nathalie", LastName: "Blanc", Email: "n.blanc@mairie.fr", Phone: "+33 6 56 78 90 12", Department: "Éducation et Jeunesse", JobTitle: "Responsable affaires scolaires et périscolaires", HireDate: "2019-08-26", Salary: 42000, Status: "active"},
		{TenantID: org.ID, FirstName: "Franck", LastName: "Girard", Email: "f.girard@mairie.fr", Phone: "+33 6 67 89 01 23", Department: "Service Achats", JobTitle: "Responsable marchés publics", HireDate: "2020-03-02", Salary: 48000, Status: "active"},
		{TenantID: org.ID, FirstName: "Isabelle", LastName: "Henry", Email: "i.henry@mairie.fr", Phone: "+33 6 78 90 12 34", Department: "Finances", JobTitle: "Gestionnaire budgétaire et comptable (M57)", HireDate: "2016-11-14", Salary: 44000, Status: "active"},
		{TenantID: org.ID, FirstName: "Mohamed", LastName: "Diallo", Email: "m.diallo@mairie.fr", Phone: "+33 6 89 01 23 45", Department: "Services Techniques", JobTitle: "Chef d'équipe voirie et réseaux divers", HireDate: "2014-05-19", Salary: 36000, Status: "on_leave"},
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

	// ── Procurement: Purchase Orders — avec fournisseurs liés ────────────────
	// SupplierID référence les contacts (fournisseurs titulaires)
	// contacts: [0]=Sodexo [1]=Dell [2]=Bouygues [3]=Renault [4]=ATALIAN [7]=Antea
	purchaseOrders := []procurementmod.PurchaseOrder{
		// Matériel informatique (F16) — Dell Technologies [1]
		{TenantID: org.ID, Number: "BC-2026-001", SupplierID: &contacts[1].ID, Status: "received", OrderDate: "2026-01-10", DeliveryDate: "2026-01-20", Currency: "EUR", Subtotal: 56250, TaxAmount: 11250, Total: 67500, Notes: "Lot 1 renouvellement parc informatique — 45 postes", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-002", SupplierID: &contacts[1].ID, Status: "received", OrderDate: "2026-01-28", DeliveryDate: "2026-02-15", Currency: "EUR", Subtotal: 35833, TaxAmount: 7167, Total: 43000, Notes: "Lot 2 — serveurs et équipements réseau DSI", CreatedBy: admin.ID},
		// Logiciels et licences (F16/S62) — Dell [1] (titulaire accord-cadre)
		{TenantID: org.ID, Number: "BC-2026-003", SupplierID: &contacts[1].ID, Status: "received", OrderDate: "2026-01-25", DeliveryDate: "2026-02-05", Currency: "EUR", Subtotal: 89167, TaxAmount: 17833, Total: 107000, Notes: "Licences logiciels métiers — suite bureautique + ERP + BI", CreatedBy: admin.ID},
		// Services informatiques TMA (S62) — Bouygues É&S [2]
		{TenantID: org.ID, Number: "BC-2026-004", SupplierID: &contacts[2].ID, Status: "sent", OrderDate: "2026-02-01", DeliveryDate: "2026-03-31", Currency: "EUR", Subtotal: 62500, TaxAmount: 12500, Total: 75000, Notes: "TMA et infogérance réseau — Q1/Q2 2026", CreatedBy: admin.ID},
		// Maintenance bâtiments (S61) — Bouygues É&S [2]
		{TenantID: org.ID, Number: "BC-2026-005", SupplierID: &contacts[2].ID, Status: "received", OrderDate: "2026-01-05", DeliveryDate: "2026-01-31", Currency: "EUR", Subtotal: 29167, TaxAmount: 5833, Total: 35000, Notes: "Maintenance préventive — lot plomberie/CVC hiver 2026", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-006", SupplierID: &contacts[2].ID, Status: "received", OrderDate: "2026-02-10", DeliveryDate: "2026-02-28", Currency: "EUR", Subtotal: 20833, TaxAmount: 4167, Total: 25000, Notes: "Maintenance électricité bâtiments communaux — T1 2026", CreatedBy: admin.ID},
		// Denrées alimentaires (F10) — Sodexo [0]
		{TenantID: org.ID, Number: "BC-2026-007", SupplierID: &contacts[0].ID, Status: "received", OrderDate: "2026-01-02", DeliveryDate: "2026-01-08", Currency: "EUR", Subtotal: 14167, TaxAmount: 2833, Total: 17000, Notes: "Lot fruits et légumes frais — janvier/février 2026", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-008", SupplierID: &contacts[0].ID, Status: "received", OrderDate: "2026-02-03", DeliveryDate: "2026-02-10", Currency: "EUR", Subtotal: 11667, TaxAmount: 2333, Total: 14000, Notes: "Produits laitiers et viandes — restauration scolaire", CreatedBy: admin.ID},
		// Fournitures administratives (F11) — La Poste [14]
		{TenantID: org.ID, Number: "BC-2026-009", SupplierID: &contacts[14].ID, Status: "received", OrderDate: "2026-01-15", DeliveryDate: "2026-01-22", Currency: "EUR", Subtotal: 7083, TaxAmount: 1417, Total: 8500, Notes: "Fournitures de bureau T1 — papier, cartouches, enveloppes", CreatedBy: admin.ID},
		// Produits entretien (F13) — ATALIAN [4]
		{TenantID: org.ID, Number: "BC-2026-010", SupplierID: &contacts[4].ID, Status: "received", OrderDate: "2026-02-15", DeliveryDate: "2026-02-25", Currency: "EUR", Subtotal: 12500, TaxAmount: 2500, Total: 15000, Notes: "Produits ménagers et d'entretien — stock trimestriel", CreatedBy: admin.ID},
		// Véhicules (F18) — Renault Trucks [3]
		{TenantID: org.ID, Number: "BC-2026-011", SupplierID: &contacts[3].ID, Status: "draft", OrderDate: "2026-03-01", DeliveryDate: "2026-06-30", Currency: "EUR", Subtotal: 145833, TaxAmount: 29167, Total: 175000, Notes: "Lot 1 véhicules légers — 7 Renault Kangoo E-Tech", CreatedBy: admin.ID},
		{TenantID: org.ID, Number: "BC-2026-012", SupplierID: &contacts[3].ID, Status: "draft", OrderDate: "2026-03-01", DeliveryDate: "2026-07-15", Currency: "EUR", Subtotal: 103333, TaxAmount: 20667, Total: 124000, Notes: "Lot 2 utilitaires — 3 Renault Master + équipements", CreatedBy: admin.ID},
		// Gardiennage / Sécurité (S63) — ATALIAN [4]
		{TenantID: org.ID, Number: "BC-2026-013", SupplierID: &contacts[4].ID, Status: "received", OrderDate: "2026-01-02", DeliveryDate: "2026-01-31", Currency: "EUR", Subtotal: 13750, TaxAmount: 2750, Total: 16500, Notes: "Surveillance bâtiments municipaux — janvier 2026", CreatedBy: admin.ID},
		// Formation (S66) — Bureau Veritas [8]
		{TenantID: org.ID, Number: "BC-2026-014", SupplierID: &contacts[8].ID, Status: "received", OrderDate: "2026-02-05", DeliveryDate: "2026-03-28", Currency: "EUR", Subtotal: 10000, TaxAmount: 2000, Total: 12000, Notes: "Formations habilitations électriques + secourisme — 40 agents", CreatedBy: admin.ID},
		// Mobilier (F17) — (pas de contact dédié)
		{TenantID: org.ID, Number: "BC-2025-048", Status: "received", OrderDate: "2025-11-15", DeliveryDate: "2025-12-15", Currency: "EUR", Subtotal: 25000, TaxAmount: 5000, Total: 30000, Notes: "Mobilier bureaux — réaménagement 2e étage", CreatedBy: admin.ID},
		// Espaces verts (F19) — (approvisionnement direct fournisseur local)
		{TenantID: org.ID, Number: "BC-2026-015", Status: "received", OrderDate: "2026-02-20", DeliveryDate: "2026-03-10", Currency: "EUR", Subtotal: 10833, TaxAmount: 2167, Total: 13000, Notes: "Tondeuses tractées + équipements taille-haie — printemps 2026", CreatedBy: admin.ID},
		// Fournitures techniques (F15) — (fournisseur local)
		{TenantID: org.ID, Number: "BC-2026-016", Status: "received", OrderDate: "2026-01-20", DeliveryDate: "2026-02-05", Currency: "EUR", Subtotal: 16667, TaxAmount: 3333, Total: 20000, Notes: "Pièces détachées et outillage — ateliers municipaux T1", CreatedBy: admin.ID},
		// EPI / Sécurité (F14)
		{TenantID: org.ID, Number: "BC-2026-017", Status: "sent", OrderDate: "2026-03-05", DeliveryDate: "2026-04-15", Currency: "EUR", Subtotal: 14167, TaxAmount: 2833, Total: 17000, Notes: "EPI agents voirie — chaussures, gilets, gants — renouvellement", CreatedBy: admin.ID},
		// Études et conseil (S68) — Antea Group [7]
		{TenantID: org.ID, Number: "BC-2026-018", SupplierID: &contacts[7].ID, Status: "sent", OrderDate: "2026-03-10", DeliveryDate: "2026-06-30", Currency: "EUR", Subtotal: 37500, TaxAmount: 7500, Total: 45000, Notes: "Mission AMO schéma directeur numérique — phase 1/3", CreatedBy: admin.ID},
	}
	for i := range purchaseOrders {
		db.Create(&purchaseOrders[i])
	}
	fmt.Printf("✓ %d purchase orders seeded\n", len(purchaseOrders))

	// ── Invoice items (lignes de titres de recettes) ──────
	invoiceItems := []billingmod.InvoiceItem{
		// TR-2026-0101 Location salle polyvalente
		{InvoiceID: invoices[0].ID, Description: "Location salle polyvalente — week-end 22–23 mars 2026", Quantity: 1, UnitPrice: 350, Total: 350},
		{InvoiceID: invoices[0].ID, Description: "Forfait ménage et remise en état", Quantity: 1, UnitPrice: 80, Total: 80},
		// TR-2026-0102 Droits de place marché
		{InvoiceID: invoices[1].ID, Description: "Droits de place marché hebdomadaire — mars 2026 (4 semaines)", Quantity: 4, UnitPrice: 540, Total: 2160},
		{InvoiceID: invoices[1].ID, Description: "Emplacements spéciaux — marché de printemps", Quantity: 6, UnitPrice: 40, Total: 240},
		// TR-2026-0103 Cantine scolaire
		{InvoiceID: invoices[2].ID, Description: "Repas cantine scolaire — école élémentaire — mars 2026", Quantity: 380, UnitPrice: 3.50, Total: 1330},
		{InvoiceID: invoices[2].ID, Description: "Repas cantine scolaire — école maternelle — mars 2026", Quantity: 210, UnitPrice: 3.20, Total: 672},
		// TR-2026-0104 Location terrain football
		{InvoiceID: invoices[3].ID, Description: "Location terrain synthétique — Association Sportive Municipale", Quantity: 1, UnitPrice: 1200, Total: 1200},
		// TR-2026-0105 Concession funéraire
		{InvoiceID: invoices[4].ID, Description: "Concession funéraire 30 ans — cimetière communal", Quantity: 1, UnitPrice: 450, Total: 450},
		// TR-2026-0106 Redevance domaine public
		{InvoiceID: invoices[5].ID, Description: "Redevance occupation domaine public — terrasse restaurant", Quantity: 1, UnitPrice: 780, Total: 780},
		{InvoiceID: invoices[5].ID, Description: "Redevance occupation domaine public — kiosque presse", Quantity: 1, UnitPrice: 320, Total: 320},
		// TR-2026-0107 Loyer logement communal
		{InvoiceID: invoices[6].ID, Description: "Loyer logement de fonction — agent municipal — mars 2026", Quantity: 1, UnitPrice: 420, Total: 420},
		// TR-2026-0108 Participation riverains travaux
		{InvoiceID: invoices[7].ID, Description: "Participation riverain — raccordement réseau eaux pluviales", Quantity: 1, UnitPrice: 2400, Total: 2400},
		// TR-2026-0109 Location gymnase
		{InvoiceID: invoices[8].ID, Description: "Location gymnase municipal — club handball — mars 2026", Quantity: 1, UnitPrice: 380, Total: 380},
		// TR-2026-0110 Cession matériel réformé
		{InvoiceID: invoices[9].ID, Description: "Cession véhicule réformé — Renault Trafic 2018 — lot n°3", Quantity: 1, UnitPrice: 4800, Total: 4800},
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
	// products: [0]=Papier A4 [1]=Sel déneigement [2]=Enrobé froid [3]=Gilet HV
	//           [4]=Nettoyant concentré [5]=Toner HP [6]=Gazon [7]=Terreau
	//           [8]=Gravier [9]=Panneau B1 [10]=Désinfectant [11]=Câble Cat6
	stockMovements := []inventorymod.StockMovement{
		{TenantID: org.ID, ProductID: products[1].ID, Type: "in", Quantity: 200, Reference: "BC-2026-009", Notes: "Réception stock hivernal sel de déneigement", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[1].ID, Type: "out", Quantity: 85, Reference: "CONS-2026-02", Notes: "Consommation épisode gel — voirie nord-est", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[0].ID, Type: "in", Quantity: 50, Reference: "BC-2026-009", Notes: "Réapprovisionnement papier A4 — T1 2026", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[0].ID, Type: "out", Quantity: 18, Reference: "CONS-2026-01", Notes: "Distribution services administratifs — janvier/février", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[3].ID, Type: "in", Quantity: 50, Reference: "BC-2026-017", Notes: "Réception EPI agents voirie — gilets HV réglementaires", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[5].ID, Type: "in", Quantity: 20, Reference: "BC-2026-009", Notes: "Réception toners HP — parc imprimantes mairie", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[5].ID, Type: "out", Quantity: 7, Reference: "CONS-2026-03", Notes: "Distribution toners — services techniques et accueil", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[2].ID, Type: "in", Quantity: 30, Reference: "BC-2026-016", Notes: "Réception enrobé à froid — travaux voirie urgence", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[2].ID, Type: "out", Quantity: 12, Reference: "TRAV-2026-04", Notes: "Bouchage nids-de-poule — rue de la Paix + impasse des Lilas", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[9].ID, Type: "in", Quantity: 15, Reference: "BC-2026-016", Notes: "Réception panneaux signalisation B1 — renouvellement", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[9].ID, Type: "adjustment", Quantity: -2, Reference: "ADJ-2026-01", Notes: "Ajustement inventaire — panneaux endommagés (accident voirie)", CreatedBy: admin.ID},
		{TenantID: org.ID, ProductID: products[10].ID, Type: "in", Quantity: 40, Reference: "BC-2026-010", Notes: "Réapprovisionnement désinfectant — sanitaires bâtiments communaux", CreatedBy: admin.ID},
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
