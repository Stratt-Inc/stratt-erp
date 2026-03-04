import { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  CheckSquare,
  Square,
  FileSpreadsheet,
  File,
  Loader2,
  Stamp,
  Building2,
  Shield,
  Printer,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/StatsGrid";

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

export default function Exports() {
  const [sections, setSections] = useState(initialSections);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleSection = (id: string) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));

  const selectedCount = sections.filter((s) => s.checked).length;
  const totalPages = sections.filter((s) => s.checked).reduce((acc, s) => {
    if (!s.pages) return acc;
    const parts = s.pages.split("-");
    return acc + (parts.length === 2 ? parseInt(parts[1]) - parseInt(parts[0]) + 1 : 1);
  }, 0);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 animate-fade-in">
        <div className="flex-1">
          <p className="section-label mb-2">Module documents</p>
          <h1 className="mb-2 text-2xl sm:text-3xl">Génération documentaire & Exports</h1>
          <p className="text-[13px] sm:text-[14px] text-muted-foreground">
            Document d'implémentation informatique · Rendus formalisés · Exports réglementaires
          </p>
        </div>
        <Button size="sm" className="gap-1 sm:gap-2 text-[12px] sm:text-[13px] h-8 sm:h-9 px-2 sm:px-3 rounded-lg flex-shrink-0" disabled={generating}>
          {generating && <Loader2 className="w-4 h-4 animate-spin" />}
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Télécharger</span>
        </Button>
      </div>

      {/* Stats Exports */}
      <StatsGrid
        stats={[
          { label: "Documents générés", value: "12", icon: FileText, trend: { value: "+3", positive: true } },
          { label: "Dernière génération", value: "1h", icon: Clock },
          { label: "Exports ce mois", value: "47", icon: TrendingUp, trend: { value: "+12", positive: true } },
          { label: "Conforme RGPD", value: "100%", icon: Shield },
        ]}
        columns="4"
      />

      {/* Principes rendus (from livre blanc) */}
      <Card className="border-accent/15 bg-accent/3 border-2">
        <CardContent className="py-4 flex items-start gap-4">
          <FileText className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-[13px] leading-relaxed">
            <span className="font-semibold text-accent">Rendus formalisés</span> — Le document est généré conformément aux recommandations CartoAP : un fichier PDF lisible et esthétique pour la diffusion, un fichier XLSX récapitulatif pour les filtres, et un format d'import pour le progiciel financier.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sections */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Sections du document
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {selectedCount} sélectionnées · ~{totalPages} pages
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`flex items-start gap-3 p-2.5 rounded cursor-pointer transition-colors border ${
                    section.checked ? "bg-primary/4 border-primary/15" : "border-transparent hover:bg-muted/30"
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  {section.checked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium leading-snug">{section.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{section.description}</p>
                  </div>
                  {section.pages && (
                    <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">p. {section.pages}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Actions Panel */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px]">Générer le document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Document metadata */}
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Collectivité</span>
                  <span className="font-medium">Métropole de Lyon</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Exercice</span>
                  <span className="font-medium">2026</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Nomenclature</span>
                  <span className="font-medium">v3.2</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Sections</span>
                  <span className="font-medium">{selectedCount} / {sections.length}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Pages estimées</span>
                  <span className="font-medium">~{totalPages}</span>
                </div>
              </div>

              <Button
                className="w-full gap-2 text-[12px]"
                onClick={handleGenerate}
                disabled={generating || selectedCount === 0}
              >
                {generating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Génération en cours…</>
                ) : (
                  <><FileText className="w-3.5 h-3.5" /> Générer le document</>
                )}
              </Button>

              {generated && (
                <div className="space-y-2 pt-3 border-t">
                  <p className="text-[11px] font-semibold text-accent flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Document prêt — {totalPages} pages
                  </p>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-[11px] h-7">
                    <Eye className="w-3.5 h-3.5" /> Aperçu structuré
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-[11px] h-7">
                    <File className="w-3.5 h-3.5" /> Export PDF institutionnel
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-[11px] h-7">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export XLSX récapitulatif
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-[11px] h-7">
                    <Building2 className="w-3.5 h-3.5" /> Format progiciel financier
                  </Button>
                  <div className="panel-divider" />
                  <Button variant="outline" size="sm" className="w-full gap-2 text-[11px] h-7">
                    <Stamp className="w-3.5 h-3.5" /> Signature numérique
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-[11px] h-7">
                    <Printer className="w-3.5 h-3.5" /> Version imprimable
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px]">Documents récents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { name: "Implémentation_v3.2.pdf", date: "01/02/2026", size: "2,4 Mo", type: "PDF" },
                { name: "Cartographie_2025.xlsx", date: "15/12/2025", size: "1,8 Mo", type: "XLSX" },
                { name: "Nomenclature_progiciel.csv", date: "01/12/2025", size: "245 Ko", type: "CSV" },
                { name: "Rendus_directions_v3.1.pdf", date: "15/11/2025", size: "3,1 Mo", type: "PDF" },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center gap-2.5 p-2 rounded hover:bg-muted/30 transition-colors">
                  <File className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.date} — {doc.size}</p>
                  </div>
                  <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-semibold text-muted-foreground">{doc.type}</span>
                  <Download className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground flex-shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
