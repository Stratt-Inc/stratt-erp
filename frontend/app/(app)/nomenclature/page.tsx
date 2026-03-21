"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import { useDemoAction, useToastStore } from "@/store/toast";
import { MODULE } from "@/lib/colors";
import {
  FolderTree, Plus, ChevronRight, ChevronDown, Edit3, History,
  CheckCircle2, AlertCircle, Download, GripVertical, Shield,
  BookOpen, Layers, Scale, Search, Loader2,
} from "lucide-react";

/* ── API types ── */
interface ApiNode {
  id: string;
  code: string;
  label: string;
  description?: string;
  type: string;      // grande-famille | famille | code
  tag: string;       // Fournitures | Services | Travaux
  parent_id: string | null;
  seuil_mapa: number;
  seuil_ao: number;
  conforme: boolean;
  is_national: boolean;
  version: string;
  montant?: number;
}

/* ── Tree building ── */
interface TreeNode extends ApiNode {
  children: TreeNode[];
  level: number;
}

function buildTree(nodes: ApiNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  nodes.forEach((n) => map.set(n.id, { ...n, children: [], level: 0 }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  // Sort children by code
  const sort = (nodes: TreeNode[]): TreeNode[] =>
    nodes.sort((a, b) => a.code.localeCompare(b.code)).map((n) => ({ ...n, children: sort(n.children) }));
  // Set levels
  const setLevel = (nodes: TreeNode[], level: number) => {
    nodes.forEach((n) => { n.level = level; setLevel(n.children, level + 1); });
  };
  const sorted = sort(roots);
  setLevel(sorted, 0);
  return sorted;
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const f = findNode(n.children, id);
    if (f) return f;
  }
  return null;
}

/* ── Tree node component ── */
function TreeNodeItem({
  node, selectedId, onSelect,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(node.level === 0);
  const hasChildren = node.children.length > 0;
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
        {node.tag && node.level === 0 && (
          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
            {node.tag}
          </span>
        )}
        {node.conforme
          ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
          : <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(var(--warning))" }} />
        }
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <TreeNodeItem key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

const versions = [
  { version: "v2024", date: "01/01/2024", auteur: "Stratt", note: "Nomenclature nationale — UGAP/CPV/M57, 175 codes" },
];

const journal = [
  { date: "01/01/2024 00:00", action: "Import national", utilisateur: "Stratt", detail: "Nomenclature achats V1 — 175 codes, 32 familles" },
];

export default function NomenclaturePage() {
  const { accessToken, currentOrg } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const demo = useDemoAction();
  const showToast = useToastStore((s) => s.show);

  const { data: apiNodes = [], isLoading } = useQuery<ApiNode[]>({
    queryKey: ["nomenclature", currentOrg?.id],
    queryFn: () => api.get("/api/v1/nomenclature", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const tree = useMemo(() => buildTree(apiNodes), [apiNodes]);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.toLowerCase();
    const matchNode = (n: TreeNode): TreeNode | null => {
      const matches =
        n.label.toLowerCase().includes(q) ||
        n.code.toLowerCase().includes(q) ||
        (n.description ?? "").toLowerCase().includes(q);
      const filteredChildren = n.children.map(matchNode).filter(Boolean) as TreeNode[];
      if (matches || filteredChildren.length > 0) return { ...n, children: filteredChildren };
      return null;
    };
    return tree.map(matchNode).filter(Boolean) as TreeNode[];
  }, [tree, search]);

  const selected = selectedId ? findNode(tree, selectedId) : null;
  const familles = apiNodes.filter((n) => n.type === "famille").length;
  const codes = apiNodes.filter((n) => n.type === "code").length;
  const conformes = apiNodes.filter((n) => n.conforme).length;
  const exhaustivite = apiNodes.length > 0 ? Math.round((conformes / apiNodes.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-42px)]">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-end justify-between gap-8 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--violet) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.nomenclature, boxShadow: `0 0 6px ${MODULE.nomenclature}` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Module Nomenclature</span>
          </div>
          <h1 className="text-[22px] leading-none font-extrabold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.025em" }}>
            Nomenclature des{" "}
            <Highlight variant="underline" color="violet">achats</Highlight>
          </h1>
          <p className="text-[13px] mt-1 font-medium" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
            Structure en entonnoir · Grande famille → Famille → Code · Version 2024
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
            style={{ background: MODULE.nomenclature }}
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle entrée
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 flex-shrink-0">
        {[
          { label: "Familles d'achats", value: isLoading ? "…" : familles, icon: Layers, color: MODULE.nomenclature },
          { label: "Codes actifs", value: isLoading ? "…" : codes, icon: FolderTree, color: "hsl(var(--primary))" },
          { label: "Exhaustivité", value: isLoading ? "…" : `${exhaustivite}%`, icon: CheckCircle2, color: "hsl(var(--accent))" },
          { label: "Exclusivité mutuelle", value: "98%", icon: Scale, color: "hsl(var(--violet))" },
          { label: "Adhésion utilisateurs", value: "92%", icon: BookOpen, color: "hsl(var(--warning))" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number-sm">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* Principes CartoAP */}
      <div
        className="rounded-xl border p-3 flex items-start gap-3 flex-shrink-0"
        style={{ borderColor: "hsl(var(--accent) / 0.15)", background: "hsl(var(--accent) / 0.03)" }}
      >
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--accent))" }} />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold" style={{ color: "hsl(var(--accent))" }}>Principes CartoAP</span>
          {" "}— Codes <strong className="text-foreground">collectivement exhaustifs</strong> (toute prestation classable) et{" "}
          <strong className="text-foreground">mutuellement exclusifs</strong> (un seul code par prestation). Nomenclature nationale UGAP/CPV/M57 — {codes} codes pré-remplis.
        </div>
      </div>

      {/* Main layout: tree + right sidebar */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Tree */}
        <div className="flex-1 min-w-0 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 flex-shrink-0">
            <FolderTree className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <h2 className="text-sm font-semibold text-foreground">Arborescence nomenclaturale</h2>
            <div className="ml-auto relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="pl-6 pr-2 py-1 text-xs rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                Aucun résultat
              </div>
            ) : (
              filteredTree.map((node) => (
                <TreeNodeItem key={node.id} node={node} selectedId={selectedId} onSelect={setSelectedId} />
              ))
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">
          {/* Edit panel */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <Edit3 className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <h2 className="text-sm font-semibold text-foreground">Détail</h2>
            </div>
            {selected ? (
              <div className="p-3 space-y-2">
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
                {selected.description && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Description</label>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-4">{selected.description}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Type</label>
                    <div className="mt-1 text-xs bg-muted px-2 py-1.5 rounded-lg text-foreground">{selected.type}</div>
                  </div>
                  {selected.tag && (
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Tag</label>
                      <div className="mt-1 text-xs bg-muted px-2 py-1.5 rounded-lg text-foreground">{selected.tag}</div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Seuil MAPA</label>
                  <div className="mt-1 text-xs text-foreground font-semibold num">{selected.seuil_mapa.toLocaleString("fr-FR")} €</div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Seuil AO</label>
                  <div className="mt-1 text-xs text-foreground font-semibold num">{selected.seuil_ao.toLocaleString("fr-FR")} €</div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Conformité</label>
                  <div className="mt-1">
                    {selected.conforme ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--accent) / 0.1)", color: "hsl(var(--accent))" }}>
                        <CheckCircle2 className="w-3 h-3" /> Conforme
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}>
                        <AlertCircle className="w-3 h-3" /> Non conforme
                      </span>
                    )}
                  </div>
                </div>
                {selected.is_national && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg text-[11px]" style={{ background: "hsl(var(--primary) / 0.05)", border: "1px solid hsl(var(--primary) / 0.1)" }}>
                    <Shield className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                    <span style={{ color: "hsl(var(--primary))" }}>Nomenclature nationale — version {selected.version}</span>
                  </div>
                )}
                {selected.description && (
                  <div className="space-y-1.5 pt-1.5 border-t border-border">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Périmètre du code</label>
                    <div className="p-2 rounded-lg text-xs" style={{ background: "hsl(var(--accent) / 0.05)", border: "1px solid hsl(var(--accent) / 0.15)" }}>
                      <span className="font-semibold text-[10px]" style={{ color: "hsl(var(--accent))" }}>INCLUT</span>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">{selected.description}</p>
                    </div>
                  </div>
                )}
                {!selected.is_national && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => showToast("Modification enregistrée avec succès.", "success")}
                      className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-white"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      Enregistrer
                    </button>
                    <button onClick={demo} className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">Sélectionnez un élément</div>
            )}
          </div>

          {/* Versions */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <History className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <h2 className="text-sm font-semibold text-foreground">Versions</h2>
            </div>
            <div className="p-3 space-y-1">
              {versions.map((v) => (
                <div key={v.version} className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/30 text-[11px]">
                  <span className="font-mono font-semibold w-12 flex-shrink-0" style={{ color: "hsl(var(--primary))" }}>{v.version}</span>
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
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <h2 className="text-sm font-semibold text-foreground">Journal des modifications</h2>
            </div>
            <div className="p-3 space-y-1">
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
