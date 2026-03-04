import { useState } from "react";
import {
  FolderTree,
  Plus,
  ChevronRight,
  ChevronDown,
  Edit3,
  History,
  CheckCircle2,
  AlertCircle,
  Download,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface NomenclatureNode {
  id: string;
  code: string;
  label: string;
  level: number;
  children?: NomenclatureNode[];
  conforme?: boolean;
  montant?: string;
}

const nomenclature: NomenclatureNode[] = [
  {
    id: "1",
    code: "01",
    label: "Travaux",
    level: 0,
    conforme: true,
    montant: "28,5 M€",
    children: [
      {
        id: "1.1",
        code: "01.01",
        label: "Travaux neufs bâtiments",
        level: 1,
        conforme: true,
        montant: "15,0 M€",
        children: [
          { id: "1.1.1", code: "01.01.01", label: "Gros œuvre", level: 2, conforme: true, montant: "8,2 M€" },
          { id: "1.1.2", code: "01.01.02", label: "Second œuvre", level: 2, conforme: true, montant: "4,3 M€" },
          { id: "1.1.3", code: "01.01.03", label: "Lots techniques", level: 2, conforme: false, montant: "2,5 M€" },
        ],
      },
      {
        id: "1.2",
        code: "01.02",
        label: "Travaux voirie et réseaux",
        level: 1,
        conforme: true,
        montant: "8,5 M€",
      },
      {
        id: "1.3",
        code: "01.03",
        label: "Entretien et maintenance",
        level: 1,
        conforme: true,
        montant: "5,0 M€",
      },
    ],
  },
  {
    id: "2",
    code: "02",
    label: "Fournitures",
    level: 0,
    conforme: true,
    montant: "18,2 M€",
    children: [
      { id: "2.1", code: "02.01", label: "Fournitures informatiques", level: 1, conforme: false, montant: "7,2 M€" },
      { id: "2.2", code: "02.02", label: "Fournitures de bureau", level: 1, conforme: true, montant: "4,5 M€" },
      { id: "2.3", code: "02.03", label: "Mobilier", level: 1, conforme: true, montant: "3,5 M€" },
      { id: "2.4", code: "02.04", label: "Fournitures scolaires", level: 1, conforme: true, montant: "3,0 M€" },
    ],
  },
  {
    id: "3",
    code: "03",
    label: "Services",
    level: 0,
    conforme: true,
    montant: "22,8 M€",
    children: [
      { id: "3.1", code: "03.01", label: "Prestations intellectuelles", level: 1, conforme: true, montant: "8,0 M€" },
      { id: "3.2", code: "03.02", label: "Nettoyage et propreté", level: 1, conforme: true, montant: "6,0 M€" },
      { id: "3.3", code: "03.03", label: "Formation", level: 1, conforme: true, montant: "4,8 M€" },
    ],
  },
  {
    id: "4",
    code: "04",
    label: "PI / TIC",
    level: 0,
    conforme: true,
    montant: "14,7 M€",
  },
];

const versions = [
  { version: "v3.2", date: "01/02/2026", auteur: "M. Dupont", note: "Ajout sous-famille PI/TIC" },
  { version: "v3.1", date: "15/12/2025", auteur: "Mme Martin", note: "Réorganisation Fournitures" },
  { version: "v3.0", date: "01/09/2025", auteur: "M. Dupont", note: "Version initiale 2026" },
];

function TreeNode({ node, selectedId, onSelect }: { node: NomenclatureNode; selectedId: string | null; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState(node.level === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded text-sm hover:bg-muted/50 transition-colors ${
          selectedId === node.id ? "bg-primary/5 border-l-2 border-primary" : ""
        }`}
        style={{ paddingLeft: `${node.level * 24 + 12}px` }}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground/40 flex-shrink-0 cursor-grab" />
        {hasChildren ? (
          expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <div className="w-3.5" />
        )}
        <span className="font-mono text-xs text-muted-foreground w-16 flex-shrink-0">{node.code}</span>
        <span className="flex-1 truncate">{node.label}</span>
        {node.montant && <span className="text-xs text-muted-foreground ml-2">{node.montant}</span>}
        {node.conforme !== undefined && (
          node.conforme
            ? <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            : <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
        )}
      </div>
      {expanded && hasChildren && node.children!.map((child) => (
        <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function findNode(nodes: NomenclatureNode[], id: string): NomenclatureNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function Nomenclature() {
  const [selectedId, setSelectedId] = useState<string | null>("1.1.1");
  const selected = selectedId ? findNode(nomenclature, selectedId) : null;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nomenclature des achats</h1>
          <p className="text-sm text-muted-foreground mt-1">Structure arborescente — Version 3.2</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <History className="w-3.5 h-3.5" /> Historique
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-3.5 h-3.5" /> Exporter
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" /> Nouvelle entrée
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Tree */}
        <div className="flex-1 min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FolderTree className="w-4 h-4" />
                Arborescence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {nomenclature.map((node) => (
                  <TreeNode key={node.id} node={node} selectedId={selectedId} onSelect={setSelectedId} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Panel */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {selected ? (
            <Card className="shadow-sm animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Édition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Code</label>
                  <Input defaultValue={selected.code} className="mt-1 font-mono text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Libellé</label>
                  <Input defaultValue={selected.label} className="mt-1 text-sm" />
                </div>
                {selected.montant && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Montant consolidé</label>
                    <Input defaultValue={selected.montant} className="mt-1 text-sm" readOnly />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Conformité</label>
                  <div className="mt-1">
                    {selected.conforme ? (
                      <span className="badge-conforme"><CheckCircle2 className="w-3 h-3" /> Conforme</span>
                    ) : (
                      <span className="badge-alerte"><AlertCircle className="w-3 h-3" /> À vérifier</span>
                    )}
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button size="sm" className="flex-1 text-xs">Enregistrer</Button>
                  <Button size="sm" variant="outline" className="text-xs">Annuler</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Sélectionnez un élément dans l'arborescence
              </CardContent>
            </Card>
          )}

          {/* Versions */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="w-4 h-4" /> Versions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {versions.map((v) => (
                <div key={v.version} className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 text-xs">
                  <span className="font-mono font-medium text-primary">{v.version}</span>
                  <div className="flex-1">
                    <p className="text-foreground">{v.note}</p>
                    <p className="text-muted-foreground mt-0.5">{v.auteur} — {v.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
