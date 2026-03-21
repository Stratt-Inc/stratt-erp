"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import { useToastStore } from "@/store/toast";
import { MODULE } from "@/lib/colors";
import {
  FolderTree, Plus, ChevronRight, ChevronDown, Edit3, History,
  CheckCircle2, AlertCircle, Download, GripVertical, Shield,
  BookOpen, Layers, Scale, Search, Loader2, Tag, X, Trash2,
} from "lucide-react";

/* ── API types ── */
interface ApiTag {
  id: string;
  name: string;
  color: string;
  is_system: boolean;
}
interface ApiNode {
  id: string;
  code: string;
  label: string;
  description?: string;
  type: string;
  tag: string;
  parent_id: string | null;
  seuil_mapa: number;
  seuil_ao: number;
  conforme: boolean;
  is_national: boolean;
  version: string;
  tags?: ApiTag[];
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
  const sort = (nodes: TreeNode[]): TreeNode[] =>
    nodes.sort((a, b) => a.code.localeCompare(b.code)).map((n) => ({ ...n, children: sort(n.children) }));
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

/* ── Tag chip component ── */
function TagChip({ tag, onRemove }: { tag: ApiTag; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold select-none"
      style={{ background: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

/* ── Draggable tag for palette ── */
function DraggableTag({ tag, onDragStart }: { tag: ApiTag; onDragStart: (tag: ApiTag) => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("tagId", tag.id);
        onDragStart(tag);
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <TagChip tag={tag} />
    </div>
  );
}

/* ── Tree node component ── */
function TreeNodeItem({
  node, selectedId, onSelect, onDropTag, draggingTag,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropTag: (nodeId: string, tagId: string) => void;
  draggingTag: ApiTag | null;
}) {
  const [expanded, setExpanded] = useState(node.level === 0);
  const [isOver, setIsOver] = useState(false);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer text-xs transition-colors ${
          isSelected ? "bg-primary/5 border-l-2 border-primary" : "border-l-2 border-transparent"
        } ${isOver && draggingTag ? "bg-primary/10 border-l-2 border-primary border-dashed" : ""} hover:bg-muted/40`}
        style={{ paddingLeft: `${node.level * 20 + 8}px` }}
        onClick={() => { onSelect(node.id); if (hasChildren) setExpanded(!expanded); }}
        onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          const tagId = e.dataTransfer.getData("tagId");
          if (tagId) onDropTag(node.id, tagId);
        }}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
        {hasChildren
          ? (expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />)
          : <div className="w-3" />}
        <span className="font-mono text-[10px] text-muted-foreground w-14 flex-shrink-0">{node.code}</span>
        <span className={`flex-1 truncate ${node.level === 0 ? "font-semibold text-foreground" : "text-foreground"}`}>{node.label}</span>
        {/* Tags on node */}
        {node.tags && node.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {node.tags.slice(0, 2).map((t) => (
              <span key={t.id} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} title={t.name} />
            ))}
            {node.tags.length > 2 && (
              <span className="text-[9px] text-muted-foreground">+{node.tags.length - 2}</span>
            )}
          </div>
        )}
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded flex-shrink-0">{node.type}</span>
        {node.conforme
          ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
          : <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(var(--warning))" }} />}
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <TreeNodeItem key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} onDropTag={onDropTag} draggingTag={draggingTag} />
      ))}
    </div>
  );
}

const versions = [
  { version: "v2024", date: "01/01/2024", auteur: "Stratt", note: "Nomenclature nationale — UGAP/CPV/M57, 231 codes" },
];

export default function NomenclaturePage() {
  const { accessToken, currentOrg } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draggingTag, setDraggingTag] = useState<ApiTag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();

  const { data: apiNodes = [], isLoading } = useQuery<ApiNode[]>({
    queryKey: ["nomenclature", currentOrg?.id],
    queryFn: () => api.get("/api/v1/nomenclature", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: tags = [] } = useQuery<ApiTag[]>({
    queryKey: ["nomenclature-tags", currentOrg?.id],
    queryFn: () => api.get("/api/v1/nomenclature/tags", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const addTagMutation = useMutation({
    mutationFn: ({ nodeId, tagId }: { nodeId: string; tagId: string }) =>
      api.post(`/api/v1/nomenclature/${nodeId}/tags/${tagId}`, {}, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomenclature", currentOrg?.id] });
      showToast("Tag ajouté.", "success");
    },
    onError: () => showToast("Impossible d'ajouter le tag.", "error"),
  });

  const removeTagMutation = useMutation({
    mutationFn: ({ nodeId, tagId }: { nodeId: string; tagId: string }) =>
      api.delete(`/api/v1/nomenclature/${nodeId}/tags/${tagId}`, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomenclature", currentOrg?.id] });
    },
    onError: () => showToast("Impossible de retirer le tag.", "error"),
  });

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.post("/api/v1/nomenclature/tags", data, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomenclature-tags", currentOrg?.id] });
      setNewTagName("");
      showToast("Tag créé.", "success");
    },
    onError: () => showToast("Impossible de créer le tag.", "error"),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => api.delete(`/api/v1/nomenclature/tags/${tagId}`, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nomenclature-tags", currentOrg?.id] });
      showToast("Tag supprimé.", "success");
    },
  });

  const tree = useMemo(() => buildTree(apiNodes), [apiNodes]);
  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.toLowerCase();
    const matchNode = (n: TreeNode): TreeNode | null => {
      const matches = n.label.toLowerCase().includes(q) || n.code.toLowerCase().includes(q) || (n.description ?? "").toLowerCase().includes(q);
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

  const systemTags = tags.filter((t) => t.is_system);
  const customTags = tags.filter((t) => !t.is_system);

  // Contextual tag suggestions based on selected node's category
  const suggestedTags = useMemo(() => {
    if (!selected) return systemTags.slice(0, 6);
    const cat = selected.tag; // Fournitures | Services | Travaux
    const assignedIds = new Set((selected.tags ?? []).map((t) => t.id));
    const all = tags.filter((t) => !assignedIds.has(t.id));
    // Category-specific priorities
    const priorities: Record<string, string[]> = {
      Fournitures: ["Fournitures", "MAPA", "Marché public", "Accord-cadre", "Stratégique", "Urgent"],
      Services:    ["Services",    "MAPA", "Accord-cadre", "Marché public", "Stratégique", "À réviser"],
      Travaux:     ["Travaux",     "Appel d'offres", "Marché public", "Urgent", "MAPA", "Stratégique"],
    };
    const order = priorities[cat] ?? priorities["Fournitures"];
    return [...all].sort((a, b) => {
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }).slice(0, 8);
  }, [selected, tags]);

  const PRESET_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1"];

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
            Grande famille → Famille → Code · Fournitures, Services, Travaux · Version 2024
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
            <History className="w-3.5 h-3.5" /> Historique
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Exporter
          </button>
          <button
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
          { label: "Tags système", value: systemTags.length, icon: Tag, color: "hsl(var(--violet))" },
          { label: "Tags custom", value: customTags.length, icon: Scale, color: "hsl(var(--warning))" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number-sm">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* Main layout */}
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
              <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">Aucun résultat</div>
            ) : (
              filteredTree.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onDropTag={(nodeId, tagId) => addTagMutation.mutate({ nodeId, tagId })}
                  draggingTag={draggingTag}
                />
              ))
            )}
          </div>
          {draggingTag && (
            <div className="px-4 py-2 border-t border-border bg-primary/5 text-xs text-muted-foreground flex items-center gap-2 flex-shrink-0">
              <Tag className="w-3 h-3" style={{ color: draggingTag.color }} />
              Déposez <TagChip tag={draggingTag} /> sur un nœud pour l&apos;y associer
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">

          {/* Tag palette */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <Tag className="w-4 h-4" style={{ color: MODULE.nomenclature }} />
              <h2 className="text-sm font-semibold text-foreground">Tags</h2>
              <span className="ml-auto text-[10px] text-muted-foreground">Glissez sur un nœud</span>
            </div>
            <div className="p-3 space-y-3">
              {/* Suggestions contextuelles */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
                  {selected ? `Suggestions — ${selected.tag || selected.type}` : "Tous les tags"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map((tag) => (
                    <DraggableTag key={tag.id} tag={tag} onDragStart={setDraggingTag} />
                  ))}
                </div>
              </div>
              {/* Custom tags */}
              {customTags.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">Personnalisés</p>
                  <div className="flex flex-wrap gap-1.5">
                    {customTags.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-0.5">
                        <DraggableTag tag={tag} onDragStart={setDraggingTag} />
                        <button
                          onClick={() => deleteTagMutation.mutate(tag.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Create tag */}
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Nouveau tag</p>
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nom du tag…"
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTagName.trim()) {
                      createTagMutation.mutate({ name: newTagName.trim(), color: newTagColor });
                    }
                  }}
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewTagColor(c)}
                      className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, outline: newTagColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => { if (newTagName.trim()) createTagMutation.mutate({ name: newTagName.trim(), color: newTagColor }); }}
                  disabled={!newTagName.trim()}
                  className="w-full py-1.5 text-[11px] font-semibold rounded-lg text-white disabled:opacity-40 transition-opacity"
                  style={{ background: newTagColor }}
                >
                  <Plus className="w-3 h-3 inline mr-1" />Créer le tag
                </button>
              </div>
            </div>
          </div>

          {/* Detail panel */}
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
                    key={selected.id + "-code"}
                    defaultValue={selected.code}
                    className="mt-1 w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Libellé</label>
                  <input
                    key={selected.id + "-label"}
                    defaultValue={selected.label}
                    className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {selected.description && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Périmètre</label>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-5">{selected.description}</p>
                  </div>
                )}
                {(selected.montant ?? 0) > 0 && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Montant consolidé</label>
                    <div className="mt-1 text-xs font-semibold num text-foreground">{selected.montant!.toLocaleString("fr-FR")} €</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Seuil MAPA</label>
                    <div className="mt-1 text-xs font-semibold num text-foreground">{selected.seuil_mapa.toLocaleString("fr-FR")} €</div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Seuil AO</label>
                    <div className="mt-1 text-xs font-semibold num text-foreground">{selected.seuil_ao.toLocaleString("fr-FR")} €</div>
                  </div>
                </div>
                {/* Assigned tags */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Tags assignés
                  </label>
                  {selected.tags && selected.tags.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {selected.tags.map((t) => (
                        <TagChip
                          key={t.id}
                          tag={t}
                          onRemove={() => removeTagMutation.mutate({ nodeId: selected.id, tagId: t.id })}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground">Aucun tag — glissez-en un depuis la palette</p>
                  )}
                  {/* Quick-add suggestions */}
                  {suggestedTags.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] text-muted-foreground mb-1">Ajouter rapidement :</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestedTags.slice(0, 5).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => addTagMutation.mutate({ nodeId: selected.id, tagId: t.id })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-dashed transition-opacity hover:opacity-80"
                            style={{ borderColor: t.color + "60", color: t.color }}
                          >
                            <Plus className="w-2.5 h-2.5" />{t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                    <span style={{ color: "hsl(var(--primary))" }}>Nationale — version {selected.version}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => showToast("Modification enregistrée avec succès.", "success")}
                    className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-white"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    Enregistrer
                  </button>
                  <button className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <FolderTree className="w-6 h-6 mx-auto mb-2 opacity-20" />
                Sélectionnez un nœud
              </div>
            )}
          </div>

          {/* Journal des modifications */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <h2 className="text-sm font-semibold text-foreground">Journal des modifications</h2>
            </div>
            <div className="p-3 space-y-1">
              {[
                { date: "01/01/2024 00:00", action: "Import national", utilisateur: "Stratt", detail: "Nomenclature achats V1 — 175 codes internes, 256 codes CPV F/S, 56 codes CPV Travaux" },
              ].map((j, i) => (
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
        </div>
      </div>
    </div>
  );
}
