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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Section {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

const initialSections: Section[] = [
  { id: "intro", label: "Introduction et contexte", description: "Présentation de la collectivité et du périmètre d'achats", checked: true },
  { id: "methodo", label: "Méthodologie de cartographie", description: "Démarche d'analyse et de classification des achats", checked: true },
  { id: "nomenclature", label: "Nomenclature des achats", description: "Arborescence complète avec codes et libellés", checked: true },
  { id: "carto", label: "Cartographie détaillée", description: "Analyse par famille, sous-famille et segment", checked: true },
  { id: "budget", label: "Analyse budgétaire", description: "Répartition des dépenses par direction et famille", checked: true },
  { id: "planif", label: "Planification des passations", description: "Calendrier prévisionnel et échéances", checked: false },
  { id: "conformite", label: "Indicateurs de conformité", description: "Seuils, risques et alertes réglementaires", checked: true },
  { id: "recommandations", label: "Recommandations", description: "Axes d'optimisation et plan d'action", checked: false },
  { id: "annexes", label: "Annexes", description: "Documents complémentaires et données brutes", checked: false },
];

export default function Exports() {
  const [sections, setSections] = useState(initialSections);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const selectedCount = sections.filter((s) => s.checked).length;

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents & Exports</h1>
          <p className="text-sm text-muted-foreground mt-1">Génération du document d'implémentation informatique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sections */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Sections du document
                </span>
                <span className="text-xs font-normal text-muted-foreground">{selectedCount} / {sections.length} sélectionnées</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`flex items-start gap-3 p-3 rounded cursor-pointer transition-colors border ${
                    section.checked ? "bg-primary/5 border-primary/20" : "border-transparent hover:bg-muted/30"
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  {section.checked ? (
                    <CheckSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Générer le document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Le document d'implémentation informatique sera généré avec les {selectedCount} sections sélectionnées.
              </p>
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={generating || selectedCount === 0}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Génération…
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" /> Générer le document
                  </>
                )}
              </Button>

              {generated && (
                <div className="space-y-2 pt-2 border-t animate-fade-in">
                  <p className="text-xs font-medium text-accent flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Document prêt
                  </p>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <Eye className="w-3.5 h-3.5" /> Aperçu
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <File className="w-3.5 h-3.5" /> Export PDF
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export XLSX
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Documents récents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Implémentation_v3.2.pdf", date: "01/02/2026", size: "2,4 Mo" },
                { name: "Cartographie_2025.xlsx", date: "15/12/2025", size: "1,8 Mo" },
                { name: "Nomenclature_export.pdf", date: "01/12/2025", size: "890 Ko" },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 transition-colors">
                  <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.date} — {doc.size}</p>
                  </div>
                  <Download className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
