import { complete } from "../client";
import { SEUIL_CONFIDENCE_IA } from "@axiora/core";
import type {
  NomenclatureClassifyInput,
  NomenclatureClassifyOutput,
  AgentResult,
} from "../types";
import { readFileSync } from "fs";
import { join } from "path";

function loadSystemPrompt(): string {
  try {
    return readFileSync(join(__dirname, "../prompts/nomenclature.md"), "utf-8");
  } catch {
    return FALLBACK_SYSTEM_PROMPT;
  }
}

const FALLBACK_SYSTEM_PROMPT = `Tu es un expert en achats publics français, spécialisé dans la classification budgétaire.
Ta mission : classifier des dépenses selon la nomenclature d'achat de la collectivité.
Réponds UNIQUEMENT en JSON valide avec les champs : code, confidence (0-100), reasoning, alternatives.`;

/**
 * Agent Nomenclature — Classifie une dépense dans la nomenclature de la collectivité.
 *
 * - Injecte la nomenclature complète en contexte
 * - Utilise des few-shot examples depuis les dépenses déjà classifiées
 * - Retourne confidence 0-100 + reasoning + alternatives
 * - Flag pour révision humaine si confidence < SEUIL_CONFIDENCE_IA
 */
export async function classifierDepense(
  input: NomenclatureClassifyInput
): Promise<AgentResult<NomenclatureClassifyOutput>> {
  const start = Date.now();

  try {
    const systemPrompt = loadSystemPrompt();

    // Build few-shot examples block
    const examplesBlock = input.exemplesClassifies?.length
      ? `\n\nEXEMPLES DE CLASSIFICATION (référence):\n${
          input.exemplesClassifies
            .slice(0, 10)
            .map((e) => `- "${e.libelle}" → ${e.code}`)
            .join("\n")
        }`
      : "";

    // Build nomenclature codes list
    const codesBlock = `\n\nNOMENCLATURE DISPONIBLE:\n${
      input.codesDisponibles
        .map((c) => `${c.code} — ${c.libelle}${c.description ? ` (${c.description})` : ""}`)
        .join("\n")
    }`;

    const userMessage = `Classifie cette dépense :
Libellé: ${input.depense.libelle}
Montant: ${input.depense.montant}€
Fournisseur: ${input.depense.fournisseur ?? "Non renseigné"}
Direction: ${input.depense.directionAcheteuse ?? "Non renseignée"}
${codesBlock}${examplesBlock}

Réponds en JSON avec : { "code": "...", "confidence": 0-100, "reasoning": "...", "alternatives": [{"code": "...", "confidence": 0-100}] }`;

    const result = await complete({ systemPrompt, userMessage });
    const parsed = JSON.parse(result.content) as {
      code: string;
      confidence: number;
      reasoning: string;
      alternatives: Array<{ code: string; confidence: number }>;
    };

    return {
      success: true,
      data: {
        ...parsed,
        requiresHumanReview: parsed.confidence < SEUIL_CONFIDENCE_IA,
      },
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
