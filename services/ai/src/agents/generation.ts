import { complete } from "../client";
import type { GenerationInput, GenerationOutput, AgentResult } from "../types";
import { readFileSync } from "fs";
import { join } from "path";

function loadSystemPrompt(): string {
  try {
    return readFileSync(join(__dirname, "../prompts/generation.md"), "utf-8");
  } catch {
    return `Tu es un expert en rédaction administrative française, spécialisé dans les rapports d'achats publics.
Rédige des sections narratives claires, professionnelles et conformes aux standards institutionnels français.
Utilise UNIQUEMENT les données chiffrées fournies — ne fabrique aucun chiffre.`;
  }
}

const SECTION_INSTRUCTIONS: Record<string, string> = {
  introduction: "Rédige une introduction qui contextualise l'exercice, la collectivité et les enjeux.",
  methodologie: "Décris la méthodologie de cartographie des achats adoptée.",
  analyse: "Analyse les données chiffrées fournies avec précision et objectivité.",
  recommandations: "Formule des recommandations concrètes et actionnables.",
  annexes: "Prépare la structure des annexes avec les éléments clés.",
};

/**
 * Agent Génération — Rédige des sections narratives du Livre Blanc CartoAP.
 *
 * - Ton institutionnel français
 * - Données chiffrées injectées via payload (aucune hallucination)
 * - Sections : introduction, méthodologie, analyse, recommandations, annexes
 */
export async function genererSection(
  input: GenerationInput
): Promise<AgentResult<GenerationOutput>> {
  const start = Date.now();

  try {
    const systemPrompt = loadSystemPrompt();
    const sectionInstruction = SECTION_INSTRUCTIONS[input.type] ?? "Rédige cette section.";

    const userMessage = `Rédige la section "${input.type}" du Livre Blanc CartoAP.

Collectivité : ${input.orgNom}
Exercice : ${input.annee}
Ton souhaité : ${input.ton ?? "institutionnel"}

${sectionInstruction}

Données disponibles :
${JSON.stringify(input.donnees, null, 2)}

Réponds en JSON : {
  "section": "${input.type}",
  "contenu": "texte rédigé en markdown...",
  "metadata": { "tokensUtilises": 0, "motsCles": [] }
}`;

    const result = await complete({ systemPrompt, userMessage, maxTokens: 6000 });
    const parsed = JSON.parse(result.content) as GenerationOutput;

    return {
      success: true,
      data: {
        ...parsed,
        metadata: {
          ...parsed.metadata,
          tokensUtilises: result.tokensInput + result.tokensOutput,
        },
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
