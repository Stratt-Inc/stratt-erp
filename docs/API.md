# API.md — Documentation API REST Axiora

> Version : v1 | Base URL : `https://api.axiora.fr/v1`

---

## Authentification

Toutes les requêtes authentifiées nécessitent un Bearer token JWT.

```http
Authorization: Bearer <access_token>
```

### Obtenir un token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "marie.dupont@metropole-lyon.fr",
  "password": "••••••••"
}
```

**Response 200** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "rt_...",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "marie.dupont@metropole-lyon.fr",
    "role": "admin",
    "organisation": {
      "id": "uuid",
      "name": "Métropole de Lyon",
      "slug": "metropole-lyon"
    }
  }
}
```

### Rafraîchir le token

```http
POST /auth/refresh
Content-Type: application/json

{ "refresh_token": "rt_..." }
```

---

## Codes d'erreur

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Le code de nomenclature demandé n'existe pas",
    "details": { "resource": "nomenclature_code", "id": "uuid" }
  }
}
```

| Code HTTP | Code erreur | Description |
|-----------|-------------|-------------|
| 400 | `VALIDATION_ERROR` | Corps de requête invalide |
| 401 | `UNAUTHORIZED` | Token manquant ou expiré |
| 403 | `FORBIDDEN` | Rôle insuffisant |
| 404 | `RESOURCE_NOT_FOUND` | Ressource inexistante |
| 409 | `CONFLICT` | Conflit (ex: code déjà existant) |
| 422 | `BUSINESS_RULE_VIOLATION` | Règle métier violée |
| 429 | `RATE_LIMITED` | Trop de requêtes |
| 500 | `INTERNAL_ERROR` | Erreur serveur |

---

## Pagination

Toutes les listes supportent la pagination cursor-based :

```http
GET /api/marches?cursor=uuid&limit=50&sort=date_echeance&order=asc
```

**Response** :
```json
{
  "data": [...],
  "pagination": {
    "cursor": "next_uuid",
    "has_more": true,
    "total": 147
  }
}
```

---

## Endpoints

### Nomenclature

#### GET /api/nomenclature
Récupère l'arborescence complète de la nomenclature active.

```http
GET /api/nomenclature?version=current&include_montants=true
```

**Response** :
```json
{
  "version": { "id": "uuid", "number": "3.2", "published_at": "2026-02-01T00:00:00Z" },
  "codes": [
    {
      "id": "uuid",
      "code": "01",
      "label": "Travaux",
      "level": 0,
      "type": "famille",
      "seuil_procedure": 215000,
      "montant_consolide": 28500000,
      "conforme": true,
      "children": [...]
    }
  ]
}
```

---

#### POST /api/nomenclature/codes
Créer un nouveau code.

```http
POST /api/nomenclature/codes
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "02.01",
  "label": "Fournitures informatiques",
  "level": 1,
  "parent_id": "uuid-famille-fournitures",
  "seuil_procedure": 90000,
  "perimetre_inclut": "Matériel informatique, périphériques, consommables",
  "perimetre_exclut": "Logiciels (→ 04.01), formation informatique (→ 03.03)"
}
```

**Response 201** :
```json
{
  "id": "uuid",
  "code": "02.01",
  "label": "Fournitures informatiques",
  "created_at": "2026-03-06T10:00:00Z"
}
```

---

#### PUT /api/nomenclature/codes/:id
Modifier un code existant.

#### DELETE /api/nomenclature/codes/:id
Désactiver un code (soft delete, historique conservé).

#### POST /api/nomenclature/versions
Créer un snapshot versionné.

```json
{ "number": "3.3", "note": "Ajout sous-famille Hébergement cloud" }
```

---

### Marchés

#### GET /api/marches
Liste des marchés planifiés avec filtres.

```http
GET /api/marches?statut=en_cours&service=DGA+Bâtiments&annee=2026&cursor=uuid&limit=50
```

#### POST /api/marches
Créer un marché.

```json
{
  "objet": "Maintenance ascenseurs — Lot 1 Centre",
  "service": "DGA Bâtiments",
  "montant_previsionnel": 120000,
  "procedure": "ao_ouvert",
  "code_id": "uuid-code-maintenance",
  "date_echeance": "2026-03-15",
  "priorite": "haute",
  "charge_jh": 12
}
```

**Validation automatique** : si `montant_previsionnel` > seuil du code → procédure inadaptée → erreur 422.

#### PUT /api/marches/:id
Modifier un marché.

#### GET /api/marches/:id/simulate-delais
Simulation des délais réglementaires pour ce marché.

---

### Cartographie

#### GET /api/cartographie
Données de cartographie calculées dynamiquement.

```http
GET /api/cartographie?exercice=2026&direction=DGA+Bâtiments
```

**Response** :
```json
{
  "exercice": 2026,
  "montant_total": 84200000,
  "familles": [
    {
      "code": "01",
      "label": "Travaux",
      "montant": 28500000,
      "part": 33.8,
      "nb_marches": 42,
      "statut_conformite": "conforme"
    }
  ],
  "treemap": [...],
  "seuils": [...],
  "anomalies": [...]
}
```

#### GET /api/cartographie/seuils
Computation des seuils par code (art. L2124-1 CCP).

#### POST /api/imports
Lancer un import de dépenses mandatées.

```http
POST /api/imports
Content-Type: multipart/form-data

file: depenses_2026.csv
exercice: 2026
format: csv_standard
```

**Response 202** :
```json
{ "job_id": "uuid", "status": "queued", "estimated_seconds": 45 }
```

#### GET /api/imports/:job_id/status
Polling du statut d'import.

```json
{
  "status": "processing",
  "progress": { "total": 1250, "processed": 847, "classified": 812, "errors": 12 }
}
```

---

### Dashboard

#### GET /api/dashboard/kpis
Tous les KPIs stratégiques.

**Response** :
```json
{
  "exercice": 2026,
  "marches_planifies": 147,
  "montant_previsionnel": 84200000,
  "taux_anticipation": 76,
  "taux_mutualisation": 42,
  "securite_juridique": 94,
  "performance_budgetaire": 0.91,
  "marches_a_risque": 5,
  "renouvellements_6m": 12,
  "indice_maturite": {
    "global": 68,
    "nomenclature": 82,
    "planification": 71,
    "securite": 65,
    "mutualisation": 54
  }
}
```

#### GET /api/alertes
Alertes réglementaires actives.

```http
GET /api/alertes?severity=critique,haute&resolved=false
```

#### PUT /api/alertes/:id/resolve
Résoudre une alerte avec note de justification.

```json
{ "note": "Procédure formalisée engagée — DCE en cours de rédaction" }
```

---

### IA

#### POST /api/ai/classify
Classifier une dépense dans la nomenclature.

```json
{
  "libelle": "Achat de 15 laptops Dell Latitude pour la direction informatique",
  "montant": 22500,
  "fournisseur": "Dell Technologies",
  "direction": "DGA Numérique"
}
```

**Response** :
```json
{
  "job_id": "uuid",
  "status": "completed",
  "result": {
    "code_id": "uuid",
    "code": "02.01",
    "label": "Fournitures informatiques",
    "confidence": 96,
    "reasoning": "Achat de matériel informatique (laptops) pour usage bureautique...",
    "alternatives": []
  }
}
```

#### POST /api/exports
Lancer la génération d'un document.

```json
{
  "type": "pdf_institutionnel",
  "sections": ["couverture", "nomenclature", "cartographie", "seuils", "conformite"],
  "metadata": {
    "collectivite": "Métropole de Lyon",
    "exercice": 2026,
    "version_nomenclature": "3.2"
  }
}
```

**Response 202** :
```json
{ "job_id": "uuid", "estimated_seconds": 120 }
```

#### GET /api/exports/:id/download
URL signée pour télécharger le document généré (valide 1h).

```json
{ "url": "https://storage.axiora.fr/exports/uuid.pdf?token=...", "expires_at": "..." }
```

---

## Rate Limits

| Endpoint | Limite |
|----------|--------|
| Auth (login/signup) | 10 req/min/IP |
| API générale | 100 req/min/IP, 1000 req/min/org |
| Import fichiers | 5 req/heure/org |
| Génération exports | 10 req/heure/org |
| Endpoints IA | 50 req/heure/org |

---

## Webhooks (v2)

Axiora supportera les webhooks pour les événements asynchrones :

- `import.completed` — import de dépenses terminé
- `export.ready` — document généré prêt au téléchargement
- `alerte.created` — nouvelle alerte réglementaire
- `classification.review_needed` — dépense nécessitant validation humaine
