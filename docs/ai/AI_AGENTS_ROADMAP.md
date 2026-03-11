# AGENTS.md — Agents IA d'STRATT

> Description des agents IA prévus dans la roadmap. Ces agents ne sont **pas encore implémentés** dans le code actuel et représentent les fonctionnalités IA planifiées pour les futures itérations.

---

## Statut actuel

⚠️ **Les agents IA décrits ci-dessous font partie de la roadmap future.** L'implémentation actuelle d'STRATT est un ERP SaaS modulaire sans composante IA. Les workers existants (`workers/`) gèrent des tâches asynchrones basiques (emails, notifications, rapports) via Asynq/Redis.

---

## Vue d'ensemble (Roadmap)

L'objectif à terme est d'intégrer des agents IA spécialisés pour enrichir les modules ERP existants :

```
┌──────────────────────────────────────────────────────┐
│                 MODULES ERP EXISTANTS                │
│   CRM │ Comptabilité │ Facturation │ Inventaire │ … │
└───────────────────┬──────────────────────────────────┘
                    │ enrichissement IA
┌───────────────────▼──────────────────────────────────┐
│              AGENTS IA (à implémenter)               │
│                                                       │
│   🔮 Classification Agent    — Catégorisation auto    │
│   📊 Analytics Agent         — Insights & prédictions │
│   📝 Report Generation Agent — Rédaction auto         │
│   🔔 Alert Agent             — Détection anomalies    │
└──────────────────────────────────────────────────────┘
```

---

## Agent 1 — Classification Agent (planifié)

### Rôle
Classifier automatiquement les données entrantes dans les catégories appropriées des modules ERP.

### Cas d'usage
- CRM : classifier les leads par source et potentiel
- Comptabilité : catégoriser automatiquement les transactions
- Inventaire : suggérer des catégories de produits

### Stack envisagée
- Modèle : Claude (Anthropic) ou modèle local
- Intégration : worker Asynq existant + nouveau type de tâche
- Confiance : seuil de validation humaine si confiance < 70%

---

## Agent 2 — Analytics Agent (planifié)

### Rôle
Fournir des insights stratégiques sur les données cross-modules.

### Cas d'usage
- Identifier les tendances de ventes (CRM/Facturation)
- Détecter les anomalies de stock (Inventaire)
- Prédire les besoins d'achat (Procurement)
- Calculer des KPIs métier dynamiques (Analytics)

---

## Agent 3 — Report Generation Agent (planifié)

### Rôle
Générer automatiquement des rapports narratifs à partir des données ERP.

### Cas d'usage
- Rapports mensuels d'activité commerciale (CRM)
- Bilan comptable narratif (Comptabilité)
- Récapitulatif RH (HR)

### Intégration prévue
- Utilisation du worker `report:generate` existant (`workers/reports.go`)
- Enrichissement avec un LLM pour la rédaction des sections narratives
- Stockage des documents générés sur MinIO/S3

---

## Agent 4 — Alert Agent (planifié)

### Rôle
Surveiller les données en temps réel et déclencher des alertes intelligentes.

### Cas d'usage
- Stock bas + commande d'achat automatique suggérée (Inventaire → Procurement)
- Factures impayées au-delà du délai (Billing)
- Congés en conflit (HR)
- Anomalies de transactions (Comptabilité)

### Intégration prévue
- Utilisation du worker `notification:send` existant (`workers/notifications.go`)
- Cron job ou triggers GORM hooks

---

## Architecture d'intégration prévue

Les agents IA s'intégreront dans l'infrastructure existante :

```
[Module ERP Handler]
      │
      ▼ enqueue task
[Redis / Asynq Queue]
      │
      ▼
[AI Worker] → appel API LLM → traitement résultat
      │
      ├──► [Confiance élevée] → Action automatique + audit log
      └──► [Confiance basse]  → Notification pour validation humaine
```

### Principes
- **Pas de données PII** dans les prompts (anonymisation)
- **Auditabilité** : chaque appel IA loggé dans `audit_logs`
- **Human-in-the-loop** : validation humaine quand la confiance est insuffisante
- **Fallback** : si le LLM est indisponible, mode dégradé sans IA
- **Budget** : suivi des tokens consommés par organisation
