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

// seedNomenclatureNationale populates the nomenclature table for a given org.
// It creates:
//   - 2 grande-famille nodes (Fournitures, Services)
//   - 1 famille node per family number
//   - 1 code node per leaf entry
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
	gfServices    := makeNode("GF-S", "Services",    "Prestations de services", "grande-famille", "Services", nil, seuilMapa, seuilAOfs)
	db.Create(&gfFournitures)
	db.Create(&gfServices)

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
		if strings.EqualFold(f.tag, "Travaux") {
			parentID = nil
			seuilAO = seuilAOt
		} else if strings.EqualFold(f.tag, "Services") {
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

	// ── Codes feuilles ─────────────────────────────────────────
	for _, e := range NomenclatureNationale {
		famNode, ok := famNodes[e.FamilyNum]
		if !ok {
			continue
		}
		seuilAO := seuilAOfs
		if strings.EqualFold(e.Tag, "Travaux") {
			seuilAO = seuilAOt
		}
		node := makeNode(e.Code, e.Label, e.Description, "code", e.Tag, &famNode.ID, seuilMapa, seuilAO)
		db.Create(&node)
	}

	total := 2 + len(famDefs) + len(NomenclatureNationale)
	fmt.Printf("✓ %d nomenclature nationale nodes seeded (%d familles, %d codes)\n",
		total, len(famDefs), len(NomenclatureNationale))
}