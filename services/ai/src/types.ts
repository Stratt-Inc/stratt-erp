import type { Depense, NomenclatureCode, Alerte, AlerteSeverity } from "@axiora/core";

/* ── Nomenclature Agent ── */

export interface NomenclatureClassifyInput {
  depense: Pick<Depense, "libelle" | "montant" | "fournisseur" | "directionAcheteuse">;
  codesDisponibles: NomenclatureCode[];
  exemplesClassifies?: Array<{
    libelle: string;
    code: string;
  }>;
}

export interface NomenclatureClassifyOutput {
  code: string;
  confidence: number;    // 0-100
  reasoning: string;
  alternatives: Array<{
    code: string;
    confidence: number;
  }>;
  requiresHumanReview: boolean;  // true if confidence < 70
}

/* ── Conformité Agent ── */

export interface ConformiteAnalysisInput {
  orgId: string;
  depenses: Array<Pick<Depense, "id" | "libelle" | "montant" | "codeNomenclature" | "dateDepense">>;
  period: {
    from: Date;
    to: Date;
  };
}

export interface ConformiteAnalysisOutput {
  alertes: Array<{
    type: Alerte["type"];
    severity: AlerteSeverity;
    titre: string;
    message: string;
    depensesImpliquees: string[];  // IDs
    montantCumule: number;
  }>;
  scoreSecuriteJuridique: number;  // 0-100
  synthese: string;
}

/* ── Génération Agent ── */

export type SectionType =
  | "introduction"
  | "methodologie"
  | "analyse"
  | "recommandations"
  | "annexes";

export interface GenerationInput {
  type: SectionType;
  orgNom: string;
  annee: number;
  donnees: Record<string, unknown>;  // chiffres injectés pour éviter les hallucinations
  ton?: "institutionnel" | "synthetique";
}

export interface GenerationOutput {
  section: SectionType;
  contenu: string;
  metadata: {
    tokensUtilises: number;
    motsCles: string[];
  };
}

/* ── Analyse Agent ── */

export interface AnalyseInput {
  orgId: string;
  anneeN: number;
  depensesN: Depense[];
  depensesNMoins1?: Depense[];
}

export interface IMADimension {
  nom: string;
  score: number;   // 0-100
  tendance: "hausse" | "stable" | "baisse";
  commentaire: string;
}

export interface AnalyseOutput {
  imaGlobal: number;   // 0-100, Indice de Maturité Achats
  dimensions: IMADimension[];
  tendancesPluriannielles: string;
  opportunitesMutualisation: string[];
  insightsNvsNMoins1: string;
  projections: string;
}

/* ── Orchestrateur ── */

export type AgentTrigger =
  | "import_depenses"
  | "export_document"
  | "cron_daily"
  | "maturity_request";

export interface AgentContext {
  orgId: string;
  userId?: string;
  trigger: AgentTrigger;
  payload: Record<string, unknown>;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  latencyMs: number;
  tokensUsed?: number;
}
