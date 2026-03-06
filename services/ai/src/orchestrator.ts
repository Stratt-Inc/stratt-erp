import { classifierDepense } from "./agents/nomenclature";
import { analyserConformite } from "./agents/conformite";
import { genererSection } from "./agents/generation";
import { analyserMaturite } from "./agents/analyse";
import type { AgentContext, AgentResult } from "./types";

/**
 * Orchestrateur des agents IA.
 *
 * Route les triggers vers les bons agents, en séquence ou en parallèle.
 */
export async function orchestrate(ctx: AgentContext): Promise<AgentResult[]> {
  switch (ctx.trigger) {
    case "import_depenses": {
      // Séquence : nomenclature d'abord, puis conformité sur le résultat
      const nomenclatureResult = await classifierDepense(ctx.payload as unknown as Parameters<typeof classifierDepense>[0]);
      const conformiteResult = await analyserConformite(ctx.payload as unknown as Parameters<typeof analyserConformite>[0]);
      return [nomenclatureResult, conformiteResult];
    }

    case "export_document": {
      // Parallèle : analyse IMA + génération sections simultanées
      const [analyseResult, generationResult] = await Promise.all([
        analyserMaturite(ctx.payload as unknown as Parameters<typeof analyserMaturite>[0]),
        genererSection(ctx.payload as unknown as Parameters<typeof genererSection>[0]),
      ]);
      return [analyseResult, generationResult];
    }

    case "cron_daily": {
      // Conformité quotidienne uniquement
      const result = await analyserConformite(ctx.payload as unknown as Parameters<typeof analyserConformite>[0]);
      return [result];
    }

    case "maturity_request": {
      // Analyse IMA à la demande
      const result = await analyserMaturite(ctx.payload as unknown as Parameters<typeof analyserMaturite>[0]);
      return [result];
    }

    default: {
      return [{
        success: false,
        error: `Unknown trigger: ${ctx.trigger}`,
        latencyMs: 0,
      }];
    }
  }
}
