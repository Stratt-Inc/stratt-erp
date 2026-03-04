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
  Shield,
  BookOpen,
  Layers,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NomenclatureNode {
  id: string;
  code: string;
  label: string;
  level: number;
  type?: string;
  children?: NomenclatureNode[];
  conforme?: boolean;
  montant?: string;
  seuil?: string;
  nbCodes?: number;
}

const nomenclature: NomenclatureNode[] = [
  {
    id: "1", code: "01", label: "Travaux", level: 0, type: "Famille", conforme: true, montant: "28,5 M€", seuil: "215 000 €",
    children: [
      {
        id: "1.1", code: "01.01", label: "Travaux neufs bâtiments", level: 1, type: "Sous-famille", conforme: true, montant: "15,0 M€",
        children: [
          { id: "1.1.1", code: "01.01.01", label: "Gros œuvre", level: 2, type: "Code", conforme: true, montant: "8,2 M€", seuil: "215 000 €" },
          { id: "1.1.2", code: "01.01.02", label: "Second œuvre", level: 2, type: "Code", conforme: true, montant: "4,3 M€", seuil: "215 000 €" },
          { id: "1.1.3", code: "01.01.03", label: "Lots techniques (CVC, élec.)", level: 2, type: "Code", conforme: false, montant: "2,5 M€", seuil: "215 000 €" },
        ],
      },
      { id: "1.2", code: "01.02", label: "Voirie et réseaux divers", level: 1, type: "Sous-famille", conforme: true, montant: "8,5 M€" },
      { id: "1.3", code: "01.03", label: "Entretien et maintenance bâtiment", level: 1, type: "Sous-famille", conforme: true, montant: "5,0 M€" },
    ],
  },
  {
    id: "2", code: "02", label: "Fournitures", level: 0, type: "Famille", conforme: false, montant: "18,2 M€", seuil: "90 000 €",
    children: [
      { id: "2.1", code: "02.01", label: "Fournitures informatiques", level: 1, type: "Sous-famille", conforme: false, montant: "7,2 M€" },
      { id: "2.2", code: "02.02", label: "Fournitures de bureau", level: 1, type: "Sous-famille", conforme: true, montant: "4,5 M€" },
      { id: "2.3", code: "02.03", label: "Mobilier", level: 1, type: "Sous-famille", conforme: true, montant: "3,5 M€" },
      { id: "2.4", code: "02.04", label: "Fournitures scolaires", level: 1, type: "Sous-famille", conforme: true, montant: "3,0 M€" },
    ],
  },
  {
    id: "3", code: "03", label: "Services", level: 0, type: "Famille", conforme: true, montant: "22,8 M€", seuil: "90 000 €",
    children: [
      { id: "3.1", code: "03.01", label: "Prestations intellectuelles", level: 1, type: "Sous-famille", conforme: true, montant: "8,0 M€" },
      { id: "3.2", code: "03.02", label: "Nettoyage et propreté", level: 1, type: "Sous-famille", conforme: true, montant: "6,0 M€" },
      { id: "3.3", code: "03.03", label: "Formation professionnelle", level: 1, type: "Sous-famille", conforme: true, montant: "4,8 M€" },
      { id: "3.4", code: "03.04", label: "Maintenance et réparation", level: 1, type: "Sous-famille", conforme: true, montant: "4,0 M€" },
    ],
  },
  { id: "4", code: "04", label: "PI / TIC", level: 0, type: "Famille", conforme: true, montant: "14,7 M€", seuil: "215 000 €" },
];

const versions = [
  { version: "v3.2", date: "01/02/2026", auteur: "M. Dupont", note: "Ajout sous-famille PI/TIC « Hébergement »" },
  { version: "v3.1", date: "15/12/2025", auteur: "Mme Martin", note: "Réorganisation Fournitures après atelier directions" },
  { version: "v3.0", date: "01/09/2025", auteur: "M. Dupont", note: "Version initiale — étude empirique dépense mandatée" },
  { version: "v2.4", date: "15/06/2025", auteur: "M. Cappanera", note: "Audit nomenclature existante — recommandations Cartoap" },
];

const journal = [
  { date: "01/02/2026 14:23", action: "Ajout code 04.03", utilisateur: "M. Dupont", detail: "Hébergement cloud — nouvelle sous-famille" },
  { date: "28/01/2026 09:15", action: "Modification périmètre", utilisateur: "Mme Martin", detail: "Code 02.01 — exclusion EPI (transféré vers 01.03)" },
  { date: "15/01/2026 16:40", action: "Validation direction", utilisateur: "M. Bernard", detail: "DGA Numérique — validation nomenclature PI/TIC" },
  { date: "10/01/2026 11:00", action: "Atelier co-construction", utilisateur: "M. Dupont", detail: "Session avec services techniques — ajustements codes 01.x" },
];

function TreeNode({ node, selectedId, onSelect }: { node: NomenclatureNode; selectedId: string | null; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState(node.level === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-2 cursor-pointer text-[12px] hover:bg-muted/40 transition-colors ${
          selectedId === node.id ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
        }`}
        style={{ paddingLeft: `${node.level * 20 + 8}px` }}
        onClick={() => { onSelect(node.id); if (hasChildren) setExpanded(!expanded); }}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
        {hasChildren ? (expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />) : <div className="w-3" />}
        <span className="font-mono text-[10px] text-muted-foreground w-14 flex-shrink-0">{node.code}</span>
        <span className={`flex-1 truncate ${node.level === 0 ? "font-semibold" : ""}`}>{node.label}</span>
        {node.type && <span className="text-[9px] text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">{node.type}</span>}
        {node.montant && <span className="text-[11px] text-muted-foreground tabular-nums ml-1">{node.montant}</span>}
        {node.conforme !== undefined && (
          node.conforme
            ? <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
            : <AlertCircle className="w-3 h-3 text-warning flex-shrink-0" />
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
    if (n.children) { const f = findNode(n.children, id); if (f) return f; }
  }
  return null;
}

export default function Nomenclature() {
  const [selectedId, setSelectedId] = useState<string | null>("1.1.3");
  const selected = selectedId ? findNode(nomenclature, selectedId) : null;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">Module nomenclature</p>
          <h1>Nomenclature des achats</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Structure en entonnoir · Familles → Types de dépense → Codes · Version 3.2
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-[12px]"><History className="w-3.5 h-3.5" /> Historique</Button>
          <Button variant="outline" size="sm" className="gap-2 text-[12px]"><Download className="w-3.5 h-3.5" /> Exporter</Button>
          <Button size="sm" className="gap-2 text-[12px]"><Plus className="w-3.5 h-3.5" /> Nouvelle entrée</Button>
        </div>
      </div>

      {/* Indicateurs nomenclature */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Familles d'achats", value: "4", icon: Layers },
          { label: "Codes actifs", value: "86", icon: FolderTree },
          { label: "Exhaustivité", value: "96%", icon: CheckCircle2 },
          { label: "Exclusivité mutuelle", value: "98%", icon: Scale },
          { label: "Adhésion utilisateurs", value: "92%", icon: BookOpen },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-3.5 h-3.5 text-primary" />
              <span className="metric-label">{kpi.label}</span>
            </div>
            <span className="text-xl font-bold">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Principes livre blanc */}
      <Card className="border-accent/15 bg-accent/3">
        <CardContent className="py-3 flex items-start gap-3">
          <Shield className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-[12px] leading-relaxed">
            <span className="font-semibold text-accent">Principes CartoAP</span> — Codes <strong>collectivement exhaustifs</strong> (toute prestation classable) et <strong>mutuellement exclusifs</strong> (un seul code par prestation). Nomenclature sur-mesure issue d'une étude empirique de la dépense mandatée.
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {/* Tree */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[13px] flex items-center gap-2">
                <FolderTree className="w-4 h-4" />
                Arborescence nomenclaturale
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {nomenclature.map((node) => (
                <TreeNode key={node.id} node={node} selectedId={selectedId} onSelect={setSelectedId} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Edit Panel */}
        <div className="w-72 flex-shrink-0 space-y-3">
          {selected ? (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-[13px] flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Édition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="metric-label">Code</label>
                  <Input defaultValue={selected.code} className="mt-1 font-mono text-[12px] h-8" />
                </div>
                <div>
                  <label className="metric-label">Libellé</label>
                  <Input defaultValue={selected.label} className="mt-1 text-[12px] h-8" />
                </div>
                <div>
                  <label className="metric-label">Type</label>
                  <div className="mt-1 text-[12px] bg-muted px-2 py-1 rounded">{selected.type || "—"}</div>
                </div>
                {selected.montant && (
                  <div>
                    <label className="metric-label">Montant consolidé</label>
                    <div className="mt-1 text-[12px] font-semibold">{selected.montant}</div>
                  </div>
                )}
                {selected.seuil && (
                  <div>
                    <label className="metric-label">Seuil de procédure</label>
                    <div className="mt-1 text-[12px]">{selected.seuil}</div>
                  </div>
                )}
                <div>
                  <label className="metric-label">Conformité</label>
                  <div className="mt-1">
                    {selected.conforme ? (
                      <span className="badge-conforme"><CheckCircle2 className="w-3 h-3" /> Conforme</span>
                    ) : (
                      <span className="badge-alerte"><AlertCircle className="w-3 h-3" /> Non conforme</span>
                    )}
                  </div>
                </div>

                {/* Inclusions / Exclusions (livre blanc concept) */}
                {selected.level === 2 && (
                  <div className="space-y-2 pt-2 border-t">
                    <label className="metric-label">Périmètre du code</label>
                    <div className="text-[11px] space-y-1">
                      <div className="p-1.5 rounded bg-accent/5 border border-accent/15">
                        <span className="font-semibold text-accent text-[10px]">INCLUT</span>
                        <p className="text-muted-foreground mt-0.5">Prestations de {selected.label.toLowerCase()}</p>
                      </div>
                      <div className="p-1.5 rounded bg-destructive/5 border border-destructive/15">
                        <span className="font-semibold text-destructive text-[10px]">EXCLUT</span>
                        <p className="text-muted-foreground mt-0.5">Voir codes adjacents</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <Button size="sm" className="flex-1 text-[11px] h-7">Enregistrer</Button>
                  <Button size="sm" variant="outline" className="text-[11px] h-7">Annuler</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-[12px] text-muted-foreground">
                Sélectionnez un élément
              </CardContent>
            </Card>
          )}

          {/* Versions */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[13px] flex items-center gap-2"><History className="w-4 h-4" /> Versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {versions.map((v) => (
                <div key={v.version} className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/30 text-[11px]">
                  <span className="font-mono font-semibold text-primary w-8">{v.version}</span>
                  <div className="flex-1">
                    <p className="text-foreground leading-snug">{v.note}</p>
                    <p className="text-muted-foreground mt-0.5">{v.auteur} — {v.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Journal */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[13px] flex items-center gap-2"><BookOpen className="w-4 h-4" /> Journal des modifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {journal.map((j, i) => (
                <div key={i} className="p-1.5 rounded text-[11px] hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{j.action}</span>
                    <span className="text-muted-foreground">— {j.utilisateur}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{j.detail}</p>
                  <p className="text-[10px] text-muted-foreground/70 font-mono">{j.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
