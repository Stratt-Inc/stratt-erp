package main

import (
	"fmt"
	"strings"

	nomenclaturemod "github.com/stratt/backend/modules/nomenclature"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NomenclatureEntry is a national procurement nomenclature entry.
type NomenclatureEntry struct {
	FamilyNum   int
	FamilyLabel string
	Code        string
	Label       string
	Description string
	Tag         string // Fournitures | Services | Travaux
	CPVCode     string
}

// TravauxEntry is a CPV-sourced Travaux entry (source: CPV_secteurs_VF.xlsx).
type TravauxEntry struct {
	FamilyCode  string // T-BAT, T-VRD, etc.
	FamilyLabel string
	CPVCode     string
	Label       string
}

// NomenclatureNationale — ~175 leaf codes from nomenclature achats V1.
// Source: fichier "nomenclature achats V1.xlsx" (Stratt, 2026).
// Calibrated on UGAP / CPV / M57 families.
var NomenclatureNationale = []NomenclatureEntry{
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.01", Label: "Produits carnés réfrigérés", Description: "Viandes (faux filets, rôti de veau, escalopes…), abats de porc, volailles, escargots, grenouilles, graisses d'animaux brutes ou fondues, jambon, saucisson, pâté en croûte, pâté de campagne, poitrine salée, charcuterie crue ou cuite", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.02", Label: "Produits de la mer ou d'eau douce", Description: "Poissons entiers, en filets, en portions, poissons salés, fumés, séchés, poissons frais", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.03", Label: "Produits laitiers", Description: "Lait liquide, lait gélifiés, emprésurés, lait UHT, lait en poudre, crème, beurre, margarine, pâte à tartiner, fromages frais affinés entiers, portions, rapés, quenelles fraiches, Pates à dérouler, yaourts petits suisses et desserts lactés frais", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.04", Label: "Produits alimentaires frais", Description: "Fruits non surgelés, fruits frais, Légumes non surgelés, légumes frais, salades, pommes de terre, ail, oignons, échalotes, Produits laitiers, Herbes aromatiques, Betteraves sous vide", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.05", Label: "Produits surgelés de toute nature", Description: "Produits carnés surgelés ou congelés, Produits de la mer ou d'eau douce surgelés ou congelés, Fruits et légumes surgelés, desserts ou tout autre produit surgelé", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.06", Label: "Épicerie sèche", Description: "Pour petits-déjeuners, confitures et compotes, miel, sucre, produits de la chocolaterie (cacao en poudre, préparations pour petits-déjeuners), café (dosettes, capsules filtres, touillettes), thé (dosette …),biscuits sucrés (paquets ou boites de biscu", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.07", Label: "Boulangerie", Description: "pain, sandwiches achetés chez le boulanger", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.08", Label: "Pâtisserie", Description: "Viennoiseries, pâtisserie achetées chez le boulanger", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.09", Label: "Boissons", Description: "Boissons alcoolisées, champagne, vins, cidre, bière, vermouths, boissons alcoolisées distillées, Boissons non alcoolisée, eau (minérale, gazeuse…), jus de fruits et de légumes frais ou réfrigérés, sirops, pains de glace", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.10", Label: "Produits frais laitiers, et dérivés", Description: "Lait liquide, lait gélifiés, emprésurés, lait UHT, lait en poudre, crème, beurre, margarine, pâte à tartiner, fromages frais affinés entiers, portions, rapés, quenelles fraiches, Pates à dérouler, yaourts petits suisses et desserts lactés frais", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.11", Label: "Lait infantile", Description: "Lait en poudre, Lait en bouteille", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.12", Label: "Achat en dépannage de boissons avec enlévement sur place", Description: "Petites commandes urgentes et ponctuelles", Tag: "Fournitures"},
	{FamilyNum: 10, FamilyLabel: "Denrées alimentaires", Code: "10.13", Label: "Achat en dépannage de produits d'épicerie avec enlévement sur place", Description: "Achat en dépannage de produits d'épicerie avec enlèvement sur place", Tag: "Fournitures"},
	{FamilyNum: 11, FamilyLabel: "Fournitures administratives", Code: "11.01", Label: "Fournitures administratives", Description: "Papeterie", Tag: "Fournitures"},
	{FamilyNum: 11, FamilyLabel: "Fournitures administratives", Code: "11.02", Label: "Cahiers et blocs", Description: "Cahiers et blocs", Tag: "Fournitures"},
	{FamilyNum: 11, FamilyLabel: "Fournitures administratives", Code: "11.03", Label: "Classement", Description: "Classement", Tag: "Fournitures"},
	{FamilyNum: 11, FamilyLabel: "Fournitures administratives", Code: "11.04", Label: "Archivage", Description: "Archivage", Tag: "Fournitures"},
	{FamilyNum: 11, FamilyLabel: "Fournitures administratives", Code: "11.05", Label: "Consommables imprimantes", Description: "Consommables imprimantes", Tag: "Fournitures"},
	{FamilyNum: 11, FamilyLabel: "Fournitures administratives", Code: "11.06", Label: "Enveloppes", Description: "Enveloppes", Tag: "Fournitures"},
	{FamilyNum: 11, FamilyLabel: "Fournitures administratives", Code: "11.07", Label: "Petits accessoires bureau", Description: "Petits accessoires bureau", Tag: "Fournitures"},
	{FamilyNum: 11, FamilyLabel: "Fournitures administratives", Code: "11.08", Label: "Tampons et encres", Description: "Tampons et encres", Tag: "Fournitures"},
	{FamilyNum: 12, FamilyLabel: "Fournitures scolaires et pédagogiques", Code: "12.01", Label: "Fournitures scolaires et pédagogiques", Description: "Fournitures scolaires", Tag: "Fournitures"},
	{FamilyNum: 12, FamilyLabel: "Fournitures scolaires et pédagogiques", Code: "12.02", Label: "Matériel pédagogique", Description: "Matériel pédagogique", Tag: "Fournitures"},
	{FamilyNum: 12, FamilyLabel: "Fournitures scolaires et pédagogiques", Code: "12.03", Label: "Jeux éducatifs", Description: "Jeux éducatifs", Tag: "Fournitures"},
	{FamilyNum: 12, FamilyLabel: "Fournitures scolaires et pédagogiques", Code: "12.04", Label: "Loisirs créatifs", Description: "Loisirs créatifs", Tag: "Fournitures"},
	{FamilyNum: 12, FamilyLabel: "Fournitures scolaires et pédagogiques", Code: "12.05", Label: "Matériel arts plastiques", Description: "Matériel arts plastiques", Tag: "Fournitures"},
	{FamilyNum: 12, FamilyLabel: "Fournitures scolaires et pédagogiques", Code: "12.06", Label: "Matériel scientifique", Description: "Matériel scientifique", Tag: "Fournitures"},
	{FamilyNum: 13, FamilyLabel: "Produits d’entretien et hygiène", Code: "13.01", Label: "Produits d’entretien et hygiène", Description: "Produits nettoyage", Tag: "Fournitures"},
	{FamilyNum: 13, FamilyLabel: "Produits d’entretien et hygiène", Code: "13.02", Label: "Produits désinfection", Description: "Produits désinfection", Tag: "Fournitures"},
	{FamilyNum: 13, FamilyLabel: "Produits d’entretien et hygiène", Code: "13.03", Label: "Consommables sanitaires", Description: "Consommables sanitaires", Tag: "Fournitures"},
	{FamilyNum: 13, FamilyLabel: "Produits d’entretien et hygiène", Code: "13.04", Label: "Sacs déchets", Description: "Sacs déchets", Tag: "Fournitures"},
	{FamilyNum: 13, FamilyLabel: "Produits d’entretien et hygiène", Code: "13.05", Label: "Produits écologiques", Description: "Produits écologiques", Tag: "Fournitures"},
	{FamilyNum: 13, FamilyLabel: "Produits d’entretien et hygiène", Code: "13.06", Label: "Petit matériel ménage", Description: "Petit matériel ménage", Tag: "Fournitures"},
	{FamilyNum: 14, FamilyLabel: "Équipements de protection et sécurité", Code: "14.01", Label: "Équipements de protection et sécurité", Description: "EPI vêtements", Tag: "Fournitures"},
	{FamilyNum: 14, FamilyLabel: "Équipements de protection et sécurité", Code: "14.02", Label: "EPI tête", Description: "EPI tête", Tag: "Fournitures"},
	{FamilyNum: 14, FamilyLabel: "Équipements de protection et sécurité", Code: "14.03", Label: "EPI mains", Description: "EPI mains", Tag: "Fournitures"},
	{FamilyNum: 14, FamilyLabel: "Équipements de protection et sécurité", Code: "14.04", Label: "EPI pieds", Description: "EPI pieds", Tag: "Fournitures"},
	{FamilyNum: 14, FamilyLabel: "Équipements de protection et sécurité", Code: "14.05", Label: "Signalisation sécurité", Description: "Signalisation sécurité", Tag: "Fournitures"},
	{FamilyNum: 14, FamilyLabel: "Équipements de protection et sécurité", Code: "14.06", Label: "Matériel premiers secours", Description: "Matériel premiers secours", Tag: "Fournitures"},
	{FamilyNum: 14, FamilyLabel: "Équipements de protection et sécurité", Code: "14.07", Label: "Extincteurs et sécurité incendie", Description: "Extincteurs et sécurité incendie", Tag: "Fournitures"},
	{FamilyNum: 15, FamilyLabel: "Fournitures techniques maintenance", Code: "15.01", Label: "Fournitures techniques maintenance", Description: "Quincaillerie", Tag: "Fournitures"},
	{FamilyNum: 15, FamilyLabel: "Fournitures techniques maintenance", Code: "15.02", Label: "Électricité", Description: "Électricité", Tag: "Fournitures"},
	{FamilyNum: 15, FamilyLabel: "Fournitures techniques maintenance", Code: "15.03", Label: "Plomberie", Description: "Plomberie", Tag: "Fournitures"},
	{FamilyNum: 15, FamilyLabel: "Fournitures techniques maintenance", Code: "15.04", Label: "Peinture", Description: "Peinture", Tag: "Fournitures"},
	{FamilyNum: 15, FamilyLabel: "Fournitures techniques maintenance", Code: "15.05", Label: "Revêtements sol", Description: "Revêtements sol", Tag: "Fournitures"},
	{FamilyNum: 15, FamilyLabel: "Fournitures techniques maintenance", Code: "15.06", Label: "Outillage manuel", Description: "Outillage manuel", Tag: "Fournitures"},
	{FamilyNum: 15, FamilyLabel: "Fournitures techniques maintenance", Code: "15.07", Label: "Outillage électroportatif", Description: "Outillage électroportatif", Tag: "Fournitures"},
	{FamilyNum: 16, FamilyLabel: "Matériel informatique", Code: "16.01", Label: "Matériel informatique", Description: "Ordinateurs fixes", Tag: "Fournitures"},
	{FamilyNum: 16, FamilyLabel: "Matériel informatique", Code: "16.02", Label: "Ordinateurs portables", Description: "Ordinateurs portables", Tag: "Fournitures"},
	{FamilyNum: 16, FamilyLabel: "Matériel informatique", Code: "16.03", Label: "Écrans", Description: "Écrans", Tag: "Fournitures"},
	{FamilyNum: 16, FamilyLabel: "Matériel informatique", Code: "16.04", Label: "Périphériques", Description: "Périphériques", Tag: "Fournitures"},
	{FamilyNum: 16, FamilyLabel: "Matériel informatique", Code: "16.05", Label: "Imprimantes", Description: "Imprimantes", Tag: "Fournitures"},
	{FamilyNum: 16, FamilyLabel: "Matériel informatique", Code: "16.06", Label: "Consommables IT", Description: "Consommables IT", Tag: "Fournitures"},
	{FamilyNum: 16, FamilyLabel: "Matériel informatique", Code: "16.07", Label: "Serveurs", Description: "Serveurs", Tag: "Fournitures"},
	{FamilyNum: 16, FamilyLabel: "Matériel informatique", Code: "16.08", Label: "Équipements réseaux", Description: "Équipements réseaux", Tag: "Fournitures"},
	{FamilyNum: 17, FamilyLabel: "Mobilier", Code: "17.01", Label: "Mobilier", Description: "Mobilier bureau", Tag: "Fournitures"},
	{FamilyNum: 17, FamilyLabel: "Mobilier", Code: "17.02", Label: "Mobilier scolaire", Description: "Mobilier scolaire", Tag: "Fournitures"},
	{FamilyNum: 17, FamilyLabel: "Mobilier", Code: "17.03", Label: "Mobilier urbain", Description: "Mobilier urbain", Tag: "Fournitures"},
	{FamilyNum: 17, FamilyLabel: "Mobilier", Code: "17.04", Label: "Mobilier technique", Description: "Mobilier technique", Tag: "Fournitures"},
	{FamilyNum: 17, FamilyLabel: "Mobilier", Code: "17.05", Label: "Armoires et rangements", Description: "Armoires et rangements", Tag: "Fournitures"},
	{FamilyNum: 17, FamilyLabel: "Mobilier", Code: "17.06", Label: "Mobilier restauration", Description: "Mobilier restauration", Tag: "Fournitures"},
	{FamilyNum: 18, FamilyLabel: "Véhicules et mobilité", Code: "18.01", Label: "Véhicules et mobilité", Description: "Véhicules légers", Tag: "Fournitures"},
	{FamilyNum: 18, FamilyLabel: "Véhicules et mobilité", Code: "18.02", Label: "Utilitaires", Description: "Utilitaires", Tag: "Fournitures"},
	{FamilyNum: 18, FamilyLabel: "Véhicules et mobilité", Code: "18.03", Label: "Véhicules techniques", Description: "Véhicules techniques", Tag: "Fournitures"},
	{FamilyNum: 18, FamilyLabel: "Véhicules et mobilité", Code: "18.04", Label: "Vélos", Description: "Vélos", Tag: "Fournitures"},
	{FamilyNum: 18, FamilyLabel: "Véhicules et mobilité", Code: "18.05", Label: "Vélos électriques", Description: "Vélos électriques", Tag: "Fournitures"},
	{FamilyNum: 18, FamilyLabel: "Véhicules et mobilité", Code: "18.06", Label: "Borne recharge", Description: "Borne recharge", Tag: "Fournitures"},
	{FamilyNum: 18, FamilyLabel: "Véhicules et mobilité", Code: "18.07", Label: "Accessoires véhicules", Description: "Accessoires véhicules", Tag: "Fournitures"},
	{FamilyNum: 19, FamilyLabel: "Espaces verts matériel", Code: "19.01", Label: "Espaces verts matériel", Description: "Plantes", Tag: "Fournitures"},
	{FamilyNum: 19, FamilyLabel: "Espaces verts matériel", Code: "19.02", Label: "Arbres", Description: "Arbres", Tag: "Fournitures"},
	{FamilyNum: 19, FamilyLabel: "Espaces verts matériel", Code: "19.03", Label: "Semences", Description: "Semences", Tag: "Fournitures"},
	{FamilyNum: 19, FamilyLabel: "Espaces verts matériel", Code: "19.04", Label: "Engrais", Description: "Engrais", Tag: "Fournitures"},
	{FamilyNum: 19, FamilyLabel: "Espaces verts matériel", Code: "19.05", Label: "Produits phytosanitaires", Description: "Produits phytosanitaires", Tag: "Fournitures"},
	{FamilyNum: 19, FamilyLabel: "Espaces verts matériel", Code: "19.06", Label: "Matériel horticole", Description: "Matériel horticole", Tag: "Fournitures"},
	{FamilyNum: 19, FamilyLabel: "Espaces verts matériel", Code: "19.07", Label: "Systèmes arrosage", Description: "Systèmes arrosage", Tag: "Fournitures"},
	{FamilyNum: 20, FamilyLabel: "Matériel sportif", Code: "20.01", Label: "Matériel sportif", Description: "Équipements sport collectif", Tag: "Fournitures"},
	{FamilyNum: 20, FamilyLabel: "Matériel sportif", Code: "20.02", Label: "Équipements fitness", Description: "Équipements fitness", Tag: "Fournitures"},
	{FamilyNum: 20, FamilyLabel: "Matériel sportif", Code: "20.03", Label: "Matériel gymnase", Description: "Matériel gymnase", Tag: "Fournitures"},
	{FamilyNum: 20, FamilyLabel: "Matériel sportif", Code: "20.04", Label: "Équipements stades", Description: "Équipements stades", Tag: "Fournitures"},
	{FamilyNum: 20, FamilyLabel: "Matériel sportif", Code: "20.05", Label: "Accessoires sportifs", Description: "Accessoires sportifs", Tag: "Fournitures"},
	{FamilyNum: 21, FamilyLabel: "Matériel culturel et événementiel", Code: "21.01", Label: "Matériel culturel et événementiel", Description: "Matériel sonorisation", Tag: "Fournitures"},
	{FamilyNum: 21, FamilyLabel: "Matériel culturel et événementiel", Code: "21.02", Label: "Éclairage événementiel", Description: "Éclairage événementiel", Tag: "Fournitures"},
	{FamilyNum: 21, FamilyLabel: "Matériel culturel et événementiel", Code: "21.03", Label: "Scènes et structures", Description: "Scènes et structures", Tag: "Fournitures"},
	{FamilyNum: 21, FamilyLabel: "Matériel culturel et événementiel", Code: "21.04", Label: "Signalétique événementielle", Description: "Signalétique événementielle", Tag: "Fournitures"},
	{FamilyNum: 21, FamilyLabel: "Matériel culturel et événementiel", Code: "21.05", Label: "Matériel exposition", Description: "Matériel exposition", Tag: "Fournitures"},
	{FamilyNum: 22, FamilyLabel: "Signalisation routière", Code: "22.01", Label: "Signalisation routière", Description: "Signalisation routière", Tag: "Fournitures"},
	{FamilyNum: 22, FamilyLabel: "Signalisation routière", Code: "22.02", Label: "Mobilier voirie", Description: "Mobilier voirie", Tag: "Fournitures"},
	{FamilyNum: 22, FamilyLabel: "Signalisation routière", Code: "22.03", Label: "Barrières", Description: "Barrières", Tag: "Fournitures"},
	{FamilyNum: 22, FamilyLabel: "Signalisation routière", Code: "22.04", Label: "Potelets", Description: "Potelets", Tag: "Fournitures"},
	{FamilyNum: 22, FamilyLabel: "Signalisation routière", Code: "22.05", Label: "Matériel propreté urbaine", Description: "Matériel propreté urbaine", Tag: "Fournitures"},
	{FamilyNum: 23, FamilyLabel: "Équipements bâtiments", Code: "23.01", Label: "Équipements bâtiments", Description: "Équipements cuisine", Tag: "Fournitures"},
	{FamilyNum: 23, FamilyLabel: "Équipements bâtiments", Code: "23.02", Label: "Équipements sanitaires", Description: "Équipements sanitaires", Tag: "Fournitures"},
	{FamilyNum: 23, FamilyLabel: "Équipements bâtiments", Code: "23.03", Label: "Équipements chauffage", Description: "Équipements chauffage", Tag: "Fournitures"},
	{FamilyNum: 23, FamilyLabel: "Équipements bâtiments", Code: "23.04", Label: "Équipements climatisation", Description: "Équipements climatisation", Tag: "Fournitures"},
	{FamilyNum: 23, FamilyLabel: "Équipements bâtiments", Code: "23.05", Label: "Équipements ventilation", Description: "Équipements ventilation", Tag: "Fournitures"},
	{FamilyNum: 24, FamilyLabel: "Consommables techniques", Code: "24.01", Label: "Consommables techniques", Description: "Gaz techniques", Tag: "Fournitures"},
	{FamilyNum: 24, FamilyLabel: "Consommables techniques", Code: "24.02", Label: "Gaz spécifiques", Description: "Gaz spécifiques", Tag: "Fournitures"},
	{FamilyNum: 24, FamilyLabel: "Consommables techniques", Code: "24.03", Label: "Lubrifiants", Description: "Lubrifiants", Tag: "Fournitures"},
	{FamilyNum: 24, FamilyLabel: "Consommables techniques", Code: "24.04", Label: "Batteries", Description: "Batteries", Tag: "Fournitures"},
	{FamilyNum: 24, FamilyLabel: "Consommables techniques", Code: "24.05", Label: "Ampoules", Description: "Ampoules", Tag: "Fournitures"},
	{FamilyNum: 24, FamilyLabel: "Consommables techniques", Code: "24.06", Label: "Fusibles", Description: "Fusibles", Tag: "Fournitures"},
	{FamilyNum: 25, FamilyLabel: "Matériel médical et secours", Code: "25.01", Label: "Matériel médical et secours", Description: "Matériel médical", Tag: "Fournitures"},
	{FamilyNum: 25, FamilyLabel: "Matériel médical et secours", Code: "25.02", Label: "Défibrillateurs", Description: "Défibrillateurs", Tag: "Fournitures"},
	{FamilyNum: 25, FamilyLabel: "Matériel médical et secours", Code: "25.03", Label: "Consommables médicaux", Description: "Consommables médicaux", Tag: "Fournitures"},
	{FamilyNum: 25, FamilyLabel: "Matériel médical et secours", Code: "25.04", Label: "Équipements secours", Description: "Équipements secours", Tag: "Fournitures"},
	{FamilyNum: 60, FamilyLabel: "Transport et mobilité", Code: "60.01", Label: "Transport et mobilité", Description: "Transport scolaire", Tag: "Services"},
	{FamilyNum: 60, FamilyLabel: "Transport et mobilité", Code: "60.02", Label: "Transport occasionnel", Description: "Transport occasionnel", Tag: "Services"},
	{FamilyNum: 60, FamilyLabel: "Transport et mobilité", Code: "60.03", Label: "Transport personnes", Description: "Transport personnes", Tag: "Services"},
	{FamilyNum: 60, FamilyLabel: "Transport et mobilité", Code: "60.04", Label: "Transport marchandises", Description: "Transport marchandises", Tag: "Services"},
	{FamilyNum: 60, FamilyLabel: "Transport et mobilité", Code: "60.05", Label: "Location véhicules", Description: "Location véhicules", Tag: "Services"},
	{FamilyNum: 60, FamilyLabel: "Transport et mobilité", Code: "60.06", Label: "Autopartage", Description: "Autopartage", Tag: "Services"},
	{FamilyNum: 61, FamilyLabel: "Maintenance bâtiments", Code: "61.01", Label: "Maintenance bâtiments", Description: "Maintenance bâtiments", Tag: "Services"},
	{FamilyNum: 61, FamilyLabel: "Maintenance bâtiments", Code: "61.02", Label: "Maintenance électricité", Description: "Maintenance électricité", Tag: "Services"},
	{FamilyNum: 61, FamilyLabel: "Maintenance bâtiments", Code: "61.03", Label: "Maintenance plomberie", Description: "Maintenance plomberie", Tag: "Services"},
	{FamilyNum: 61, FamilyLabel: "Maintenance bâtiments", Code: "61.04", Label: "Maintenance chauffage", Description: "Maintenance chauffage", Tag: "Services"},
	{FamilyNum: 61, FamilyLabel: "Maintenance bâtiments", Code: "61.05", Label: "Maintenance ascenseurs", Description: "Maintenance ascenseurs", Tag: "Services"},
	{FamilyNum: 61, FamilyLabel: "Maintenance bâtiments", Code: "61.06", Label: "Maintenance incendie", Description: "Maintenance incendie", Tag: "Services"},
	{FamilyNum: 62, FamilyLabel: "Maintenance informatique", Code: "62.01", Label: "Maintenance informatique", Description: "Maintenance matériel IT", Tag: "Services"},
	{FamilyNum: 62, FamilyLabel: "Maintenance informatique", Code: "62.02", Label: "Maintenance logiciels", Description: "Maintenance logiciels", Tag: "Services"},
	{FamilyNum: 62, FamilyLabel: "Maintenance informatique", Code: "62.03", Label: "Infogérance", Description: "Infogérance", Tag: "Services"},
	{FamilyNum: 62, FamilyLabel: "Maintenance informatique", Code: "62.04", Label: "Hébergement cloud", Description: "Hébergement cloud", Tag: "Services"},
	{FamilyNum: 62, FamilyLabel: "Maintenance informatique", Code: "62.05", Label: "Cybersécurité", Description: "Cybersécurité", Tag: "Services"},
	{FamilyNum: 63, FamilyLabel: "Télécommunications", Code: "63.01", Label: "Télécommunications", Description: "Téléphonie fixe", Tag: "Services"},
	{FamilyNum: 63, FamilyLabel: "Télécommunications", Code: "63.02", Label: "Téléphonie mobile", Description: "Téléphonie mobile", Tag: "Services"},
	{FamilyNum: 63, FamilyLabel: "Télécommunications", Code: "63.03", Label: "Accès internet", Description: "Accès internet", Tag: "Services"},
	{FamilyNum: 63, FamilyLabel: "Télécommunications", Code: "63.04", Label: "Réseaux données", Description: "Réseaux données", Tag: "Services"},
	{FamilyNum: 63, FamilyLabel: "Télécommunications", Code: "63.05", Label: "Maintenance télécom", Description: "Maintenance télécom", Tag: "Services"},
	{FamilyNum: 64, FamilyLabel: "Études et conseil", Code: "64.01", Label: "Études et conseil", Description: "Assistance maîtrise ouvrage", Tag: "Services"},
	{FamilyNum: 64, FamilyLabel: "Études et conseil", Code: "64.02", Label: "Conseil juridique", Description: "Conseil juridique", Tag: "Services"},
	{FamilyNum: 64, FamilyLabel: "Études et conseil", Code: "64.03", Label: "Conseil organisation", Description: "Conseil organisation", Tag: "Services"},
	{FamilyNum: 64, FamilyLabel: "Études et conseil", Code: "64.04", Label: "Conseil financier", Description: "Conseil financier", Tag: "Services"},
	{FamilyNum: 64, FamilyLabel: "Études et conseil", Code: "64.05", Label: "Études techniques", Description: "Études techniques", Tag: "Services"},
	{FamilyNum: 64, FamilyLabel: "Études et conseil", Code: "64.06", Label: "Audit", Description: "Audit", Tag: "Services"},
	{FamilyNum: 65, FamilyLabel: "Assurances", Code: "65.01", Label: "Assurances", Description: "Assurance dommages", Tag: "Services"},
	{FamilyNum: 65, FamilyLabel: "Assurances", Code: "65.02", Label: "Assurance flotte", Description: "Assurance flotte", Tag: "Services"},
	{FamilyNum: 65, FamilyLabel: "Assurances", Code: "65.03", Label: "Responsabilité civile", Description: "Responsabilité civile", Tag: "Services"},
	{FamilyNum: 65, FamilyLabel: "Assurances", Code: "65.04", Label: "Assurance construction", Description: "Assurance construction", Tag: "Services"},
	{FamilyNum: 66, FamilyLabel: "Nettoyage et propreté", Code: "66.01", Label: "Nettoyage et propreté", Description: "Nettoyage bâtiments", Tag: "Services"},
	{FamilyNum: 66, FamilyLabel: "Nettoyage et propreté", Code: "66.02", Label: "Nettoyage vitres", Description: "Nettoyage vitres", Tag: "Services"},
	{FamilyNum: 66, FamilyLabel: "Nettoyage et propreté", Code: "66.03", Label: "Nettoyage voirie", Description: "Nettoyage voirie", Tag: "Services"},
	{FamilyNum: 66, FamilyLabel: "Nettoyage et propreté", Code: "66.04", Label: "Collecte déchets", Description: "Collecte déchets", Tag: "Services"},
	{FamilyNum: 66, FamilyLabel: "Nettoyage et propreté", Code: "66.05", Label: "Traitement déchets", Description: "Traitement déchets", Tag: "Services"},
	{FamilyNum: 67, FamilyLabel: "Espaces verts", Code: "67.01", Label: "Espaces verts", Description: "Entretien espaces verts", Tag: "Services"},
	{FamilyNum: 67, FamilyLabel: "Espaces verts", Code: "67.02", Label: "Tonte", Description: "Tonte", Tag: "Services"},
	{FamilyNum: 67, FamilyLabel: "Espaces verts", Code: "67.03", Label: "Élagage", Description: "Élagage", Tag: "Services"},
	{FamilyNum: 67, FamilyLabel: "Espaces verts", Code: "67.04", Label: "Aménagement paysager", Description: "Aménagement paysager", Tag: "Services"},
	{FamilyNum: 68, FamilyLabel: "Communication", Code: "68.01", Label: "Communication", Description: "Communication institutionnelle", Tag: "Services"},
	{FamilyNum: 68, FamilyLabel: "Communication", Code: "68.02", Label: "Création graphique", Description: "Création graphique", Tag: "Services"},
	{FamilyNum: 68, FamilyLabel: "Communication", Code: "68.03", Label: "Impression", Description: "Impression", Tag: "Services"},
	{FamilyNum: 68, FamilyLabel: "Communication", Code: "68.04", Label: "Campagnes communication", Description: "Campagnes communication", Tag: "Services"},
	{FamilyNum: 68, FamilyLabel: "Communication", Code: "68.05", Label: "Relations presse", Description: "Relations presse", Tag: "Services"},
	{FamilyNum: 69, FamilyLabel: "Ressources humaines", Code: "69.01", Label: "Ressources humaines", Description: "Formation", Tag: "Services"},
	{FamilyNum: 69, FamilyLabel: "Ressources humaines", Code: "69.02", Label: "Recrutement", Description: "Recrutement", Tag: "Services"},
	{FamilyNum: 69, FamilyLabel: "Ressources humaines", Code: "69.03", Label: "Médecine du travail", Description: "Médecine du travail", Tag: "Services"},
	{FamilyNum: 69, FamilyLabel: "Ressources humaines", Code: "69.04", Label: "Coaching", Description: "Coaching", Tag: "Services"},
	{FamilyNum: 69, FamilyLabel: "Ressources humaines", Code: "69.05", Label: "Évaluation compétences", Description: "Évaluation compétences", Tag: "Services"},
	{FamilyNum: 70, FamilyLabel: "Services aux usagers", Code: "70.01", Label: "Services aux usagers", Description: "Animation", Tag: "Services"},
	{FamilyNum: 70, FamilyLabel: "Services aux usagers", Code: "70.02", Label: "Activités sportives", Description: "Activités sportives", Tag: "Services"},
	{FamilyNum: 70, FamilyLabel: "Services aux usagers", Code: "70.03", Label: "Activités culturelles", Description: "Activités culturelles", Tag: "Services"},
	{FamilyNum: 70, FamilyLabel: "Services aux usagers", Code: "70.04", Label: "Gestion équipements loisirs", Description: "Gestion équipements loisirs", Tag: "Services"},
	{FamilyNum: 71, FamilyLabel: "Événementiel", Code: "71.01", Label: "Événementiel", Description: "Organisation événements", Tag: "Services"},
	{FamilyNum: 71, FamilyLabel: "Événementiel", Code: "71.02", Label: "Logistique événementielle", Description: "Logistique événementielle", Tag: "Services"},
	{FamilyNum: 71, FamilyLabel: "Événementiel", Code: "71.03", Label: "Location matériel événementiel", Description: "Location matériel événementiel", Tag: "Services"},
	{FamilyNum: 72, FamilyLabel: "Sécurité", Code: "72.01", Label: "Sécurité", Description: "Gardiennage", Tag: "Services"},
	{FamilyNum: 72, FamilyLabel: "Sécurité", Code: "72.02", Label: "Télésurveillance", Description: "Télésurveillance", Tag: "Services"},
	{FamilyNum: 72, FamilyLabel: "Sécurité", Code: "72.03", Label: "Sécurité événements", Description: "Sécurité événements", Tag: "Services"},
	{FamilyNum: 73, FamilyLabel: "Prestations techniques", Code: "73.01", Label: "Prestations techniques", Description: "Contrôles réglementaires", Tag: "Services"},
	{FamilyNum: 73, FamilyLabel: "Prestations techniques", Code: "73.02", Label: "Diagnostics techniques", Description: "Diagnostics techniques", Tag: "Services"},
	{FamilyNum: 73, FamilyLabel: "Prestations techniques", Code: "73.03", Label: "Mesures environnementales", Description: "Mesures environnementales", Tag: "Services"},
	{FamilyNum: 74, FamilyLabel: "Services juridiques", Code: "74.01", Label: "Services juridiques", Description: "Conseil juridique", Tag: "Services"},
	{FamilyNum: 74, FamilyLabel: "Services juridiques", Code: "74.02", Label: "Contentieux", Description: "Contentieux", Tag: "Services"},
	{FamilyNum: 74, FamilyLabel: "Services juridiques", Code: "74.03", Label: "Rédaction actes", Description: "Rédaction actes", Tag: "Services"},
	{FamilyNum: 75, FamilyLabel: "Audit financier", Code: "75.01", Label: "Audit financier", Description: "Audit financier", Tag: "Services"},
	{FamilyNum: 75, FamilyLabel: "Audit financier", Code: "75.02", Label: "Conseil fiscal", Description: "Conseil fiscal", Tag: "Services"},
	{FamilyNum: 75, FamilyLabel: "Audit financier", Code: "75.03", Label: "Ingénierie financière", Description: "Ingénierie financière", Tag: "Services"},
}

// NomenclatureTravaux — CPV-sourced Travaux entries.
// Source: CPV_secteurs_VF.xlsx — secteur "Travaux, matériaux, maintenance".
// 8 familles × ~7 codes = ~56 leaf codes.
var NomenclatureTravaux = []TravauxEntry{
	// ── Bâtiment ──────────────────────────────────────────────
	{FamilyCode: "T-BAT", FamilyLabel: "Bâtiment", CPVCode: "45210000-2", Label: "Travaux de construction de bâtiments"},
	{FamilyCode: "T-BAT", FamilyLabel: "Bâtiment", CPVCode: "45211000-9", Label: "Travaux de construction d'immeubles collectifs et de maisons individuelles"},
	{FamilyCode: "T-BAT", FamilyLabel: "Bâtiment", CPVCode: "45212000-6", Label: "Travaux de construction d'équipements de loisirs, de sports, de culture et d'hébergement"},
	{FamilyCode: "T-BAT", FamilyLabel: "Bâtiment", CPVCode: "45213000-3", Label: "Travaux de construction de bâtiments commerciaux, d'entrepôts et industriels"},
	{FamilyCode: "T-BAT", FamilyLabel: "Bâtiment", CPVCode: "45214000-0", Label: "Travaux de construction d'établissements d'enseignement et de recherche"},
	{FamilyCode: "T-BAT", FamilyLabel: "Bâtiment", CPVCode: "45215000-7", Label: "Travaux de construction de bâtiments pour le secteur de la santé et de l'assistance sociale"},
	{FamilyCode: "T-BAT", FamilyLabel: "Bâtiment", CPVCode: "45262000-1", Label: "Travaux de corps de métier spécialisés (couverture, électricité, plomberie, menuiserie)"},

	// ── Voirie et réseaux ─────────────────────────────────────
	{FamilyCode: "T-VRD", FamilyLabel: "Voirie et réseaux divers", CPVCode: "45220000-5", Label: "Ouvrages d'art et de génie civil"},
	{FamilyCode: "T-VRD", FamilyLabel: "Voirie et réseaux divers", CPVCode: "45232000-2", Label: "Travaux annexes pour pipelines et câbles"},
	{FamilyCode: "T-VRD", FamilyLabel: "Voirie et réseaux divers", CPVCode: "45233000-9", Label: "Travaux de construction, de fondation et de revêtement d'autoroutes et de routes"},
	{FamilyCode: "T-VRD", FamilyLabel: "Voirie et réseaux divers", CPVCode: "45233100-0", Label: "Travaux de construction d'autoroutes et de routes"},
	{FamilyCode: "T-VRD", FamilyLabel: "Voirie et réseaux divers", CPVCode: "45233200-1", Label: "Travaux de revêtement de routes et autres surfaces"},
	{FamilyCode: "T-VRD", FamilyLabel: "Voirie et réseaux divers", CPVCode: "45316000-5", Label: "Installation d'éclairage et de signalisation routière"},
	{FamilyCode: "T-VRD", FamilyLabel: "Voirie et réseaux divers", CPVCode: "45342000-6", Label: "Travaux d'installation de clôtures"},

	// ── Démolition et terrassement ────────────────────────────
	{FamilyCode: "T-DEM", FamilyLabel: "Démolition et terrassement", CPVCode: "45110000-1", Label: "Travaux de démolition de bâtiments et travaux de terrassement"},
	{FamilyCode: "T-DEM", FamilyLabel: "Démolition et terrassement", CPVCode: "45111000-8", Label: "Travaux de démolition, préparation et dégagement de chantier"},
	{FamilyCode: "T-DEM", FamilyLabel: "Démolition et terrassement", CPVCode: "45111100-9", Label: "Travaux de démolition"},
	{FamilyCode: "T-DEM", FamilyLabel: "Démolition et terrassement", CPVCode: "45111300-1", Label: "Travaux de démantèlement"},
	{FamilyCode: "T-DEM", FamilyLabel: "Démolition et terrassement", CPVCode: "45112000-5", Label: "Travaux de fouille et de terrassement"},
	{FamilyCode: "T-DEM", FamilyLabel: "Démolition et terrassement", CPVCode: "45112500-0", Label: "Travaux de terrassement"},
	{FamilyCode: "T-DEM", FamilyLabel: "Démolition et terrassement", CPVCode: "45113000-2", Label: "Travaux de chantier — installations et préparation générale"},

	// ── Aménagement urbain et espaces verts ───────────────────
	{FamilyCode: "T-AME", FamilyLabel: "Aménagement urbain et espaces verts", CPVCode: "45112700-2", Label: "Travaux d'aménagement paysager"},
	{FamilyCode: "T-AME", FamilyLabel: "Aménagement urbain et espaces verts", CPVCode: "45112710-5", Label: "Travaux d'aménagement paysager d'espaces verts"},
	{FamilyCode: "T-AME", FamilyLabel: "Aménagement urbain et espaces verts", CPVCode: "45112711-2", Label: "Travaux d'aménagement paysager de parcs"},
	{FamilyCode: "T-AME", FamilyLabel: "Aménagement urbain et espaces verts", CPVCode: "45112712-9", Label: "Travaux d'aménagement paysager de jardins"},
	{FamilyCode: "T-AME", FamilyLabel: "Aménagement urbain et espaces verts", CPVCode: "45236000-0", Label: "Travaux de nivelage pour équipements sportifs et récréatifs"},
	{FamilyCode: "T-AME", FamilyLabel: "Aménagement urbain et espaces verts", CPVCode: "45240000-1", Label: "Travaux de construction d'ouvrages hydrauliques"},
	{FamilyCode: "T-AME", FamilyLabel: "Aménagement urbain et espaces verts", CPVCode: "45262640-9", Label: "Travaux de dépollution"},

	// ── Réseaux et infrastructures ────────────────────────────
	{FamilyCode: "T-INF", FamilyLabel: "Réseaux et infrastructures", CPVCode: "45230000-8", Label: "Travaux de construction de pipelines, lignes de communication, autoroutes et voies ferrées"},
	{FamilyCode: "T-INF", FamilyLabel: "Réseaux et infrastructures", CPVCode: "45231300-8", Label: "Travaux de construction de conduites d'eau et d'assainissement"},
	{FamilyCode: "T-INF", FamilyLabel: "Réseaux et infrastructures", CPVCode: "45231400-9", Label: "Travaux de construction de lignes électriques"},
	{FamilyCode: "T-INF", FamilyLabel: "Réseaux et infrastructures", CPVCode: "45231600-1", Label: "Travaux de construction de lignes de communications"},
	{FamilyCode: "T-INF", FamilyLabel: "Réseaux et infrastructures", CPVCode: "45232100-3", Label: "Travaux de construction de conduites d'eau principale"},
	{FamilyCode: "T-INF", FamilyLabel: "Réseaux et infrastructures", CPVCode: "45232400-6", Label: "Travaux de construction d'égouts"},
	{FamilyCode: "T-INF", FamilyLabel: "Réseaux et infrastructures", CPVCode: "45314000-1", Label: "Installation de réseaux de télécommunications"},

	// ── Matériaux de construction ─────────────────────────────
	{FamilyCode: "T-MAT", FamilyLabel: "Matériaux de construction", CPVCode: "44000000-0", Label: "Matériaux et structures de construction"},
	{FamilyCode: "T-MAT", FamilyLabel: "Matériaux de construction", CPVCode: "44100000-1", Label: "Matériaux de construction et articles connexes"},
	{FamilyCode: "T-MAT", FamilyLabel: "Matériaux de construction", CPVCode: "44110000-4", Label: "Matériaux de construction (briques, béton, ciment, céramique)"},
	{FamilyCode: "T-MAT", FamilyLabel: "Matériaux de construction", CPVCode: "44160000-9", Label: "Canalisations, tuyauteries, conduites, câblage et articles connexes"},
	{FamilyCode: "T-MAT", FamilyLabel: "Matériaux de construction", CPVCode: "44200000-2", Label: "Produits structuraux"},
	{FamilyCode: "T-MAT", FamilyLabel: "Matériaux de construction", CPVCode: "44500000-5", Label: "Outils, serrures, clés, charnières, fixations, chaînes et ressorts"},
	{FamilyCode: "T-MAT", FamilyLabel: "Matériaux de construction", CPVCode: "44800000-8", Label: "Peintures, vernis et mastics"},

	// ── Génie thermique, électrique et sanitaire ──────────────
	{FamilyCode: "T-GTE", FamilyLabel: "Génie thermique, électrique et sanitaire", CPVCode: "45300000-0", Label: "Travaux d'équipement du bâtiment"},
	{FamilyCode: "T-GTE", FamilyLabel: "Génie thermique, électrique et sanitaire", CPVCode: "45310000-3", Label: "Travaux d'installation électrique"},
	{FamilyCode: "T-GTE", FamilyLabel: "Génie thermique, électrique et sanitaire", CPVCode: "45320000-6", Label: "Travaux d'isolation"},
	{FamilyCode: "T-GTE", FamilyLabel: "Génie thermique, électrique et sanitaire", CPVCode: "45330000-9", Label: "Travaux de plomberie"},
	{FamilyCode: "T-GTE", FamilyLabel: "Génie thermique, électrique et sanitaire", CPVCode: "45331000-6", Label: "Travaux d'installation de matériel de chauffage, de ventilation et de climatisation"},
	{FamilyCode: "T-GTE", FamilyLabel: "Génie thermique, électrique et sanitaire", CPVCode: "45350000-5", Label: "Travaux d'installation mécanique"},
	{FamilyCode: "T-GTE", FamilyLabel: "Génie thermique, électrique et sanitaire", CPVCode: "45400000-1", Label: "Travaux de parachèvement de bâtiment"},

	// ── Maintenance et réhabilitation ─────────────────────────
	{FamilyCode: "T-MNT", FamilyLabel: "Maintenance et réhabilitation", CPVCode: "45453000-7", Label: "Travaux de remise en état et de remise à neuf"},
	{FamilyCode: "T-MNT", FamilyLabel: "Maintenance et réhabilitation", CPVCode: "45453100-8", Label: "Travaux de remise en état"},
	{FamilyCode: "T-MNT", FamilyLabel: "Maintenance et réhabilitation", CPVCode: "45262700-8", Label: "Travaux de transformation de bâtiments"},
	{FamilyCode: "T-MNT", FamilyLabel: "Maintenance et réhabilitation", CPVCode: "45261000-4", Label: "Travaux de charpente et de couverture et travaux connexes"},
	{FamilyCode: "T-MNT", FamilyLabel: "Maintenance et réhabilitation", CPVCode: "45410000-4", Label: "Travaux de plâtrerie"},
	{FamilyCode: "T-MNT", FamilyLabel: "Maintenance et réhabilitation", CPVCode: "45420000-7", Label: "Travaux de menuiserie et de charpenterie"},
	{FamilyCode: "T-MNT", FamilyLabel: "Maintenance et réhabilitation", CPVCode: "45430000-0", Label: "Travaux de revêtement de sols et de murs"},
}

// 256 additional CPV codes
var NomenclatureCPVExtra = []NomenclatureEntry{
	{FamilyNum: 10, FamilyLabel: "", Code: "CPV-15000000-8", Label: "Produits alimentaires, boissons, tabac et produits connexes", Description: "", Tag: "Fournitures", CPVCode: "15000000-8"},
	{FamilyNum: 10, FamilyLabel: "", Code: "CPV-15800000-6", Label: "Produits alimentaires divers", Description: "", Tag: "Fournitures", CPVCode: "15800000-6"},
	{FamilyNum: 10, FamilyLabel: "", Code: "CPV-15896000-5", Label: "Produits surgelés", Description: "", Tag: "Fournitures", CPVCode: "15896000-5"},
	{FamilyNum: 10, FamilyLabel: "", Code: "CPV-15894200-3", Label: "Repas préparés", Description: "", Tag: "Fournitures", CPVCode: "15894200-3"},
	{FamilyNum: 10, FamilyLabel: "", Code: "CPV-15894210-6", Label: "Repas pour écoles", Description: "", Tag: "Fournitures", CPVCode: "15894210-6"},
	{FamilyNum: 10, FamilyLabel: "", Code: "CPV-15300000-1", Label: "Fruits, légumes et produits connexes", Description: "", Tag: "Fournitures", CPVCode: "15300000-1"},
	{FamilyNum: 10, FamilyLabel: "", Code: "CPV-15500000-3", Label: "Produits laitiers", Description: "", Tag: "Fournitures", CPVCode: "15500000-3"},
	{FamilyNum: 10, FamilyLabel: "", Code: "CPV-15811100-7", Label: "Pain", Description: "", Tag: "Fournitures", CPVCode: "15811100-7"},
	{FamilyNum: 11, FamilyLabel: "", Code: "CPV-30100000-0", Label: "Machines, matériel et fournitures de bureau, excepté ordinateurs, imprimantes et meubles", Description: "", Tag: "Fournitures", CPVCode: "30100000-0"},
	{FamilyNum: 11, FamilyLabel: "", Code: "CPV-30190000-7", Label: "Machines, fournitures et équipement de bureau divers", Description: "", Tag: "Fournitures", CPVCode: "30190000-7"},
	{FamilyNum: 11, FamilyLabel: "", Code: "CPV-30191000-4", Label: "Equipement de bureau, excepté les meubles", Description: "", Tag: "Fournitures", CPVCode: "30191000-4"},
	{FamilyNum: 11, FamilyLabel: "", Code: "CPV-30191100-5", Label: "Équipement de classement", Description: "", Tag: "Fournitures", CPVCode: "30191100-5"},
	{FamilyNum: 11, FamilyLabel: "", Code: "CPV-30191110-8", Label: "Carrousels à cartes", Description: "", Tag: "Fournitures", CPVCode: "30191110-8"},
	{FamilyNum: 11, FamilyLabel: "", Code: "CPV-30191120-1", Label: "Porte-revues", Description: "", Tag: "Fournitures", CPVCode: "30191120-1"},
	{FamilyNum: 11, FamilyLabel: "", Code: "CPV-30191130-4", Label: "Presse-papiers", Description: "", Tag: "Fournitures", CPVCode: "30191130-4"},
	{FamilyNum: 11, FamilyLabel: "", Code: "CPV-30191140-7", Label: "Accessoires d'identification personnelle", Description: "", Tag: "Fournitures", CPVCode: "30191140-7"},
	{FamilyNum: 12, FamilyLabel: "", Code: "CPV-79970000-4", Label: "Services d'édition", Description: "", Tag: "Fournitures", CPVCode: "79970000-4"},
	{FamilyNum: 12, FamilyLabel: "", Code: "CPV-79971000-1", Label: "Services de reliure et de finition", Description: "", Tag: "Fournitures", CPVCode: "79971000-1"},
	{FamilyNum: 12, FamilyLabel: "", Code: "CPV-79971100-2", Label: "Services de finition de livres", Description: "", Tag: "Fournitures", CPVCode: "79971100-2"},
	{FamilyNum: 12, FamilyLabel: "", Code: "CPV-79971200-3", Label: "Services de reliure", Description: "", Tag: "Fournitures", CPVCode: "79971200-3"},
	{FamilyNum: 12, FamilyLabel: "", Code: "CPV-79972000-8", Label: "Services d'édition de dictionnaires de langue", Description: "", Tag: "Fournitures", CPVCode: "79972000-8"},
	{FamilyNum: 12, FamilyLabel: "", Code: "CPV-79972100-9", Label: "Services d'edition de dictionnaires de langue régionale", Description: "", Tag: "Fournitures", CPVCode: "79972100-9"},
	{FamilyNum: 12, FamilyLabel: "", Code: "CPV-79980000-7", Label: "Services d'abonnement", Description: "", Tag: "Fournitures", CPVCode: "79980000-7"},
	{FamilyNum: 12, FamilyLabel: "", Code: "CPV-79995100-6", Label: "Services d'archivage", Description: "", Tag: "Fournitures", CPVCode: "79995100-6"},
	{FamilyNum: 13, FamilyLabel: "", Code: "CPV-39800000-0", Label: "Produits de nettoyage et produits à polir", Description: "", Tag: "Fournitures", CPVCode: "39800000-0"},
	{FamilyNum: 13, FamilyLabel: "", Code: "CPV-39810000-3", Label: "Préparations odoriférantes et cires", Description: "", Tag: "Fournitures", CPVCode: "39810000-3"},
	{FamilyNum: 13, FamilyLabel: "", Code: "CPV-39811000-0", Label: "Parfums et désodorisants d'intérieur", Description: "", Tag: "Fournitures", CPVCode: "39811000-0"},
	{FamilyNum: 13, FamilyLabel: "", Code: "CPV-39811100-1", Label: "Désodorisants d'intérieur", Description: "", Tag: "Fournitures", CPVCode: "39811100-1"},
	{FamilyNum: 13, FamilyLabel: "", Code: "CPV-39811110-4", Label: "Appareils distributeurs de désodorisants d'intérieur", Description: "", Tag: "Fournitures", CPVCode: "39811110-4"},
	{FamilyNum: 13, FamilyLabel: "", Code: "CPV-39811200-2", Label: "Produits d'assainissement de l'air", Description: "", Tag: "Fournitures", CPVCode: "39811200-2"},
	{FamilyNum: 13, FamilyLabel: "", Code: "CPV-39811300-3", Label: "Désodorisants", Description: "", Tag: "Fournitures", CPVCode: "39811300-3"},
	{FamilyNum: 13, FamilyLabel: "", Code: "CPV-39812000-7", Label: "Cirages et crèmes", Description: "", Tag: "Fournitures", CPVCode: "39812000-7"},
	{FamilyNum: 14, FamilyLabel: "", Code: "CPV-18000000-9", Label: "Vêtements, articles chaussants, bagages et accessoires", Description: "", Tag: "Fournitures", CPVCode: "18000000-9"},
	{FamilyNum: 14, FamilyLabel: "", Code: "CPV-18143000-3", Label: "Équipements de protection", Description: "", Tag: "Fournitures", CPVCode: "18143000-3"},
	{FamilyNum: 14, FamilyLabel: "", Code: "CPV-18113000-4", Label: "Vêtements à usage industriel", Description: "", Tag: "Fournitures", CPVCode: "18113000-4"},
	{FamilyNum: 14, FamilyLabel: "", Code: "CPV-18100000-0", Label: "Vêtements professionnels, vêtements de travail spéciaux et accessoires", Description: "", Tag: "Fournitures", CPVCode: "18100000-0"},
	{FamilyNum: 14, FamilyLabel: "", Code: "CPV-18110000-3", Label: "Vêtements professionnels", Description: "", Tag: "Fournitures", CPVCode: "18110000-3"},
	{FamilyNum: 14, FamilyLabel: "", Code: "CPV-18300000-2", Label: "Articles d'habillement", Description: "", Tag: "Fournitures", CPVCode: "18300000-2"},
	{FamilyNum: 14, FamilyLabel: "", Code: "CPV-18424300-0", Label: "Gants jetables", Description: "", Tag: "Fournitures", CPVCode: "18424300-0"},
	{FamilyNum: 14, FamilyLabel: "", Code: "CPV-18130000-9", Label: "Vêtements de travail spéciaux", Description: "", Tag: "Fournitures", CPVCode: "18130000-9"},
	{FamilyNum: 15, FamilyLabel: "", Code: "CPV-44000000-0", Label: "Matéraiux et structures de construction; produits auxiliaires pour la construction", Description: "", Tag: "Fournitures", CPVCode: "44000000-0"},
	{FamilyNum: 15, FamilyLabel: "", Code: "CPV-44100000-1", Label: "Matériaux de construction et articles connexes", Description: "", Tag: "Fournitures", CPVCode: "44100000-1"},
	{FamilyNum: 15, FamilyLabel: "", Code: "CPV-44110000-4", Label: "Matériaux de construction", Description: "", Tag: "Fournitures", CPVCode: "44110000-4"},
	{FamilyNum: 15, FamilyLabel: "", Code: "CPV-44111000-1", Label: "Matériaux de bâtiment", Description: "", Tag: "Fournitures", CPVCode: "44111000-1"},
	{FamilyNum: 15, FamilyLabel: "", Code: "CPV-44111100-2", Label: "Briques", Description: "", Tag: "Fournitures", CPVCode: "44111100-2"},
	{FamilyNum: 15, FamilyLabel: "", Code: "CPV-44111200-3", Label: "Ciment", Description: "", Tag: "Fournitures", CPVCode: "44111200-3"},
	{FamilyNum: 15, FamilyLabel: "", Code: "CPV-44111210-6", Label: "Ciment de forage", Description: "", Tag: "Fournitures", CPVCode: "44111210-6"},
	{FamilyNum: 15, FamilyLabel: "", Code: "CPV-44111300-4", Label: "Céramique", Description: "", Tag: "Fournitures", CPVCode: "44111300-4"},
	{FamilyNum: 16, FamilyLabel: "", Code: "CPV-30200000-1", Label: "Matériel et fournitures informatiques", Description: "", Tag: "Fournitures", CPVCode: "30200000-1"},
	{FamilyNum: 16, FamilyLabel: "", Code: "CPV-30000000-9", Label: "Machines, matériel et fourniture informatique et de bureau, excepté les meubles et logiciels", Description: "", Tag: "Fournitures", CPVCode: "30000000-9"},
	{FamilyNum: 16, FamilyLabel: "", Code: "CPV-30110000-3", Label: "Machines de traitement de texte", Description: "", Tag: "Fournitures", CPVCode: "30110000-3"},
	{FamilyNum: 16, FamilyLabel: "", Code: "CPV-30111000-0", Label: "Traitements de texte", Description: "", Tag: "Fournitures", CPVCode: "30111000-0"},
	{FamilyNum: 16, FamilyLabel: "", Code: "CPV-30120000-6", Label: "Photocopieurs et matériel d'impression offset", Description: "", Tag: "Fournitures", CPVCode: "30120000-6"},
	{FamilyNum: 16, FamilyLabel: "", Code: "CPV-30121000-3", Label: "Photocopieurs et appareils de thermocopie", Description: "", Tag: "Fournitures", CPVCode: "30121000-3"},
	{FamilyNum: 16, FamilyLabel: "", Code: "CPV-30121100-4", Label: "Photocopieurs", Description: "", Tag: "Fournitures", CPVCode: "30121100-4"},
	{FamilyNum: 16, FamilyLabel: "", Code: "CPV-30121200-5", Label: "Matériel de photocopie", Description: "", Tag: "Fournitures", CPVCode: "30121200-5"},
	{FamilyNum: 17, FamilyLabel: "", Code: "CPV-39000000-2", Label: "Meubles (y compris les meubles de bureau), aménagements, appareils électroménagers (à l'exclusion de l'éclairage) et produits de nettoyage", Description: "", Tag: "Fournitures", CPVCode: "39000000-2"},
	{FamilyNum: 17, FamilyLabel: "", Code: "CPV-39300000-5", Label: "Équipement divers", Description: "", Tag: "Fournitures", CPVCode: "39300000-5"},
	{FamilyNum: 17, FamilyLabel: "", Code: "CPV-39100000-3", Label: "Mobilier", Description: "", Tag: "Fournitures", CPVCode: "39100000-3"},
	{FamilyNum: 17, FamilyLabel: "", Code: "CPV-39110000-6", Label: "Sièges, chaises et articles assimilés,  et pièces connexes", Description: "", Tag: "Fournitures", CPVCode: "39110000-6"},
	{FamilyNum: 17, FamilyLabel: "", Code: "CPV-39111000-3", Label: "Sièges", Description: "", Tag: "Fournitures", CPVCode: "39111000-3"},
	{FamilyNum: 17, FamilyLabel: "", Code: "CPV-39111100-4", Label: "Sièges pivotants", Description: "", Tag: "Fournitures", CPVCode: "39111100-4"},
	{FamilyNum: 17, FamilyLabel: "", Code: "CPV-39111200-5", Label: "Sièges de théâtre", Description: "", Tag: "Fournitures", CPVCode: "39111200-5"},
	{FamilyNum: 17, FamilyLabel: "", Code: "CPV-39111300-6", Label: "Sièges éjectables", Description: "", Tag: "Fournitures", CPVCode: "39111300-6"},
	{FamilyNum: 18, FamilyLabel: "", Code: "CPV-34121000-1", Label: "Autobus et cars", Description: "", Tag: "Fournitures", CPVCode: "34121000-1"},
	{FamilyNum: 18, FamilyLabel: "", Code: "CPV-34100000-8", Label: "Véhicules à moteur", Description: "", Tag: "Fournitures", CPVCode: "34100000-8"},
	{FamilyNum: 18, FamilyLabel: "", Code: "CPV-34110000-1", Label: "Voitures particulières", Description: "", Tag: "Fournitures", CPVCode: "34110000-1"},
	{FamilyNum: 18, FamilyLabel: "", Code: "CPV-34144900-7", Label: "Véhicules électriques", Description: "", Tag: "Fournitures", CPVCode: "34144900-7"},
	{FamilyNum: 18, FamilyLabel: "", Code: "CPV-34121100-2", Label: "Autobus publics", Description: "", Tag: "Fournitures", CPVCode: "34121100-2"},
	{FamilyNum: 18, FamilyLabel: "", Code: "CPV-34144000-8", Label: "Véhicules automobiles à usage spécifique", Description: "", Tag: "Fournitures", CPVCode: "34144000-8"},
	{FamilyNum: 18, FamilyLabel: "", Code: "CPV-34140000-0", Label: "Poids lourds", Description: "", Tag: "Fournitures", CPVCode: "34140000-0"},
	{FamilyNum: 18, FamilyLabel: "", Code: "CPV-34130000-7", Label: "Véhicules à moteur servant au transport de marchandises", Description: "", Tag: "Fournitures", CPVCode: "34130000-7"},
	{FamilyNum: 19, FamilyLabel: "", Code: "CPV-16000000-5", Label: "Machines agricoles", Description: "", Tag: "Fournitures", CPVCode: "16000000-5"},
	{FamilyNum: 19, FamilyLabel: "", Code: "CPV-16100000-6", Label: "Machines agricoles et sylvicoles pour la préparation ou la culture des sols", Description: "", Tag: "Fournitures", CPVCode: "16100000-6"},
	{FamilyNum: 19, FamilyLabel: "", Code: "CPV-16110000-9", Label: "Charrues ou herses à disques", Description: "", Tag: "Fournitures", CPVCode: "16110000-9"},
	{FamilyNum: 19, FamilyLabel: "", Code: "CPV-16120000-2", Label: "Herses, scarificateurs, cultivateurs, sarcleuses ou houes", Description: "", Tag: "Fournitures", CPVCode: "16120000-2"},
	{FamilyNum: 19, FamilyLabel: "", Code: "CPV-16130000-5", Label: "Semoirs, plantoirs ou repiqueurs", Description: "", Tag: "Fournitures", CPVCode: "16130000-5"},
	{FamilyNum: 19, FamilyLabel: "", Code: "CPV-16140000-8", Label: "Épandeurs de fumier", Description: "", Tag: "Fournitures", CPVCode: "16140000-8"},
	{FamilyNum: 19, FamilyLabel: "", Code: "CPV-16141000-5", Label: "Distributeurs d'engrais", Description: "", Tag: "Fournitures", CPVCode: "16141000-5"},
	{FamilyNum: 19, FamilyLabel: "", Code: "CPV-16150000-1", Label: "Rouleaux pour pelouses ou terrains de sports", Description: "", Tag: "Fournitures", CPVCode: "16150000-1"},
	{FamilyNum: 20, FamilyLabel: "", Code: "CPV-37400000-2", Label: "Articles et équipements de sport", Description: "", Tag: "Fournitures", CPVCode: "37400000-2"},
	{FamilyNum: 20, FamilyLabel: "", Code: "CPV-37410000-5", Label: "Équipements de sports de plein air", Description: "", Tag: "Fournitures", CPVCode: "37410000-5"},
	{FamilyNum: 20, FamilyLabel: "", Code: "CPV-37411000-2", Label: "Equipement d'hiver", Description: "", Tag: "Fournitures", CPVCode: "37411000-2"},
	{FamilyNum: 20, FamilyLabel: "", Code: "CPV-37411100-3", Label: "Equipement de ski et de planches à ski", Description: "", Tag: "Fournitures", CPVCode: "37411100-3"},
	{FamilyNum: 20, FamilyLabel: "", Code: "CPV-37411110-6", Label: "Bottes de ski", Description: "", Tag: "Fournitures", CPVCode: "37411110-6"},
	{FamilyNum: 20, FamilyLabel: "", Code: "CPV-37411120-9", Label: "Skis", Description: "", Tag: "Fournitures", CPVCode: "37411120-9"},
	{FamilyNum: 20, FamilyLabel: "", Code: "CPV-37411130-2", Label: "Bâtons de ski", Description: "", Tag: "Fournitures", CPVCode: "37411130-2"},
	{FamilyNum: 20, FamilyLabel: "", Code: "CPV-37411140-5", Label: "Fixations", Description: "", Tag: "Fournitures", CPVCode: "37411140-5"},
	{FamilyNum: 21, FamilyLabel: "", Code: "CPV-37000000-8", Label: "Instruments de musique, articles de sport, jeux, jouets, articles pour artisanat, articles pour travaux artistiques et accessoires", Description: "", Tag: "Fournitures", CPVCode: "37000000-8"},
	{FamilyNum: 21, FamilyLabel: "", Code: "CPV-37300000-1", Label: "Instruments de musique et pièces pour instruments de musique", Description: "", Tag: "Fournitures", CPVCode: "37300000-1"},
	{FamilyNum: 21, FamilyLabel: "", Code: "CPV-37310000-4", Label: "Instruments de musique", Description: "", Tag: "Fournitures", CPVCode: "37310000-4"},
	{FamilyNum: 21, FamilyLabel: "", Code: "CPV-37311000-1", Label: "Instruments à clavier", Description: "", Tag: "Fournitures", CPVCode: "37311000-1"},
	{FamilyNum: 21, FamilyLabel: "", Code: "CPV-37311100-2", Label: "Pianos", Description: "", Tag: "Fournitures", CPVCode: "37311100-2"},
	{FamilyNum: 21, FamilyLabel: "", Code: "CPV-37311200-3", Label: "Accordéons", Description: "", Tag: "Fournitures", CPVCode: "37311200-3"},
	{FamilyNum: 21, FamilyLabel: "", Code: "CPV-37311300-4", Label: "Orgues musicaux", Description: "", Tag: "Fournitures", CPVCode: "37311300-4"},
	{FamilyNum: 21, FamilyLabel: "", Code: "CPV-37311400-5", Label: "Célestas", Description: "", Tag: "Fournitures", CPVCode: "37311400-5"},
	{FamilyNum: 22, FamilyLabel: "", Code: "CPV-45220000-5", Label: "Ouvrages d'art et de génie civil", Description: "", Tag: "Fournitures", CPVCode: "45220000-5"},
	{FamilyNum: 22, FamilyLabel: "", Code: "CPV-45221000-2", Label: "Travaux de construction de ponts et de tunnels, de puits et de passages souterrains", Description: "", Tag: "Fournitures", CPVCode: "45221000-2"},
	{FamilyNum: 22, FamilyLabel: "", Code: "CPV-45221100-3", Label: "Travaux de construction de ponts", Description: "", Tag: "Fournitures", CPVCode: "45221100-3"},
	{FamilyNum: 22, FamilyLabel: "", Code: "CPV-45221110-6", Label: "Travaux de construction de ponts", Description: "", Tag: "Fournitures", CPVCode: "45221110-6"},
	{FamilyNum: 22, FamilyLabel: "", Code: "CPV-45221120-9", Label: "Travaux de construction de viaducs", Description: "", Tag: "Fournitures", CPVCode: "45221120-9"},
	{FamilyNum: 22, FamilyLabel: "", Code: "CPV-45221200-4", Label: "Travaux de construction de tunnels, de puits et de passages souterrains", Description: "", Tag: "Fournitures", CPVCode: "45221200-4"},
	{FamilyNum: 22, FamilyLabel: "", Code: "CPV-45221210-7", Label: "Excavations couvertes ou partiellement couvertes", Description: "", Tag: "Fournitures", CPVCode: "45221210-7"},
	{FamilyNum: 22, FamilyLabel: "", Code: "CPV-45221220-0", Label: "Ponceaux", Description: "", Tag: "Fournitures", CPVCode: "45221220-0"},
	{FamilyNum: 23, FamilyLabel: "", Code: "CPV-31681200-5", Label: "Pompes électriques", Description: "", Tag: "Fournitures", CPVCode: "31681200-5"},
	{FamilyNum: 23, FamilyLabel: "", Code: "CPV-31681300-6", Label: "Circuits électriques", Description: "", Tag: "Fournitures", CPVCode: "31681300-6"},
	{FamilyNum: 23, FamilyLabel: "", Code: "CPV-31681400-7", Label: "Composants électriques", Description: "", Tag: "Fournitures", CPVCode: "31681400-7"},
	{FamilyNum: 23, FamilyLabel: "", Code: "CPV-31681410-0", Label: "Matériels électriques", Description: "", Tag: "Fournitures", CPVCode: "31681410-0"},
	{FamilyNum: 23, FamilyLabel: "", Code: "CPV-31681500-8", Label: "Rechargeurs", Description: "", Tag: "Fournitures", CPVCode: "31681500-8"},
	{FamilyNum: 23, FamilyLabel: "", Code: "CPV-31682000-0", Label: "Approvisionnement en électricité", Description: "", Tag: "Fournitures", CPVCode: "31682000-0"},
	{FamilyNum: 23, FamilyLabel: "", Code: "CPV-31682100-1", Label: "Coffres électriques", Description: "", Tag: "Fournitures", CPVCode: "31682100-1"},
	{FamilyNum: 23, FamilyLabel: "", Code: "CPV-31682110-4", Label: "Couvercles de coffret de branchement", Description: "", Tag: "Fournitures", CPVCode: "31682110-4"},
	{FamilyNum: 24, FamilyLabel: "", Code: "CPV-24000000-4", Label: "Produits chimiques", Description: "", Tag: "Fournitures", CPVCode: "24000000-4"},
	{FamilyNum: 24, FamilyLabel: "", Code: "CPV-24100000-5", Label: "Gaz", Description: "", Tag: "Fournitures", CPVCode: "24100000-5"},
	{FamilyNum: 24, FamilyLabel: "", Code: "CPV-24110000-8", Label: "Gaz industriels", Description: "", Tag: "Fournitures", CPVCode: "24110000-8"},
	{FamilyNum: 24, FamilyLabel: "", Code: "CPV-24111000-5", Label: "Hydrogène, argon, gaz rares, azote et oxygène", Description: "", Tag: "Fournitures", CPVCode: "24111000-5"},
	{FamilyNum: 24, FamilyLabel: "", Code: "CPV-24111100-6", Label: "Argon", Description: "", Tag: "Fournitures", CPVCode: "24111100-6"},
	{FamilyNum: 24, FamilyLabel: "", Code: "CPV-24111200-7", Label: "Gaz rares", Description: "", Tag: "Fournitures", CPVCode: "24111200-7"},
	{FamilyNum: 24, FamilyLabel: "", Code: "CPV-24111300-8", Label: "Hélium", Description: "", Tag: "Fournitures", CPVCode: "24111300-8"},
	{FamilyNum: 24, FamilyLabel: "", Code: "CPV-24111400-9", Label: "Néon", Description: "", Tag: "Fournitures", CPVCode: "24111400-9"},
	{FamilyNum: 25, FamilyLabel: "", Code: "CPV-33000000-0", Label: "Matériels médicaux, pharmaceutiques et produits de soins personnnels", Description: "", Tag: "Fournitures", CPVCode: "33000000-0"},
	{FamilyNum: 25, FamilyLabel: "", Code: "CPV-33100000-1", Label: "Equipements médicaux", Description: "", Tag: "Fournitures", CPVCode: "33100000-1"},
	{FamilyNum: 25, FamilyLabel: "", Code: "CPV-33110000-4", Label: "Matériel d'imagerie à usage médical, dentaire et vétérinaire", Description: "", Tag: "Fournitures", CPVCode: "33110000-4"},
	{FamilyNum: 25, FamilyLabel: "", Code: "CPV-33111000-1", Label: "Appareils de radiographie", Description: "", Tag: "Fournitures", CPVCode: "33111000-1"},
	{FamilyNum: 25, FamilyLabel: "", Code: "CPV-33111100-2", Label: "Table de radiologie", Description: "", Tag: "Fournitures", CPVCode: "33111100-2"},
	{FamilyNum: 25, FamilyLabel: "", Code: "CPV-33111200-3", Label: "Postes de travail de radiologie", Description: "", Tag: "Fournitures", CPVCode: "33111200-3"},
	{FamilyNum: 25, FamilyLabel: "", Code: "CPV-33111300-4", Label: "Machines à développer radiologiques", Description: "", Tag: "Fournitures", CPVCode: "33111300-4"},
	{FamilyNum: 25, FamilyLabel: "", Code: "CPV-33111400-5", Label: "Fluoroscopes", Description: "", Tag: "Fournitures", CPVCode: "33111400-5"},
	{FamilyNum: 60, FamilyLabel: "", Code: "CPV-64121000-0", Label: "Services multimodaux de courrier", Description: "", Tag: "Services", CPVCode: "64121000-0"},
	{FamilyNum: 60, FamilyLabel: "", Code: "CPV-64121100-1", Label: "Services de distribution de courrier", Description: "", Tag: "Services", CPVCode: "64121100-1"},
	{FamilyNum: 60, FamilyLabel: "", Code: "CPV-64121200-2", Label: "Services de livraison de colis", Description: "", Tag: "Services", CPVCode: "64121200-2"},
	{FamilyNum: 60, FamilyLabel: "", Code: "CPV-64122000-7", Label: "Services de courrier et de messagerie interne des administrations", Description: "", Tag: "Services", CPVCode: "64122000-7"},
	{FamilyNum: 60, FamilyLabel: "", Code: "CPV-60160000-7", Label: "Transport routier postal", Description: "", Tag: "Services", CPVCode: "60160000-7"},
	{FamilyNum: 60, FamilyLabel: "", Code: "CPV-60161000-4", Label: "Services de transport de colis", Description: "", Tag: "Services", CPVCode: "60161000-4"},
	{FamilyNum: 60, FamilyLabel: "", Code: "CPV-60112000-6", Label: "Services de transport routier public", Description: "", Tag: "Services", CPVCode: "60112000-6"},
	{FamilyNum: 60, FamilyLabel: "", Code: "CPV-60130000-8", Label: "Services spécialisés de transport routier de passagers", Description: "", Tag: "Services", CPVCode: "60130000-8"},
	{FamilyNum: 61, FamilyLabel: "", Code: "CPV-45210000-2", Label: "Travaux de construction de bâtiments", Description: "", Tag: "Services", CPVCode: "45210000-2"},
	{FamilyNum: 61, FamilyLabel: "", Code: "CPV-45211000-9", Label: "Travaux de construction d'immeubles collectifs et de maisons individuelles", Description: "", Tag: "Services", CPVCode: "45211000-9"},
	{FamilyNum: 61, FamilyLabel: "", Code: "CPV-45211100-0", Label: "Travaux de construction de maisons", Description: "", Tag: "Services", CPVCode: "45211100-0"},
	{FamilyNum: 61, FamilyLabel: "", Code: "CPV-45211200-1", Label: "Travaux de construction de logements-foyers", Description: "", Tag: "Services", CPVCode: "45211200-1"},
	{FamilyNum: 61, FamilyLabel: "", Code: "CPV-45211300-2", Label: "Travaux de construction complète de maisons", Description: "", Tag: "Services", CPVCode: "45211300-2"},
	{FamilyNum: 61, FamilyLabel: "", Code: "CPV-45211310-5", Label: "Travaux de construction de salles de bains", Description: "", Tag: "Services", CPVCode: "45211310-5"},
	{FamilyNum: 61, FamilyLabel: "", Code: "CPV-45211320-8", Label: "Travaux de construction de porches", Description: "", Tag: "Services", CPVCode: "45211320-8"},
	{FamilyNum: 61, FamilyLabel: "", Code: "CPV-45211340-4", Label: "Travaux de construction  d'immeubles collectifs", Description: "", Tag: "Services", CPVCode: "45211340-4"},
	{FamilyNum: 62, FamilyLabel: "", Code: "CPV-72500000-0", Label: "Services informatiques", Description: "", Tag: "Services", CPVCode: "72500000-0"},
	{FamilyNum: 62, FamilyLabel: "", Code: "CPV-72510000-3", Label: "Services de gestion relatifs à l'informatique", Description: "", Tag: "Services", CPVCode: "72510000-3"},
	{FamilyNum: 62, FamilyLabel: "", Code: "CPV-72511000-0", Label: "Services de logiciels de gestion de réseau", Description: "", Tag: "Services", CPVCode: "72511000-0"},
	{FamilyNum: 62, FamilyLabel: "", Code: "CPV-72512000-7", Label: "Services de gestion de documents", Description: "", Tag: "Services", CPVCode: "72512000-7"},
	{FamilyNum: 62, FamilyLabel: "", Code: "CPV-51611100-9", Label: "Services d'installation de matériel informatique", Description: "", Tag: "Services", CPVCode: "51611100-9"},
	{FamilyNum: 62, FamilyLabel: "", Code: "CPV-51600000-8", Label: "Services d'installation d'ordinateurs et de matériel de bureau", Description: "", Tag: "Services", CPVCode: "51600000-8"},
	{FamilyNum: 62, FamilyLabel: "", Code: "CPV-51610000-1", Label: "Services d'installation d'ordinateurs et de matériel de traitement de l'information", Description: "", Tag: "Services", CPVCode: "51610000-1"},
	{FamilyNum: 62, FamilyLabel: "", Code: "CPV-51612000-5", Label: "Services d'installation de matériel de traitement de l'information", Description: "", Tag: "Services", CPVCode: "51612000-5"},
	{FamilyNum: 63, FamilyLabel: "", Code: "CPV-32524000-2", Label: "Système de télécommunications", Description: "", Tag: "Services", CPVCode: "32524000-2"},
	{FamilyNum: 63, FamilyLabel: "", Code: "CPV-32412100-5", Label: "Réseau de télécommunications", Description: "", Tag: "Services", CPVCode: "32412100-5"},
	{FamilyNum: 63, FamilyLabel: "", Code: "CPV-32500000-8", Label: "Matériel de télécommunications", Description: "", Tag: "Services", CPVCode: "32500000-8"},
	{FamilyNum: 63, FamilyLabel: "", Code: "CPV-32420000-3", Label: "Matériel de réseau", Description: "", Tag: "Services", CPVCode: "32420000-3"},
	{FamilyNum: 63, FamilyLabel: "", Code: "CPV-32323500-8", Label: "Système de surveillance vidéo", Description: "", Tag: "Services", CPVCode: "32323500-8"},
	{FamilyNum: 63, FamilyLabel: "", Code: "CPV-32522000-8", Label: "Équipements de télécommunications", Description: "", Tag: "Services", CPVCode: "32522000-8"},
	{FamilyNum: 63, FamilyLabel: "", Code: "CPV-32424000-1", Label: "Infrastructure de réseau", Description: "", Tag: "Services", CPVCode: "32424000-1"},
	{FamilyNum: 63, FamilyLabel: "", Code: "CPV-32400000-7", Label: "Réseaux", Description: "", Tag: "Services", CPVCode: "32400000-7"},
	{FamilyNum: 64, FamilyLabel: "", Code: "CPV-71000000-8", Label: "Services d'architecture, services de construction, services d'ingénierie et services d'inspection", Description: "", Tag: "Services", CPVCode: "71000000-8"},
	{FamilyNum: 64, FamilyLabel: "", Code: "CPV-71200000-0", Label: "Services d'architecture", Description: "", Tag: "Services", CPVCode: "71200000-0"},
	{FamilyNum: 64, FamilyLabel: "", Code: "CPV-71210000-3", Label: "Services de conseil en architecture", Description: "", Tag: "Services", CPVCode: "71210000-3"},
	{FamilyNum: 64, FamilyLabel: "", Code: "CPV-71220000-6", Label: "Services de création architecturale", Description: "", Tag: "Services", CPVCode: "71220000-6"},
	{FamilyNum: 64, FamilyLabel: "", Code: "CPV-71221000-3", Label: "Services d'architecte pour les bâtiments", Description: "", Tag: "Services", CPVCode: "71221000-3"},
	{FamilyNum: 64, FamilyLabel: "", Code: "CPV-71222000-0", Label: "Services d'architecte pour la conception d'ouvrages extérieurs", Description: "", Tag: "Services", CPVCode: "71222000-0"},
	{FamilyNum: 64, FamilyLabel: "", Code: "CPV-71222100-1", Label: "Services de cartographie des zones urbaines", Description: "", Tag: "Services", CPVCode: "71222100-1"},
	{FamilyNum: 64, FamilyLabel: "", Code: "CPV-71222200-2", Label: "Services de cartographie des zones rurales", Description: "", Tag: "Services", CPVCode: "71222200-2"},
	{FamilyNum: 65, FamilyLabel: "", Code: "CPV-66500000-5", Label: "Services d'assurance et de retraite", Description: "", Tag: "Services", CPVCode: "66500000-5"},
	{FamilyNum: 65, FamilyLabel: "", Code: "CPV-66510000-8", Label: "Services d'assurance", Description: "", Tag: "Services", CPVCode: "66510000-8"},
	{FamilyNum: 65, FamilyLabel: "", Code: "CPV-66512000-2", Label: "Services d'assurance contre les accidents et les maladies", Description: "", Tag: "Services", CPVCode: "66512000-2"},
	{FamilyNum: 65, FamilyLabel: "", Code: "CPV-66513000-9", Label: "Services d'assurance de responsabilité civile", Description: "", Tag: "Services", CPVCode: "66513000-9"},
	{FamilyNum: 65, FamilyLabel: "", Code: "CPV-66514000-6", Label: "Services d'assurance de transport de marchandises", Description: "", Tag: "Services", CPVCode: "66514000-6"},
	{FamilyNum: 65, FamilyLabel: "", Code: "CPV-66515000-3", Label: "Services d'assurance contre les dommages et pertes de biens", Description: "", Tag: "Services", CPVCode: "66515000-3"},
	{FamilyNum: 65, FamilyLabel: "", Code: "CPV-66516000-0", Label: "Services d'assurance de responsabilité civile générale", Description: "", Tag: "Services", CPVCode: "66516000-0"},
	{FamilyNum: 65, FamilyLabel: "", Code: "CPV-66517000-7", Label: "Services d'assurance de protection juridique", Description: "", Tag: "Services", CPVCode: "66517000-7"},
	{FamilyNum: 66, FamilyLabel: "", Code: "CPV-90900000-6", Label: "Services de nettoyage et d'hygiène", Description: "", Tag: "Services", CPVCode: "90900000-6"},
	{FamilyNum: 66, FamilyLabel: "", Code: "CPV-90910000-9", Label: "Services de nettoyage", Description: "", Tag: "Services", CPVCode: "90910000-9"},
	{FamilyNum: 66, FamilyLabel: "", Code: "CPV-90911000-6", Label: "Services de nettoyage de logements, de bâtiments et de vitres", Description: "", Tag: "Services", CPVCode: "90911000-6"},
	{FamilyNum: 66, FamilyLabel: "", Code: "CPV-90911100-7", Label: "Services de nettoyage de logements", Description: "", Tag: "Services", CPVCode: "90911100-7"},
	{FamilyNum: 66, FamilyLabel: "", Code: "CPV-90911200-8", Label: "Services de nettoyage de bâtiments", Description: "", Tag: "Services", CPVCode: "90911200-8"},
	{FamilyNum: 66, FamilyLabel: "", Code: "CPV-90911300-9", Label: "Services de nettoyage de vitres", Description: "", Tag: "Services", CPVCode: "90911300-9"},
	{FamilyNum: 66, FamilyLabel: "", Code: "CPV-90912000-3", Label: "Services de nettoyage par soufflage de structures tubolaires", Description: "", Tag: "Services", CPVCode: "90912000-3"},
	{FamilyNum: 66, FamilyLabel: "", Code: "CPV-90913000-0", Label: "Services de nettoyage de cuves et de réservoirs", Description: "", Tag: "Services", CPVCode: "90913000-0"},
	{FamilyNum: 67, FamilyLabel: "", Code: "CPV-77300000-3", Label: "Services horticoles", Description: "", Tag: "Services", CPVCode: "77300000-3"},
	{FamilyNum: 67, FamilyLabel: "", Code: "CPV-77310000-6", Label: "Réalisation et entretien d'espaces verts", Description: "", Tag: "Services", CPVCode: "77310000-6"},
	{FamilyNum: 67, FamilyLabel: "", Code: "CPV-77311000-3", Label: "Entretien de pelouses décoratives ou d'agrément", Description: "", Tag: "Services", CPVCode: "77311000-3"},
	{FamilyNum: 67, FamilyLabel: "", Code: "CPV-77312000-0", Label: "Services d'enlèvement des mauvaises herbes", Description: "", Tag: "Services", CPVCode: "77312000-0"},
	{FamilyNum: 67, FamilyLabel: "", Code: "CPV-77312100-1", Label: "Services de désherbage", Description: "", Tag: "Services", CPVCode: "77312100-1"},
	{FamilyNum: 67, FamilyLabel: "", Code: "CPV-77313000-7", Label: "Services d'entretien de parcs", Description: "", Tag: "Services", CPVCode: "77313000-7"},
	{FamilyNum: 67, FamilyLabel: "", Code: "CPV-77314000-4", Label: "Services d'entretien de terrains", Description: "", Tag: "Services", CPVCode: "77314000-4"},
	{FamilyNum: 67, FamilyLabel: "", Code: "CPV-77314100-5", Label: "Services d'engazonnement", Description: "", Tag: "Services", CPVCode: "77314100-5"},
	{FamilyNum: 68, FamilyLabel: "", Code: "CPV-79530000-8", Label: "Services de traduction", Description: "", Tag: "Services", CPVCode: "79530000-8"},
	{FamilyNum: 68, FamilyLabel: "", Code: "CPV-79540000-1", Label: "Services d'interprétation", Description: "", Tag: "Services", CPVCode: "79540000-1"},
	{FamilyNum: 68, FamilyLabel: "", Code: "CPV-79340000-9", Label: "Services de publicité et de marketing", Description: "", Tag: "Services", CPVCode: "79340000-9"},
	{FamilyNum: 68, FamilyLabel: "", Code: "CPV-79341000-6", Label: "Services de publicité", Description: "", Tag: "Services", CPVCode: "79341000-6"},
	{FamilyNum: 68, FamilyLabel: "", Code: "CPV-79341100-7", Label: "Services de conseils en publicité", Description: "", Tag: "Services", CPVCode: "79341100-7"},
	{FamilyNum: 68, FamilyLabel: "", Code: "CPV-79341200-8", Label: "Services de gestion publicitaire", Description: "", Tag: "Services", CPVCode: "79341200-8"},
	{FamilyNum: 68, FamilyLabel: "", Code: "CPV-79341400-0", Label: "Services de campagne publicitaire", Description: "", Tag: "Services", CPVCode: "79341400-0"},
	{FamilyNum: 68, FamilyLabel: "", Code: "CPV-79341500-1", Label: "Services de publicité par voie aérienne ", Description: "", Tag: "Services", CPVCode: "79341500-1"},
	{FamilyNum: 69, FamilyLabel: "", Code: "CPV-80000000-4", Label: "Services d'enseignement et de formation", Description: "", Tag: "Services", CPVCode: "80000000-4"},
	{FamilyNum: 69, FamilyLabel: "", Code: "CPV-80100000-5", Label: "Services d'enseignement primaire", Description: "", Tag: "Services", CPVCode: "80100000-5"},
	{FamilyNum: 69, FamilyLabel: "", Code: "CPV-80110000-8", Label: "Services d'enseignement préscolaire", Description: "", Tag: "Services", CPVCode: "80110000-8"},
	{FamilyNum: 69, FamilyLabel: "", Code: "CPV-80200000-6", Label: "Services d'enseignement secondaire", Description: "", Tag: "Services", CPVCode: "80200000-6"},
	{FamilyNum: 69, FamilyLabel: "", Code: "CPV-80210000-9", Label: "Services d'enseignement secondaire technique et professionnel", Description: "", Tag: "Services", CPVCode: "80210000-9"},
	{FamilyNum: 69, FamilyLabel: "", Code: "CPV-80211000-6", Label: "Services d'enseignement secondaire technique", Description: "", Tag: "Services", CPVCode: "80211000-6"},
	{FamilyNum: 69, FamilyLabel: "", Code: "CPV-80212000-3", Label: "Services d'enseignement secondaire professionnel", Description: "", Tag: "Services", CPVCode: "80212000-3"},
	{FamilyNum: 69, FamilyLabel: "", Code: "CPV-80300000-7", Label: "Services d'enseignement supérieur", Description: "", Tag: "Services", CPVCode: "80300000-7"},
	{FamilyNum: 70, FamilyLabel: "", Code: "CPV-85300000-2", Label: "Services d'action sociale et services connexes", Description: "", Tag: "Services", CPVCode: "85300000-2"},
	{FamilyNum: 70, FamilyLabel: "", Code: "CPV-85310000-5", Label: "Services d'action sociale", Description: "", Tag: "Services", CPVCode: "85310000-5"},
	{FamilyNum: 70, FamilyLabel: "", Code: "CPV-85311000-2", Label: "Services d'action sociale avec hébergement", Description: "", Tag: "Services", CPVCode: "85311000-2"},
	{FamilyNum: 70, FamilyLabel: "", Code: "CPV-85311100-3", Label: "Services sociaux pour les personnes âgées", Description: "", Tag: "Services", CPVCode: "85311100-3"},
	{FamilyNum: 70, FamilyLabel: "", Code: "CPV-85311200-4", Label: "Services sociaux pour les personnes handicapées", Description: "", Tag: "Services", CPVCode: "85311200-4"},
	{FamilyNum: 70, FamilyLabel: "", Code: "CPV-85311300-5", Label: "Services sociaux pour les enfants et les adolescents", Description: "", Tag: "Services", CPVCode: "85311300-5"},
	{FamilyNum: 70, FamilyLabel: "", Code: "CPV-85312000-9", Label: "Services sociaux sans hébergement", Description: "", Tag: "Services", CPVCode: "85312000-9"},
	{FamilyNum: 70, FamilyLabel: "", Code: "CPV-85312100-0", Label: "Services de foyers de jour", Description: "", Tag: "Services", CPVCode: "85312100-0"},
	{FamilyNum: 71, FamilyLabel: "", Code: "CPV-79950000-8", Label: "Services d'organisation d'expositions, de foires et de congrès", Description: "", Tag: "Services", CPVCode: "79950000-8"},
	{FamilyNum: 71, FamilyLabel: "", Code: "CPV-79951000-5", Label: "Services d'organisation de séminaires", Description: "", Tag: "Services", CPVCode: "79951000-5"},
	{FamilyNum: 71, FamilyLabel: "", Code: "CPV-79952000-2", Label: "Services d'organisation d'évènements ", Description: "", Tag: "Services", CPVCode: "79952000-2"},
	{FamilyNum: 71, FamilyLabel: "", Code: "CPV-79952100-3", Label: "Services d'organisation d'évènements culturels", Description: "", Tag: "Services", CPVCode: "79952100-3"},
	{FamilyNum: 71, FamilyLabel: "", Code: "CPV-79953000-9", Label: "Services d'organisation de festivals", Description: "", Tag: "Services", CPVCode: "79953000-9"},
	{FamilyNum: 71, FamilyLabel: "", Code: "CPV-79954000-6", Label: "Services d'organisation de fêtes", Description: "", Tag: "Services", CPVCode: "79954000-6"},
	{FamilyNum: 71, FamilyLabel: "", Code: "CPV-79955000-3", Label: "Services d'organisation de défilés de mode", Description: "", Tag: "Services", CPVCode: "79955000-3"},
	{FamilyNum: 71, FamilyLabel: "", Code: "CPV-79956000-0", Label: "Services d'organisation de foires et d'expositions", Description: "", Tag: "Services", CPVCode: "79956000-0"},
	{FamilyNum: 72, FamilyLabel: "", Code: "CPV-98513200-4", Label: "Services de personnel de bureau pour les particuliers", Description: "", Tag: "Services", CPVCode: "98513200-4"},
	{FamilyNum: 72, FamilyLabel: "", Code: "CPV-98513300-5", Label: "Services de personnel temporaire pour les particuliers", Description: "", Tag: "Services", CPVCode: "98513300-5"},
	{FamilyNum: 72, FamilyLabel: "", Code: "CPV-98513310-8", Label: "Services d'aide à domicile", Description: "", Tag: "Services", CPVCode: "98513310-8"},
	{FamilyNum: 72, FamilyLabel: "", Code: "CPV-98514000-9", Label: "Services domestiques", Description: "", Tag: "Services", CPVCode: "98514000-9"},
	{FamilyNum: 72, FamilyLabel: "", Code: "CPV-98900000-2", Label: "Services prestés par des organisations et des organismes extra-territoriaux", Description: "", Tag: "Services", CPVCode: "98900000-2"},
	{FamilyNum: 72, FamilyLabel: "", Code: "CPV-98910000-5", Label: "Services spécifiques aux organisations et aux organismes internationaux", Description: "", Tag: "Services", CPVCode: "98910000-5"},
	{FamilyNum: 72, FamilyLabel: "", Code: "CPV-35111300-8", Label: "Appareils extincteurs", Description: "", Tag: "Services", CPVCode: "35111300-8"},
	{FamilyNum: 72, FamilyLabel: "", Code: "CPV-35111310-1", Label: "Mousse pour extincteurs", Description: "", Tag: "Services", CPVCode: "35111310-1"},
	{FamilyNum: 73, FamilyLabel: "", Code: "CPV-50000000-5", Label: "Services de réparation et d'entretien", Description: "", Tag: "Services", CPVCode: "50000000-5"},
	{FamilyNum: 73, FamilyLabel: "", Code: "CPV-50100000-6", Label: "Services de réparation et d'entretien de véhicules et équipements", Description: "", Tag: "Services", CPVCode: "50100000-6"},
	{FamilyNum: 73, FamilyLabel: "", Code: "CPV-50300000-8", Label: "Services de réparation et d'entretien de PC et de bureau", Description: "", Tag: "Services", CPVCode: "50300000-8"},
	{FamilyNum: 73, FamilyLabel: "", Code: "CPV-50700000-2", Label: "Services de réparation et d'entretien d'installations de bâtiments", Description: "", Tag: "Services", CPVCode: "50700000-2"},
	{FamilyNum: 73, FamilyLabel: "", Code: "CPV-50710000-5", Label: "Services de réparation et d'entretien d'équipements électriques et mécaniques", Description: "", Tag: "Services", CPVCode: "50710000-5"},
	{FamilyNum: 73, FamilyLabel: "", Code: "CPV-50720000-8", Label: "Services de réparation et d'entretien de chauffage central", Description: "", Tag: "Services", CPVCode: "50720000-8"},
	{FamilyNum: 73, FamilyLabel: "", Code: "CPV-50800000-3", Label: "Services divers de réparation et d'entretien", Description: "", Tag: "Services", CPVCode: "50800000-3"},
	{FamilyNum: 73, FamilyLabel: "", Code: "CPV-50830000-2", Label: "Services d'entretien de vêtements et articles connexes", Description: "", Tag: "Services", CPVCode: "50830000-2"},
	{FamilyNum: 74, FamilyLabel: "", Code: "CPV-79100000-5", Label: "Services juridiques", Description: "", Tag: "Services", CPVCode: "79100000-5"},
	{FamilyNum: 74, FamilyLabel: "", Code: "CPV-79110000-8", Label: "Services de conseils et de représentation juridiques", Description: "", Tag: "Services", CPVCode: "79110000-8"},
	{FamilyNum: 74, FamilyLabel: "", Code: "CPV-79111000-5", Label: "Services de conseils juridiques", Description: "", Tag: "Services", CPVCode: "79111000-5"},
	{FamilyNum: 74, FamilyLabel: "", Code: "CPV-79112000-2", Label: "Services de représentation juridique", Description: "", Tag: "Services", CPVCode: "79112000-2"},
	{FamilyNum: 74, FamilyLabel: "", Code: "CPV-79120000-1", Label: "Services de brevets et de droits d'auteur", Description: "", Tag: "Services", CPVCode: "79120000-1"},
	{FamilyNum: 74, FamilyLabel: "", Code: "CPV-79130000-4", Label: "Services de documentation et de certification juridiques", Description: "", Tag: "Services", CPVCode: "79130000-4"},
	{FamilyNum: 74, FamilyLabel: "", Code: "CPV-79140000-7", Label: "Services de conseil et d'information juridiques", Description: "", Tag: "Services", CPVCode: "79140000-7"},
	{FamilyNum: 74, FamilyLabel: "", Code: "CPV-79150000-0", Label: "Services de notariat", Description: "", Tag: "Services", CPVCode: "79150000-0"},
	{FamilyNum: 75, FamilyLabel: "", Code: "CPV-79200000-6", Label: "Services de comptabilité, d'audit et fiscaux", Description: "", Tag: "Services", CPVCode: "79200000-6"},
	{FamilyNum: 75, FamilyLabel: "", Code: "CPV-79210000-9", Label: "Services de comptabilité et d'audit", Description: "", Tag: "Services", CPVCode: "79210000-9"},
	{FamilyNum: 75, FamilyLabel: "", Code: "CPV-79211000-6", Label: "Services de comptabilité", Description: "", Tag: "Services", CPVCode: "79211000-6"},
	{FamilyNum: 75, FamilyLabel: "", Code: "CPV-79212000-3", Label: "Services d'audit", Description: "", Tag: "Services", CPVCode: "79212000-3"},
	{FamilyNum: 75, FamilyLabel: "", Code: "CPV-79212100-4", Label: "Services d'audit financier", Description: "", Tag: "Services", CPVCode: "79212100-4"},
	{FamilyNum: 75, FamilyLabel: "", Code: "CPV-79220000-2", Label: "Services fiscaux", Description: "", Tag: "Services", CPVCode: "79220000-2"},
	{FamilyNum: 75, FamilyLabel: "", Code: "CPV-79221000-9", Label: "Services de conseil fiscal", Description: "", Tag: "Services", CPVCode: "79221000-9"},
	{FamilyNum: 75, FamilyLabel: "", Code: "CPV-79230000-5", Label: "Services de traitement et de préparation de données", Description: "", Tag: "Services", CPVCode: "79230000-5"},
}

// SystemTags — predefined tags seeded for every tenant.
// Category tags (Fournitures/Services/Travaux) are auto-assigned to nodes based on their tag field.
var SystemTags = []struct {
	Name     string
	Color    string
	Category string // if set, auto-assign to all nodes with matching Tag field
}{
	// Category tags — auto-assigned
	{Name: "Fournitures", Color: "#22c55e", Category: "Fournitures"},
	{Name: "Services", Color: "#60a5fa", Category: "Services"},
	{Name: "Travaux", Color: "#fb923c", Category: "Travaux"},
	// Regulatory tags — auto-assigned to all code-level nodes
	{Name: "Marché public", Color: "#10b981", Category: "*"},
	// Manual tags
	{Name: "MAPA", Color: "#f59e0b"},
	{Name: "Appel d'offres", Color: "#3b82f6"},
	{Name: "Accord-cadre", Color: "#06b6d4"},
	{Name: "Urgent", Color: "#ef4444"},
	{Name: "Stratégique", Color: "#8b5cf6"},
	{Name: "Non conforme", Color: "#f97316"},
	{Name: "À réviser", Color: "#ec4899"},
}

// seedNomenclatureNationale populates the nomenclature table for a given org.
// It creates:
//   - 3 grande-famille nodes (Fournitures, Services, Travaux)
//   - 1 famille node per family number (V1) + 8 CPV Travaux familles
//   - 1 code node per leaf entry (175 F/S + ~56 Travaux)
// All nodes are marked is_national=true and version="2024".
func seedNomenclatureNationale(db *gorm.DB, orgID uuid.UUID) {
	// Regulatory thresholds — France 2024
	const (
		seuilMapa float64 = 40_000
		seuilAOfs float64 = 221_000   // fournitures & services
		seuilAOt  float64 = 5_382_000 // travaux
	)

	makeNode := func(code, label, desc, typ, tag string, parentID *uuid.UUID, seuilMapa, seuilAO float64) nomenclaturemod.NomenclatureNode {
		return nomenclaturemod.NomenclatureNode{
			TenantID:    orgID,
			Code:        code,
			Label:       label,
			Description: desc,
			Type:        typ,
			Tag:         tag,
			ParentID:    parentID,
			SeuilMapa:   seuilMapa,
			SeuilAO:     seuilAO,
			Conforme:    true,
			IsNational:  true,
			Version:     "2024",
		}
	}

	// ── Grande familles ────────────────────────────────────────
	gfFournitures := makeNode("GF-F", "Fournitures", "Fournitures, matériels et équipements", "grande-famille", "Fournitures", nil, seuilMapa, seuilAOfs)
	gfServices    := makeNode("GF-S", "Services",    "Prestations de services",               "grande-famille", "Services",    nil, seuilMapa, seuilAOfs)
	gfTravaux     := makeNode("GF-T", "Travaux",     "Travaux de construction et maintenance", "grande-famille", "Travaux",     nil, seuilMapa, seuilAOt)
	db.Create(&gfFournitures)
	db.Create(&gfServices)
	db.Create(&gfTravaux)

	// ── Familles ───────────────────────────────────────────────
	// family number -> NomenclatureNode
	famNodes := map[int]nomenclaturemod.NomenclatureNode{}

	type famDef struct {
		num   int
		label string
		tag   string
	}
	var famDefs []famDef
	seenFam := map[int]bool{}
	for _, e := range NomenclatureNationale {
		if !seenFam[e.FamilyNum] {
			seenFam[e.FamilyNum] = true
			famDefs = append(famDefs, famDef{num: e.FamilyNum, label: e.FamilyLabel, tag: e.Tag})
		}
	}

	for _, f := range famDefs {
		var parentID *uuid.UUID
		var seuilAO float64
		if strings.EqualFold(f.tag, "Services") {
			parentID = &gfServices.ID
			seuilAO = seuilAOfs
		} else {
			parentID = &gfFournitures.ID
			seuilAO = seuilAOfs
		}
		code := fmt.Sprintf("%d", f.num)
		node := makeNode(code, f.label, "", "famille", f.tag, parentID, seuilMapa, seuilAO)
		db.Create(&node)
		famNodes[f.num] = node
	}

	// ── Codes feuilles F/S (V1 internal) ─────────────────────
	for _, e := range NomenclatureNationale {
		famNode, ok := famNodes[e.FamilyNum]
		if !ok {
			continue
		}
		node := makeNode(e.Code, e.Label, e.Description, "code", e.Tag, &famNode.ID, seuilMapa, seuilAOfs)
		node.CPVCode = e.CPVCode
		db.Create(&node)
	}

	// ── Codes CPV additionnels F/S ────────────────────────────
	for _, e := range NomenclatureCPVExtra {
		famNode, ok := famNodes[e.FamilyNum]
		if !ok {
			continue
		}
		node := makeNode(e.Code, e.Label, e.Description, "code", e.Tag, &famNode.ID, seuilMapa, seuilAOfs)
		node.CPVCode = e.CPVCode
		db.Create(&node)
	}

	// ── Travaux (CPV) ──────────────────────────────────────────
	travFamNodes := map[string]nomenclaturemod.NomenclatureNode{}
	for _, e := range NomenclatureTravaux {
		if _, exists := travFamNodes[e.FamilyCode]; !exists {
			node := makeNode(e.FamilyCode, e.FamilyLabel, "", "famille", "Travaux", &gfTravaux.ID, seuilMapa, seuilAOt)
			db.Create(&node)
			travFamNodes[e.FamilyCode] = node
		}
	}
	for _, e := range NomenclatureTravaux {
		famNode := travFamNodes[e.FamilyCode]
		node := makeNode(e.CPVCode, e.Label, "", "code", "Travaux", &famNode.ID, seuilMapa, seuilAOt)
		node.CPVCode = e.CPVCode
		db.Create(&node)
	}

	// ── Simulated amounts (deterministic pseudo-random) ────────
	{
		type codeNodeRow struct {
			ID  uuid.UUID
			Code string
			Tag  string
		}
		var codeNodes []codeNodeRow
		db.Model(&nomenclaturemod.NomenclatureNode{}).
			Where("tenant_id = ? AND type = ?", orgID, "code").
			Select("id, code, tag").
			Scan(&codeNodes)

		for _, n := range codeNodes {
			// Mix code + ID bytes + salt to break correlation between similar codes.
			h := uint64(14695981039346656037) // FNV-1a offset basis
			fnvPrime := uint64(1099511628211)
			seed := n.Code + "|" + n.ID.String()
			for _, c := range seed {
				h ^= uint64(c)
				h *= fnvPrime
			}
			hash := int(h>>1) // strip sign bit
			if hash < 0 {
				hash = -hash
			}
			var minVal, maxVal float64
			switch strings.ToLower(n.Tag) {
			case "travaux":
				minVal, maxVal = 100_000, 3_000_000
			case "services":
				minVal, maxVal = 15_000, 1_200_000
			default: // Fournitures
				minVal, maxVal = 5_000, 800_000
			}
			amount := minVal + float64(hash%int(maxVal-minVal))
			db.Model(&nomenclaturemod.NomenclatureNode{}).
				Where("id = ?", n.ID).
				Update("montant", amount)
		}

		// Famille montants = sum of children codes
		type famRow struct {
			ID uuid.UUID
		}
		var famNodes2 []famRow
		db.Model(&nomenclaturemod.NomenclatureNode{}).
			Where("tenant_id = ? AND type = ?", orgID, "famille").
			Select("id").
			Scan(&famNodes2)

		for _, f := range famNodes2 {
			var sum float64
			db.Model(&nomenclaturemod.NomenclatureNode{}).
				Where("tenant_id = ? AND type = ? AND parent_id = ?", orgID, "code", f.ID).
				Select("COALESCE(SUM(montant), 0)").
				Scan(&sum)
			db.Model(&nomenclaturemod.NomenclatureNode{}).
				Where("id = ?", f.ID).
				Update("montant", sum)
		}

		// Grande-famille montants = sum of children familles
		var gfNodes []famRow
		db.Model(&nomenclaturemod.NomenclatureNode{}).
			Where("tenant_id = ? AND type = ?", orgID, "grande-famille").
			Select("id").
			Scan(&gfNodes)

		for _, gf := range gfNodes {
			var sum float64
			db.Model(&nomenclaturemod.NomenclatureNode{}).
				Where("tenant_id = ? AND type = ? AND parent_id = ?", orgID, "famille", gf.ID).
				Select("COALESCE(SUM(montant), 0)").
				Scan(&sum)
			db.Model(&nomenclaturemod.NomenclatureNode{}).
				Where("id = ?", gf.ID).
				Update("montant", sum)
		}
	}

	// ── Non-conformités simulées ──────────────────────────────
	// Re-fetch code nodes with updated montants, then mark ~20-30% non-conforme.
	// Bias: large-spend codes (>500k€) are more likely to have procedural issues.
	// Non-conformité rules (simulated — no real marché data exists yet):
	//   1. Montant > 214k€ (seuil appel d'offres) sans code CPV → procédure absente
	//   2. FNV hash of (id+code) % 7 == 0 → anomalie aléatoire (~14%)
	//   3. Travaux > 500k€ and hash%4 == 1 → dépassement seuil travaux non justifié
	var codeNodesWithMontant []nomenclaturemod.NomenclatureNode
	db.Where("tenant_id = ? AND type = ?", orgID, "code").Find(&codeNodesWithMontant)
	for _, n := range codeNodesWithMontant {
		h := uint64(14695981039346656037)
		fnvPrime := uint64(1099511628211)
		for _, c := range n.ID.String() + n.Code {
			h ^= uint64(c)
			h *= fnvPrime
		}
		hash := int(h>>1)
		if hash < 0 {
			hash = -hash
		}
		noCPV := !strings.HasPrefix(n.Code, "CPV")
		seuilAO := n.Montant > 214_000
		nonConforme := (noCPV && seuilAO && hash%3 == 0) ||
			(hash%7 == 0) ||
			(strings.ToLower(n.Tag) == "travaux" && n.Montant > 500_000 && hash%4 == 1)
		if nonConforme {
			db.Model(&nomenclaturemod.NomenclatureNode{}).
				Where("id = ?", n.ID).
				Update("conforme", false)
		}
	}

	// ── Collect all created node IDs by category ──────────────
	var allNodes []nomenclaturemod.NomenclatureNode
	db.Where("tenant_id = ?", orgID).Find(&allNodes)
	nodesByCategory := map[string][]uuid.UUID{}
	for _, n := range allNodes {
		nodesByCategory[n.Tag] = append(nodesByCategory[n.Tag], n.ID)
		nodesByCategory["*"] = append(nodesByCategory["*"], n.ID)
	}

	// ── Tags système + auto-assignment ────────────────────────
	type tagRef struct {
		id       uuid.UUID
		category string
	}
	var tagRefs []tagRef
	for _, t := range SystemTags {
		tag := nomenclaturemod.NomenclatureTag{
			TenantID: orgID,
			Name:     t.Name,
			Color:    t.Color,
			IsSystem: true,
		}
		db.Create(&tag)
		if t.Category != "" {
			tagRefs = append(tagRefs, tagRef{id: tag.ID, category: t.Category})
		}
	}

	// Bulk-assign category tags via raw SQL
	type pair struct{ nodeID, tagID uuid.UUID }
	var pairs []pair
	for _, ref := range tagRefs {
		for _, nodeID := range nodesByCategory[ref.category] {
			pairs = append(pairs, pair{nodeID: nodeID, tagID: ref.id})
		}
	}
	if len(pairs) > 0 {
		// Build VALUES clause
		vals := ""
		args := make([]interface{}, 0, len(pairs)*2)
		for i, p := range pairs {
			if i > 0 {
				vals += ","
			}
			vals += "(?,?)"
			args = append(args, p.nodeID, p.tagID)
		}
		db.Exec("INSERT INTO nomenclature_node_tags (nomenclature_node_id, nomenclature_tag_id) VALUES "+vals+" ON CONFLICT DO NOTHING", args...)
	}

	total := 3 + len(famDefs) + len(travFamNodes) + len(NomenclatureNationale) + len(NomenclatureTravaux)
	total += len(NomenclatureCPVExtra)
	fmt.Printf("✓ %d nodes seeded (%d F/S familles, %d T familles, %d V1 codes, %d CPV F/S codes, %d T codes) | %d tags | %d auto-assignments\n",
		total, len(famDefs), len(travFamNodes), len(NomenclatureNationale), len(NomenclatureCPVExtra), len(NomenclatureTravaux), len(SystemTags), len(pairs))
}