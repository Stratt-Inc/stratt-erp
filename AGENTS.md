# AGENTS.md — Architecture IA d'Axiora

> Description des agents IA, de leurs responsabilités et de leurs interactions

---

## Vue d'ensemble

Axiora intègre **4 agents spécialisés** basés sur Claude (Anthropic). Chaque agent est autonome, a un rôle précis et communique via des interfaces définies. Ils sont orchestrés par un **Agent Orchestrateur** central.

```
                    ┌──────────────────────┐
                    │  ORCHESTRATEUR       │
                    │  (Agent Router)      │
                    └──────┬───────────────┘
                           │
          ┌────────────────┼───────────────────┐
          │                │                   │
          ▼                ▼                   ▼
  ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐
  │  NOMENCLATURE │ │  CONFORMITÉ  │ │   GÉNÉRATION    │
  │    AGENT      │ │    AGENT     │ │    AGENT        │
  └───────┬───────┘ └──────┬───────┘ └────────┬────────┘
          │                │                  │
          └────────────────┴──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   ANALYSE   │
                    │    AGENT    │
                    └─────────────┘
```

---

## Agent 1 — Nomenclature Agent

### Rôle
Classifier automatiquement les dépenses mandatées dans l'arborescence de nomenclature de la collectivité.

### Responsabilités
- Analyser le libellé d'une dépense et proposer le code nomenclature approprié
- Calculer un score de confiance (0–100%)
- Détecter les ambiguïtés et proposer plusieurs candidats
- Suggérer la création de nouveaux codes si aucun existant ne convient
- Assister la construction initiale de la nomenclature depuis zéro

### Inputs
```typescript
interface NomenclatureClassifyInput {
  depense: {
    libelle: string;
    montant: number;
    fournisseur?: string;
    direction?: string;
  };
  nomenclature: NomenclatureCode[]; // arborescence existante
  exemples?: { libelle: string; code: string }[]; // few-shot
}
```

### Outputs
```typescript
interface NomenclatureClassifyOutput {
  codeId: string;
  code: string;
  confidence: number; // 0–100
  reasoning: string;
  alternatives: Array<{ codeId: string; confidence: number }>;
  suggest_new_code?: {
    label: string;
    parent_code: string;
    justification: string;
  };
}
```

### System Prompt (extrait)
```
Tu es un expert en marchés publics français et en nomenclature des achats selon la méthode CartoAP.
Ta mission : classifier des dépenses mandatées dans une arborescence de codes.
Règles absolues :
- Un seul code par dépense (mutuellement exclusif)
- Toujours justifier ta classification
- Si confiance < 70%, proposer 2-3 alternatives
- Respecter le CCP 2024 et les seuils de procédure
```

### Déclencheurs
- Import d'un fichier CSV/XLSX de dépenses
- Saisie manuelle d'une nouvelle dépense
- Re-classification périodique des dépenses non rattachées

---

## Agent 2 — Conformité Agent

### Rôle
Surveiller en temps réel la conformité réglementaire des achats au regard du Code de la Commande Publique.

### Responsabilités
- Détecter les risques de **fractionnement** (plusieurs MAPA sur un même code dépassant le seuil)
- Vérifier la **computation des seuils** par code de nomenclature (art. L2124-1 CCP)
- Alerter sur les **accords-cadres arrivant à échéance** (< 90j, < 30j)
- Signaler les **dépenses non classifiées** nécessitant une attention
- Détecter les **concentrations fournisseurs** anormales
- Proposer des **recommandations d'optimisation** (regroupement en accord-cadre, mutualisation)

### Inputs
```typescript
interface ConformiteAnalysisInput {
  org_id: string;
  exercice: number;
  codes: NomenclatureCode[];
  marches: Marche[];
  depenses: Depense[];
  seuils_ccp: SeuilCCP; // constantes réglementaires
}
```

### Outputs
```typescript
interface ConformiteAnalysisOutput {
  alertes: Alerte[];
  score_securite_juridique: number; // 0–100
  recommandations: Recommandation[];
  risques_critiques: string[];
}
```

### Règles métier embarquées
```
Seuils CCP 2024 (art. L2124-1) :
- MAPA < 40 000 € : procédure adaptée allégée
- MAPA < 90 000 € HT : procédure adaptée
- Travaux < 215 000 € HT : MAPA
- Fournitures/Services < 215 000 € HT : MAPA
- Au-delà : appel d'offres obligatoire

Détection fractionnement :
- Cumul sur rolling 12 mois par code de nomenclature
- Si Σ MAPA > seuil applicable → alerte fractionnement
```

### Déclencheurs
- Après chaque import de dépenses (pipeline automatique)
- Quotidiennement à 6h00 (cron job)
- Après création/modification d'un marché
- Sur demande manuelle via API

---

## Agent 3 — Génération Agent

### Rôle
Rédiger automatiquement les sections narratives du document de cartographie des achats (Livre Blanc CartoAP).

### Responsabilités
- Rédiger l'**introduction et le contexte réglementaire** adapté à la collectivité
- Décrire la **méthodologie de cartographie** utilisée
- Produire l'**analyse par famille homogène** avec interprétation des données
- Formuler les **recommandations** d'optimisation personnalisées
- Rédiger les **annexes** (glossaire, références réglementaires)
- Adapter le **ton et le registre** au document institutionnel

### Inputs
```typescript
interface GenerationInput {
  organisation: Organisation;
  exercice: number;
  sections_requested: SectionId[];
  data: {
    cartographie: CartographieData;
    nomenclature: NomenclatureData;
    conformite: ConformiteData;
    planification: PlanificationData;
  };
  style: 'institutionnel' | 'synthétique' | 'technique';
}
```

### Outputs
```typescript
interface GenerationOutput {
  sections: Array<{
    id: SectionId;
    title: string;
    content: string; // Markdown → converti en HTML pour PDF
    page_estimate: number;
  }>;
  metadata: {
    word_count: number;
    reading_time_min: number;
  };
}
```

### Contraintes de génération
- **Pas d'hallucination** : toutes les statistiques sont injectées depuis la BDD, l'agent ne génère que la prose
- **Traçabilité** : chaque affirmation chiffrée est sourcée (source_id dans le payload)
- **Ton** : neutre, institutionnel, conforme aux standards des documents officiels français

### Déclencheurs
- Action utilisateur : "Générer le document" dans le module Exports
- Job async dans la queue Redis (Asynq worker)

---

## Agent 4 — Analyse Agent

### Rôle
Fournir des insights stratégiques sur la performance achats et suggérer des axes d'optimisation.

### Responsabilités
- Analyser les **tendances pluriannuelles** (N/N-1, projections)
- Identifier les **opportunités de mutualisation** entre directions
- Calculer l'**indice de maturité achats** (IMA) sur 4 dimensions
- Détecter les **patterns de dépense** anormaux
- Proposer des **scénarios de regroupement** en accord-cadre

### Inputs
```typescript
interface AnalyseInput {
  historique: DepenseAnnuelle[]; // 3-5 ans
  objectifs_org: { mutualisation_target: number; anticipation_target_jours: number };
  benchmark?: BenchmarkSectoriel; // optionnel
}
```

### Outputs
```typescript
interface AnalyseOutput {
  indice_maturite: {
    global: number;
    dimensions: { nomenclature: number; planification: number; securite: number; mutualisation: number };
  };
  insights: Insight[];
  opportunites: Opportunite[];
  projections: Projection[];
}
```

---

## Orchestrateur

L'orchestrateur détermine quel(s) agent(s) invoquer selon le contexte.

```typescript
// services/ai/orchestrator.ts
async function route(context: AgentContext): Promise<AgentResult> {
  switch (context.trigger) {
    case 'import_depenses':
      return sequence([NomenclatureAgent, ConformiteAgent]);
    case 'export_document':
      return parallel([AnalyseAgent, GenerationAgent]);
    case 'cron_daily':
      return ConformiteAgent.run();
    case 'maturity_request':
      return AnalyseAgent.run();
  }
}
```

---

## Configuration des agents

```typescript
// services/ai/config.ts
export const AGENT_CONFIG = {
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  temperature: 0.1,  // Faible pour garantir la cohérence sur les tâches métier
  retry: { attempts: 3, backoff: 'exponential' },
  timeout_ms: 30_000,
};
```

---

## Sécurité & Gouvernance IA

- **Pas de données PII** injectées dans les prompts (anonymisation préalable)
- **Auditabilité** : chaque appel IA est loggé (prompt, response, tokens, latency)
- **Human-in-the-loop** : les classifications avec confiance < 70% sont soumises à validation humaine
- **Fallback** : si Claude indisponible, mode dégradé avec règles déterministes
- **Coûts** : budget mensuel par organisation, alertes à 80% du budget
