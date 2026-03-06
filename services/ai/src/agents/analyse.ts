import { complete } from "../client";
import type { AnalyseInput, AnalyseOutput, AgentResult } from "../types";
import { readFileSync } from "fs";
import { join } from "path";

function loadSystemPrompt(): string {
  try {
    return readFileSync(join(__dirname, "../prompts/analyse.md"), "utf-8");
  } catch {
    return `Tu es un expert en stratégie achats pour les collectivités territoriales françaises.
Calcule l'Indice de Maturité Achats (IMA) sur 4 dimensions et génère des insights stratégiques.
Réponds UNIQUEMENT en JSON valide.`;
  }
}

/**
 * Agent Analyse — Calcule l'IMA et génère des insights stratégiques.
 *
 * Dimensions IMA :
 * 1. Nomenclature (taux de classification, exhaustivité)
 * 2. Planification (taux d'anticipation, maîtrise calendaire)
 * 3. Sécurité juridique (conformité CCP, alertes résolues)
 * 4. Mutualisation (taux de groupements, accords-cadres)
 */
export async function analyserMaturite(
  input: AnalyseInput
): Promise<AgentResult<AnalyseOutput>> {
  const start = Date.now();

  try {
    const systemPrompt = loadSystemPrompt();

    // Pre-compute key metrics
    const totalN = input.depensesN.reduce((s, d) => s + d.montant, 0);
    const classifiesN = input.depensesN.filter((d) => d.codeNomenclature).length;
    const tauxClassification = input.depensesN.length > 0
      ? Math.round((classifiesN / input.depensesN.length) * 100)
      : 0;

    const totalNMoins1 = input.depensesNMoins1?.reduce((s, d) => s + d.montant, 0) ?? 0;

    const userMessage = `Calcule l'IMA pour l'organisation ${input.orgId}, exercice ${input.anneeN}.

Métriques calculées :
- Total dépenses N : ${totalN.toLocaleString("fr-FR")}€ (${input.depensesN.length} lignes)
- Taux de classification : ${tauxClassification}%
- Total dépenses N-1 : ${totalNMoins1.toLocaleString("fr-FR")}€ (${input.depensesNMoins1?.length ?? 0} lignes)
- Évolution N/N-1 : ${totalNMoins1 > 0 ? `${((totalN - totalNMoins1) / totalNMoins1 * 100).toFixed(1)}%` : "N/A"}

Génère le rapport IMA en JSON :
{
  "imaGlobal": 0-100,
  "dimensions": [
    { "nom": "Nomenclature", "score": 0-100, "tendance": "hausse|stable|baisse", "commentaire": "..." },
    { "nom": "Planification", "score": 0-100, "tendance": "...", "commentaire": "..." },
    { "nom": "Sécurité juridique", "score": 0-100, "tendance": "...", "commentaire": "..." },
    { "nom": "Mutualisation", "score": 0-100, "tendance": "...", "commentaire": "..." }
  ],
  "tendancesPluriannielles": "...",
  "opportunitesMutualisation": ["...", "..."],
  "insightsNvsNMoins1": "...",
  "projections": "..."
}`;

    const result = await complete({ systemPrompt, userMessage });
    const parsed = JSON.parse(result.content) as AnalyseOutput;

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
