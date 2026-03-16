"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoAction, useToastStore } from "@/store/toast";
import {
  FolderTree, Plus, ChevronRight, ChevronDown, Edit3, History,
  CheckCircle2, AlertCircle, Download, GripVertical, Shield,
  BookOpen, Layers, Scale,
} from "lucide-react";

/* ── Static tree (maquette-faithful demo data) ── */
interface StaticNode {
  id: string;
  code: string;
  label: string;
  level: number;
  type?: string;
  children?: StaticNode[];
  conforme?: boolean;
  montant?: string;
  seuil?: string;
}

const nomenclatureTree: StaticNode[] = [
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
  { version: "v2.4", date: "15/06/2025", auteur: "M. Cappanera", note: "Audit nomenclature existante — recommandations CartoAP" },
];

const journal = [
  { date: "01/02/2026 14:23", action: "Ajout code 04.03", utilisateur: "M. Dupont", detail: "Hébergement cloud — nouvelle sous-famille" },
  { date: "28/01/2026 09:15", action: "Modification périmètre", utilisateur: "Mme Martin", detail: "Code 02.01 — exclusion EPI (transféré vers 01.03)" },
  { date: "15/01/2026 16:40", action: "Validation direction", utilisateur: "M. Bernard", detail: "DGA Numérique — validation nomenclature PI/TIC" },
  { date: "10/01/2026 11:00", action: "Atelier co-construction", utilisateur: "M. Dupont", detail: "Session avec services techniques — ajustements codes 01.x" },
];

function findNode(nodes: StaticNode[], id: string): StaticNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) { const f = findNode(n.children, id); if (f) return f; }
  }
  return null;
}

function TreeNodeItem({
  node, selectedId, onSelect,
}: {
  node: StaticNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(node.level === 0);
  const hasChildren = !!(node.children && node.children.length > 0);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-2 cursor-pointer text-xs hover:bg-muted/40 transition-colors ${
          isSelected ? "bg-primary/5 border-l-2 border-primary" : "border-l-2 border-transparent"
        }`}
        style={{ paddingLeft: `${node.level * 20 + 8}px` }}
        onClick={() => { onSelect(node.id); if (hasChildren) setExpanded(!expanded); }}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
        {hasChildren
          ? (expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />)
          : <div className="w-3" />
        }
        <span className="font-mono text-[10px] text-muted-foreground w-14 flex-shrink-0">{node.code}</span>
        <span className={`flex-1 truncate ${node.level === 0 ? "font-semibold text-foreground" : "text-foreground"}`}>{node.label}</span>
        {node.type && (
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
            {node.type}
          </span>
        )}
        {node.montant && <span className="text-[11px] text-muted-foreground tabular-nums ml-1 flex-shrink-0">{node.montant}</span>}
        {node.conforme !== undefined && (
          node.conforme
            ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#10B981" }} />
            : <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: "#F59E0B" }} />
        )}
      </div>
      {expanded && hasChildren && node.children!.map((child) => (
        <TreeNodeItem key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ── Also fetch backend nodes for KPIs ── */
interface ApiNode { id: string; code: string; type: string; conforme: boolean; }

export default function NomenclaturePage() {
  const { accessToken, currentOrg } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };
  const [selectedId, setSelectedId] = useState<string | null>("1.1.3");
  const selected = selectedId ? findNode(nomenclatureTree, selectedId) : null;

  const demo = useDemoAction();
  const showToast = useToastStore((s) => s.show);

  const { data: apiNodes = [] } = useQuery<ApiNode[]>({
    queryKey: ["nomenclature", currentOrg?.id],
    queryFn: () => api.get("/api/v1/nomenclature", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const familles = apiNodes.filter((n) => n.type === "famille").length || 4;
  const codes = apiNodes.filter((n) => n.type === "code").length || 86;

  return (
    <div className="space-y-6">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Module nomenclature</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
              <BookOpen className="w-3.5 h-3.5" style={{ color: "#6366F1" }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Nomenclature des achats</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Structure en entonnoir · Familles → Types de dépense → Codes · Version 3.2
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={demo} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
            <History className="w-3.5 h-3.5" /> Historique
          </button>
          <button onClick={demo} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Exporter
          </button>
          <button
            onClick={demo}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
            style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle entrée
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Familles d'achats", value: familles, icon: Layers },
          { label: "Codes actifs", value: codes, icon: FolderTree },
          { label: "Exhaustivité", value: "96%", icon: CheckCircle2 },
          { label: "Exclusivité mutuelle", value: "98%", icon: Scale },
          { label: "Adhésion utilisateurs", value: "92%", icon: BookOpen },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5" style={{ color: "#5C93FF" }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
            </div>
            <span className="text-xl font-bold font-display text-foreground">{value}</span>
          </div>
        ))}
      </div>

      {/* Principes CartoAP */}
      <div
        className="rounded-xl border p-4 flex items-start gap-3"
        style={{ borderColor: "rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.03)" }}
      >
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#10B981" }} />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold" style={{ color: "#10B981" }}>Principes CartoAP</span>
          {" "}— Codes <strong className="text-foreground">collectivement exhaustifs</strong> (toute prestation classable) et{" "}
          <strong className="text-foreground">mutuellement exclusifs</strong> (un seul code par prestation). Nomenclature sur-mesure issue d&apos;une étude empirique de la dépense mandatée.
        </div>
      </div>

      {/* Main layout: tree + right sidebar */}
      <div className="flex gap-4">
        {/* Tree */}
        <div className="flex-1 min-w-0 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <FolderTree className="w-4 h-4" style={{ color: "#5C93FF" }} />
            <h2 className="text-sm font-semibold text-foreground">Arborescence nomenclaturale</h2>
          </div>
          <div>
            {nomenclatureTree.map((node) => (
              <TreeNodeItem key={node.id} node={node} selectedId={selectedId} onSelect={setSelectedId} />
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0 space-y-3">
          {/* Edit panel */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Edit3 className="w-4 h-4" style={{ color: "#5C93FF" }} />
              <h2 className="text-sm font-semibold text-foreground">Édition</h2>
            </div>
            {selected ? (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Code</label>
                  <input
                    defaultValue={selected.code}
                    className="mt-1 w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Libellé</label>
                  <input
                    defaultValue={selected.label}
                    className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Type</label>
                  <div className="mt-1 text-xs bg-muted px-2 py-1.5 rounded-lg text-foreground">{selected.type || "—"}</div>
                </div>
                {selected.montant && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Montant consolidé</label>
                    <div className="mt-1 text-xs font-semibold num text-foreground">{selected.montant}</div>
                  </div>
                )}
                {selected.seuil && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Seuil de procédure</label>
                    <div className="mt-1 text-xs text-foreground">{selected.seuil}</div>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Conformité</label>
                  <div className="mt-1">
                    {selected.conforme ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                        <CheckCircle2 className="w-3 h-3" /> Conforme
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                        <AlertCircle className="w-3 h-3" /> Non conforme
                      </span>
                    )}
                  </div>
                </div>

                {/* INCLUT / EXCLUT for level-2 codes */}
                {selected.level === 2 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Périmètre du code</label>
                    <div className="text-xs space-y-1.5">
                      <div className="p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <span className="font-semibold text-[10px]" style={{ color: "#10B981" }}>INCLUT</span>
                        <p className="text-muted-foreground mt-0.5">Prestations de {selected.label.toLowerCase()}</p>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <span className="font-semibold text-[10px]" style={{ color: "#EF4444" }}>EXCLUT</span>
                        <p className="text-muted-foreground mt-0.5">Voir codes adjacents</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => showToast("Modification enregistrée avec succès.", "success")}
                    className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-white"
                    style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}
                  >
                    Enregistrer
                  </button>
                  <button onClick={demo} className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground">Sélectionnez un élément</div>
            )}
          </div>

          {/* Versions */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <History className="w-4 h-4" style={{ color: "#5C93FF" }} />
              <h2 className="text-sm font-semibold text-foreground">Versions</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {versions.map((v) => (
                <div key={v.version} className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/30 text-[11px]">
                  <span className="font-mono font-semibold w-8 flex-shrink-0" style={{ color: "#5C93FF" }}>{v.version}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-snug">{v.note}</p>
                    <p className="text-muted-foreground mt-0.5">{v.auteur} — {v.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Journal */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: "#5C93FF" }} />
              <h2 className="text-sm font-semibold text-foreground">Journal des modifications</h2>
            </div>
            <div className="p-3 space-y-1.5">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
