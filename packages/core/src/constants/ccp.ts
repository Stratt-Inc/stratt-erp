/**
 * Seuils CCP 2024 (Code de la Commande Publique)
 * Règlement (UE) 2023/2496 — applicables depuis le 1er janvier 2024
 */

/** MAPA — Marchés À Procédure Adaptée */
export const SEUIL_MAPA_40K = 40_000;    // Sous ce seuil : pas de publicité obligatoire
export const SEUIL_MAPA_90K = 90_000;    // Seuil de publicité obligatoire (avis de marché)

/** Seuils formalisés — travaux */
export const SEUIL_TRAVAUX = 5_538_000;  // Au-dessus : procédure formalisée obligatoire

/** Seuils formalisés — fournitures et services (pouvoirs adjudicateurs) */
export const SEUIL_FOURNITURES_SERVICES_PA = 221_000;

/** Seuils formalisés — fournitures et services (entités adjudicatrices) */
export const SEUIL_FOURNITURES_SERVICES_EA = 443_000;

/** Seuils JOUE — fournitures et services État */
export const SEUIL_JOUE_ETAT = 140_000;

/** Durée maximale d'un accord-cadre (en années) */
export const DUREE_MAX_ACCORD_CADRE = 4;

/** Délai d'alerte avant expiration d'un marché (en jours) */
export const DELAI_ALERTE_EXPIRATION = 90;

/** Score de confidence IA minimum pour auto-classification */
export const SEUIL_CONFIDENCE_IA = 70; // 0-100
