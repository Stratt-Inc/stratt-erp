import { complete } from "../client";
import {
  SEUIL_MAPA_40K,
  SEUIL_MAPA_90K,
  SEUIL_FOURNITURES_SERVICES_PA,
} from "@axiora/core";
import type {
  ConformiteAnalysisInput,
  ConformiteAnalysisOutput,
  AgentResult,
} from "../types";
import { readFileSync } from "fs";
import { join } from "path";

function loadSystemPrompt(): string {
  try {
    return readFileSync(join(__dirname, "../prompts/conformite.md"), "utf-8");
  } catch {
    return `Tu es un expert juridique en droit de la commande publique française (Code de la Commande Publique).
Analyse les dépenses pour détecter les risques de fractionnement et les dépassements de seuils.
Réponds UNIQUEMENT en JSON valide.`;
  }
}

/** Cumul des dépenses par code sur une période */
function cumulerParCode(
  depenses: ConformiteAnalysisInput["depenses"]
): Record<string, number> {
  return depenses.reduce<Record<string, number>>((acc, d) => {
    const code = d.codeNomenclature ?? "SANS_CODE";
    acc[code] = (acc[code] ?? 0) + d.montant;
    return acc;
  }, {});
}

/**
 * Agent Conformité — Détecte les risques réglementaires.
 *
 * - Cumul MAPA par code sur 12 mois glissants
 * - Computation seuils CCP 2024
 * - Génère alertes avec severity et message juridique
 * - Score sécurité juridique 0-100
 */
export async function analyserConformite(
  input: ConformiteAnalysisInput
): Promise<AgentResult<ConformiteAnalysisOutput>> {
  const start = Date.now();

  try {
    const systemPrompt = loadSystemPrompt();
    const cumulParCode = cumulerParCode(input.depenses);

    // Pre-compute suspicious codes for the AI context
    const suspiciousCodes = Object.entries(cumulParCode)
      .filter(([, montant]) => montant > SEUIL_MAPA_40K)
      .map(([code, montant]) => ({
        code,
        montant,
        depasseSeuil40k: montant > SEUIL_MAPA_40K,
        depasseSeuil90k: montant > SEUIL_MAPA_90K,
        depasSeuilPA: montant > SEUIL_FOURNITURES_SERVICES_PA,
      }));

    const userMessage = `Analyse de conformité pour l'organisation ${input.orgId}

Période d'analyse : ${input.period.from.toISOString().split("T")[0]} au ${input.period.to.toISOString().split("T")[0]}

Nombre de dépenses analysées : ${input.depenses.length}

Seuils CCP 2024 applicables :
- MAPA sans publicité : ${SEUIL_MAPA_40K.toLocaleString("fr-FR")}€
- MAPA avec publicité : ${SEUIL_MAPA_90K.toLocaleString("fr-FR")}€
- Procédure formalisée PA : ${SEUIL_FOURNITURES_SERVICES_PA.toLocaleString("fr-FR")}€

Codes à risque (cumul période) :
${JSON.stringify(suspiciousCodes, null, 2)}

Génère le rapport en JSON : {
  "alertes": [{ "type": "fractionnement|seuil_procedure|...", "severity": "critique|haute|moyenne|info", "titre": "...", "message": "...", "depensesImpliquees": [], "montantCumule": 0 }],
  "scoreSecuriteJuridique": 0-100,
  "synthese": "..."
}`;

    const result = await complete({ systemPrompt, userMessage });
    const parsed = JSON.parse(result.content) as ConformiteAnalysisOutput;

    return {
      success: true,
      data: parsed,
      latencyMs: Date.now() - start,
      tokensUsed: result.tokensInput + result.tokensOutput,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - start,
    };
  }
}
