"use client";

import { useState } from "react";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoAction, useToastStore } from "@/store/toast";
import {
  FileText, Download, Eye, CheckSquare, Square, FileSpreadsheet,
  File, Loader2, Stamp, Building2, Printer,
} from "lucide-react";

interface Section {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  pages?: string;
}

const initialSections: Section[] = [
  { id: "couverture", label: "Page de couverture institutionnelle", description: "Logo, collectivité, date, version du document", checked: true, pages: "1" },
  { id: "intro", label: "Introduction et contexte réglementaire", description: "Cadre juridique CCP 2024, objectifs de la démarche", checked: true, pages: "2-3" },
  { id: "methodo", label: "Méthodologie de cartographie", description: "Étude empirique de la dépense mandatée, démarche CartoAP", checked: true, pages: "4-6" },
  { id: "nomenclature", label: "Nomenclature des achats", description: "Arborescence complète : familles, types de dépense, codes", checked: true, pages: "7-14" },
  { id: "perimetres", label: "Périmètres des codes", description: "Définitions strictes, inclusions et exclusions par code", checked: true, pages: "15-22" },
  { id: "carto", label: "Cartographie détaillée", description: "Analyse par famille homogène, treemap, consolidation", checked: true, pages: "23-30" },
  { id: "seuils", label: "Computation des seuils", description: "Seuils de procédure par code, analyse du fractionnement", checked: true, pages: "31-34" },
  { id: "budget", label: "Analyse budgétaire consolidée", description: "Répartition par direction, comparatif N/N-1, écarts", checked: true, pages: "35-38" },
  { id: "conformite", label: "Indicateurs de conformité", description: "Sécurité juridique, alertes, risques identifiés", checked: true, pages: "39-41" },
  { id: "planif", label: "Planification des passations", description: "Calendrier prévisionnel, charge, vision pluriannuelle", checked: false, pages: "42-46" },
  { id: "recommandations", label: "Recommandations et axes d'optimisation", description: "Leviers d'amélioration, mutualisation, performance", checked: false, pages: "47-49" },
  { id: "implementation", label: "Document d'implémentation informatique", description: "Format pour import dans le progiciel financier", checked: true, pages: "50-52" },
  { id: "annexes", label: "Annexes", description: "Données brutes, glossaire, références réglementaires", checked: false, pages: "53-56" },
];

const recentDocs = [
  { name: "Implémentation_v3.2.pdf", date: "01/02/2026", size: "2,4 Mo", type: "PDF" },
  { name: "Cartographie_2025.xlsx", date: "15/12/2025", size: "1,8 Mo", type: "XLSX" },
  { name: "Nomenclature_progiciel.csv", date: "01/12/2025", size: "245 Ko", type: "CSV" },
  { name: "Rendus_directions_v3.1.pdf", date: "15/11/2025", size: "3,1 Mo", type: "PDF" },
];

function calcPages(sections: Section[]): number {
  return sections.filter((s) => s.checked).reduce((acc, s) => {
    if (!s.pages) return acc;
    const parts = s.pages.split("-");
    return acc + (parts.length === 2 ? parseInt(parts[1]) - parseInt(parts[0]) + 1 : 1);
  }, 0);
}

export default function ExportsPage() {
  const [sections, setSections] = useState(initialSections);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleSection = (id: string) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));

  const selectedCount = sections.filter((s) => s.checked).length;
  const totalPages = calcPages(sections);

  const demo = useDemoAction();
  const showToast = useToastStore((s) => s.show);

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); showToast("Document généré — prêt à télécharger.", "success"); }, 2500);
  };

  return (
    <div className="space-y-6">
      <DemoBanner />

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Module documents</p>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
            <FileText className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Génération documentaire & Exports</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Document d&apos;implémentation informatique · Rendus formalisés · Exports réglementaires
        </p>
      </div>

      {/* Rendus formalisés info */}
      <div
        className="rounded-xl border p-4 flex items-start gap-3"
        style={{ borderColor: "rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.03)" }}
      >
        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#10B981" }} />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold" style={{ color: "#10B981" }}>Rendus formalisés</span>
          {" "}— Le document est généré conformément aux recommandations CartoAP : un fichier PDF lisible et esthétique pour la diffusion, un fichier XLSX récapitulatif pour les filtres, et un format d&apos;import pour le progiciel financier.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sections list */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "#5C93FF" }} />
              <h2 className="text-sm font-semibold text-foreground">Sections du document</h2>
            </div>
            <span className="text-xs text-muted-foreground">{selectedCount} sélectionnées · ~{totalPages} pages</span>
          </div>
          <div className="divide-y divide-border">
            {sections.map((s) => (
              <div
                key={s.id}
                onClick={() => toggleSection(s.id)}
                className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors ${
                  s.checked ? "bg-primary/[0.03]" : "hover:bg-muted/30"
                }`}
                style={s.checked ? { borderLeft: "2px solid rgba(36,221,184,0.25)" } : { borderLeft: "2px solid transparent" }}
              >
                {s.checked
                  ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#5C93FF" }} />
                  : <Square className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
                {s.pages && (
                  <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0 mt-0.5">p. {s.pages}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions panel */}
        <div className="space-y-4">
          {/* Generate card */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Générer le document</h2>

            {/* Document metadata */}
            <div className="space-y-2 mb-4">
              {[
                { label: "Collectivité", value: "Métropole de Lyon" },
                { label: "Exercice", value: "2026" },
                { label: "Nomenclature", value: "v3.2" },
                { label: "Sections", value: `${selectedCount} / ${sections.length}` },
                { label: "Pages estimées", value: `~${totalPages}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-3 py-2 rounded-lg bg-muted/40 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || selectedCount === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}
            >
              {generating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Génération en cours…</>
              ) : (
                <><FileText className="w-3.5 h-3.5" /> Générer le document</>
              )}
            </button>

            {generated && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#10B981" }}>
                  <CheckSquare className="w-3.5 h-3.5" /> Document prêt — {totalPages} pages
                </p>
                {[
                  { icon: Eye, label: "Aperçu structuré" },
                  { icon: File, label: "Export PDF institutionnel" },
                  { icon: FileSpreadsheet, label: "Export XLSX récapitulatif" },
                  { icon: Building2, label: "Format progiciel financier" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={demo}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
                <div className="border-t border-border my-1" />
                {[
                  { icon: Stamp, label: "Signature numérique" },
                  { icon: Printer, label: "Version imprimable" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={demo}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent docs */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Documents récents</h2>
            </div>
            <div className="divide-y divide-border">
              {recentDocs.map((doc) => (
                <div key={doc.name} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                  <File className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.date} — {doc.size}</p>
                  </div>
                  <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-semibold text-muted-foreground flex-shrink-0">{doc.type}</span>
                  <button onClick={demo}><Download className="w-3 h-3 text-muted-foreground hover:text-foreground flex-shrink-0" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
