package apidocs

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

// OpenAPI 3.0 spec — hand-crafted to document the main public endpoints.
var spec = map[string]any{
	"openapi": "3.0.3",
	"info": map[string]any{
		"title":       "Axiora API",
		"version":     "1.0.0",
		"description": "API REST publique Axiora — accès aux modules marchés publics, nomenclature, cartographie et administration.\n\n**Authentification** : Bearer token JWT (`Authorization: Bearer <token>`) ou API Key (`X-API-Key: <key>`).\n\n**Organisation** : header `X-Organization-Id: <org_uuid>` requis sur tous les endpoints ERP.\n\n**Rate limiting** : 1 000 requêtes/heure par token.",
		"contact": map[string]string{
			"name":  "Support Axiora",
			"email": "api@axiora.fr",
			"url":   "https://axiora.fr/developers",
		},
		"license": map[string]string{
			"name": "Proprietary",
		},
	},
	"servers": []map[string]string{
		{"url": "/api/v1", "description": "Production"},
	},
	"components": map[string]any{
		"securitySchemes": map[string]any{
			"BearerAuth": map[string]any{
				"type":         "http",
				"scheme":       "bearer",
				"bearerFormat": "JWT",
			},
			"ApiKeyAuth": map[string]any{
				"type": "apiKey",
				"in":   "header",
				"name": "X-API-Key",
			},
		},
		"schemas": map[string]any{
			"Error": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"error": map[string]string{"type": "string"},
				},
			},
			"Marche": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":               map[string]string{"type": "string", "format": "uuid"},
					"reference":        map[string]string{"type": "string"},
					"objet":            map[string]string{"type": "string"},
					"service":          map[string]string{"type": "string"},
					"montant":          map[string]string{"type": "number", "format": "float"},
					"procedure":        map[string]string{"type": "string"},
					"statut":           map[string]any{"type": "string", "enum": []string{"planifie", "en_cours", "termine", "annule", "alerte"}},
					"priorite":         map[string]any{"type": "string", "enum": []string{"basse", "normale", "haute", "critique"}},
					"categorie":        map[string]string{"type": "string"},
					"famille_code":     map[string]string{"type": "string"},
					"date_lancement":   map[string]string{"type": "string", "format": "date-time"},
					"date_attribution": map[string]string{"type": "string", "format": "date-time"},
					"date_fin":         map[string]string{"type": "string", "format": "date-time"},
					"notes":            map[string]string{"type": "string"},
					"created_at":       map[string]string{"type": "string", "format": "date-time"},
				},
			},
			"NomenclatureNode": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":          map[string]string{"type": "string", "format": "uuid"},
					"code":        map[string]string{"type": "string"},
					"label":       map[string]string{"type": "string"},
					"type":        map[string]any{"type": "string", "enum": []string{"grande-famille", "famille", "code"}},
					"tag":         map[string]string{"type": "string"},
					"montant":     map[string]string{"type": "number"},
					"seuil":       map[string]string{"type": "number"},
					"conforme":    map[string]string{"type": "boolean"},
					"is_archived": map[string]string{"type": "boolean"},
				},
			},
		},
	},
	"security": []map[string][]string{
		{"BearerAuth": {}},
		{"ApiKeyAuth": {}},
	},
	"paths": map[string]any{
		// ── Auth ────────────────────────────────────────────────────────────
		"/auth/login": map[string]any{
			"post": map[string]any{
				"tags":    []string{"Authentification"},
				"summary": "Connexion utilisateur",
				"requestBody": map[string]any{
					"required": true,
					"content": map[string]any{
						"application/json": map[string]any{
							"schema": map[string]any{
								"type":     "object",
								"required": []string{"email", "password"},
								"properties": map[string]any{
									"email":    map[string]string{"type": "string", "format": "email"},
									"password": map[string]string{"type": "string", "minLength": "8"},
								},
							},
						},
					},
				},
				"responses": map[string]any{
					"200": map[string]any{"description": "Connexion réussie — retourne access_token et refresh_token"},
					"401": map[string]any{"description": "Identifiants invalides"},
				},
			},
		},
		"/auth/me": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Authentification"},
				"summary": "Profil utilisateur courant",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"responses": map[string]any{
					"200": map[string]any{"description": "Informations de l'utilisateur connecté"},
				},
			},
		},
		// ── Marchés ─────────────────────────────────────────────────────────
		"/marches": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Marchés"},
				"summary": "Liste des marchés",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"parameters": []map[string]any{
					{"name": "statut", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "priorite", "in": "query", "schema": map[string]string{"type": "string"}},
				},
				"responses": map[string]any{
					"200": map[string]any{"description": "Liste des marchés de l'organisation"},
				},
			},
			"post": map[string]any{
				"tags":    []string{"Marchés"},
				"summary": "Créer un marché",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"responses": map[string]any{
					"201": map[string]any{"description": "Marché créé"},
					"400": map[string]any{"description": "Corps de requête invalide"},
				},
			},
		},
		"/marches/stats": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Marchés"},
				"summary": "Statistiques globales des marchés",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"responses": map[string]any{
					"200": map[string]any{"description": "KPIs: total, en_cours, alertes, budget_total"},
				},
			},
		},
		"/marches/{id}/export": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Marchés"},
				"summary": "Exporter le dossier marché en ZIP (SEDA v2)",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"parameters": []map[string]any{
					{"name": "id", "in": "path", "required": true, "schema": map[string]string{"type": "string", "format": "uuid"}},
				},
				"responses": map[string]any{
					"200": map[string]any{"description": "Archive ZIP contenant fiche.html, marche.json, seda_manifest.xml, dublin_core.xml, checksums.sha256"},
				},
			},
		},
		"/marches/alertes/dashboard": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Marchés"},
				"summary": "Dashboard des alertes délais réglementaires",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"parameters": []map[string]any{
					{"name": "days", "in": "query", "schema": map[string]string{"type": "integer"}, "description": "Horizon en jours (défaut: 60)"},
				},
				"responses": map[string]any{
					"200": map[string]any{"description": "Alertes classées par urgence + intérêts moratoires"},
				},
			},
		},
		// ── Nomenclature ────────────────────────────────────────────────────
		"/nomenclature": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Nomenclature"},
				"summary": "Liste des nœuds de nomenclature",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"responses": map[string]any{
					"200": map[string]any{"description": "Arbre nomenclature complet"},
				},
			},
			"post": map[string]any{
				"tags":    []string{"Nomenclature"},
				"summary": "Créer un nœud de nomenclature",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"responses": map[string]any{
					"201": map[string]any{"description": "Nœud créé"},
				},
			},
		},
		"/nomenclature/orphans": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Nomenclature"},
				"summary": "Codes orphelins (aucun marché associé sur l'exercice)",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"parameters": []map[string]any{
					{"name": "year", "in": "query", "schema": map[string]string{"type": "integer"}},
				},
				"responses": map[string]any{
					"200": map[string]any{"description": "Liste des codes orphelins avec statistiques"},
				},
			},
		},
		// ── Audit ────────────────────────────────────────────────────────────
		"/audit": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Audit"},
				"summary": "Journal d'audit (admin uniquement)",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"parameters": []map[string]any{
					{"name": "page", "in": "query", "schema": map[string]string{"type": "integer"}},
					{"name": "limit", "in": "query", "schema": map[string]string{"type": "integer"}},
					{"name": "action", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "resource_type", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "from", "in": "query", "schema": map[string]string{"type": "string", "format": "date"}},
					{"name": "to", "in": "query", "schema": map[string]string{"type": "string", "format": "date"}},
				},
				"responses": map[string]any{
					"200": map[string]any{"description": "Entrées d'audit paginées"},
				},
			},
		},
		// ── Webhooks ─────────────────────────────────────────────────────────
		"/webhooks": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Webhooks"},
				"summary": "Liste des webhooks configurés",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"responses": map[string]any{
					"200": map[string]any{"description": "Webhooks de l'organisation"},
				},
			},
			"post": map[string]any{
				"tags":    []string{"Webhooks"},
				"summary": "Créer un webhook",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"responses": map[string]any{
					"201": map[string]any{"description": "Webhook créé — secret exposé une seule fois"},
				},
			},
		},
		// ── Quiz ─────────────────────────────────────────────────────────────
		"/quiz/questions": map[string]any{
			"get": map[string]any{
				"tags":    []string{"Quiz CCP"},
				"summary": "Questions de conformité CCP",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"parameters": []map[string]any{
					{"name": "theme", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "difficulty", "in": "query", "schema": map[string]string{"type": "string"}},
					{"name": "count", "in": "query", "schema": map[string]string{"type": "integer"}},
				},
				"responses": map[string]any{
					"200": map[string]any{"description": "Questions aléatoires sans les réponses correctes"},
				},
			},
		},
		"/quiz/check": map[string]any{
			"post": map[string]any{
				"tags":    []string{"Quiz CCP"},
				"summary": "Corriger les réponses et obtenir le score",
				"security": []map[string][]string{{"BearerAuth": {}}},
				"responses": map[string]any{
					"200": map[string]any{"description": "Résultats avec explications et score de certification"},
				},
			},
		},
	},
}

// swaggerHTML embeds a Swagger UI 5.x CDN page rendering the /api/v1/openapi.json spec.
const swaggerHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Axiora API Docs</title>
<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
<style>
body{margin:0;background:#0f1117}
.swagger-ui .topbar{background:#1a1d2e}
.swagger-ui .topbar .download-url-wrapper{display:none}
</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
SwaggerUIBundle({
  url: "/api/v1/openapi.json",
  dom_id: "#swagger-ui",
  presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
  layout: "BaseLayout",
  deepLinking: true,
  displayRequestDuration: true,
  tryItOutEnabled: true,
});
</script>
</body>
</html>`

type Handler struct{}

func NewHandler() *Handler { return &Handler{} }

// GET /api/v1/openapi.json
func (h *Handler) OpenAPISpec(c *gin.Context) {
	c.Header("Access-Control-Allow-Origin", "*")
	b, _ := json.MarshalIndent(spec, "", "  ")
	c.Data(http.StatusOK, "application/json; charset=utf-8", b)
}

// GET /docs
func (h *Handler) SwaggerUI(c *gin.Context) {
	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, swaggerHTML)
}
