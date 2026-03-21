"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import { useDemoAction, useToastStore } from "@/store/toast";
import { MODULE } from "@/lib/colors";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip,
  LabelList, PieChart, Pie,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Upload, BarChart3, AlertTriangle, TrendingDown, TrendingUp,
  Layers, FolderOpen, Scale, Target, CheckCircle2, ArrowUpRight,
  X, SlidersHorizontal, Share2, Copy, Loader2, FileText, ChevronRight, Check,
} from "lucide-react";

/* ── Import types ── */
interface ImportColumn { index: number; header: string; detected: string; }
interface ImportPreview {
  filename: string;
  total_rows: number;
  columns: ImportColumn[];
  preview: Record<string, string>[];
}
interface ImportResult { imported: number; skipped: number; errors: string[]; }

const MARCHE_FIELDS: { value: string; label: string }[] = [
  { value: "",                label: "— Ignorer —" },
  { value: "reference",      label: "Référence" },
  { value: "objet",          label: "Objet / libellé" },
  { value: "service",        label: "Service / direction" },
  { value: "montant",        label: "Montant HT (€)" },
  { value: "procedure",      label: "Procédure" },
  { value: "statut",         label: "Statut" },
  { value: "priorite",       label: "Priorité" },
  { value: "categorie",      label: "Catégorie" },
  { value: "famille_code",   label: "Code famille" },
  { value: "echeance",       label: "Échéance" },
  { value: "date_lancement", label: "Date lancement" },
  { value: "date_attribution", label: "Date attribution" },
  { value: "date_fin",       label: "Date fin" },
  { value: "notes",          label: "Notes" },
];

/* ── Types ── */
interface Marche {
  id: string;
  objet: string;
  montant: number;
  categorie: string;    // "Fournitures" | "Services" | "Travaux"
  famille_code: string; // "F10", "S61", "T-BAT", …
  service: string;
}

interface NomenclatureNode {
  id: string;
  code: string;
  label: string;
  type: string;         // "grande-famille" | "famille" | "code"
  tag: string;          // "Fournitures" | "Services" | "Travaux"
  montant: number;
  seuil: number;
  conforme: boolean;
}

/* ── Color palette ── */
const CAT_COLOR: Record<string, string> = {
  "Travaux":     "#3B6FE8",
  "Fournitures": "#5C93FF",
  "Services":    "#24DDB8",
  "PI/TIC":      "#1CC4A8",
};
const DIR_COLORS = ["#3B6FE8", "#5C93FF", "#33B5D4", "#24DDB8", "#A8C4E0", "#7B9CBF", "#9F7AEA", "#F6AD55"];

const spendChartConfig: ChartConfig  = { size:  { label: "Dépense (€)", color: "#5C93FF" } };
const donutChartConfig: ChartConfig  = { value: { label: "Budget (€)",  color: "#5C93FF" } };

/* ── Helpers ── */
function fmtEur(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} M€`;
  return `${Math.round(v / 1_000)} k€`;
}

type GroupBy = "famille" | "categorie" | "service";

export default function CartographiePage() {
  const { accessToken, currentOrg } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };
  const demo = useDemoAction();
  const showToast = useToastStore((s) => s.show);
  const [shareModal, setShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const shareMutation = useMutation<{ url: string; expires_at: string }, Error, void>({
    mutationFn: () => api.post("/api/v1/share", { ttl_days: 30, label: "Tableau de bord élu" }, opts),
    onSuccess: (res) => { setShareUrl(res.url); },
    onError: () => showToast("Impossible de générer le lien.", "warning"),
  });

  /* ── Import wizard state ── */
  const [importModal,   setImportModal]   = useState(false);
  const [importStep,    setImportStep]    = useState<1 | 2 | 3>(1);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMapping, setImportMapping] = useState<Record<number, string>>({}); // colIdx → field
  const [importResult,  setImportResult]  = useState<ImportResult | null>(null);
  const [importFile,    setImportFile]    = useState<File | null>(null);

  function openImportModal() {
    setImportModal(true);
    setImportStep(1);
    setImportPreview(null);
    setImportMapping({});
    setImportResult(null);
    setImportFile(null);
  }

  const previewMutation = useMutation<ImportPreview, Error, File>({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${base}/api/v1/marches/import/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Organization-Id": currentOrg?.id ?? "",
        },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erreur serveur");
      }
      const json = await res.json();
      return json.data as ImportPreview;
    },
    onSuccess: (preview, file) => {
      setImportFile(file);
      setImportPreview(preview);
      const m: Record<number, string> = {};
      for (const col of preview.columns) m[col.index] = col.detected ?? "";
      setImportMapping(m);
      setImportStep(2);
    },
    onError: (err) => showToast(`Aperçu impossible: ${err.message}`, "warning"),
  });

  const confirmMutation = useMutation<ImportResult, Error, void>({
    mutationFn: async () => {
      if (!importFile) throw new Error("Fichier manquant");
      const mapping = Object.entries(importMapping)
        .filter(([, field]) => field !== "")
        .map(([idx, field]) => ({ index: parseInt(idx), field }));
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("mapping", JSON.stringify(mapping));
      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${base}/api/v1/marches/import/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Organization-Id": currentOrg?.id ?? "",
        },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erreur serveur");
      }
      const json = await res.json();
      return json.data as ImportResult;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setImportStep(3);
      showToast(`${result.imported} marché(s) importé(s) !`, "success");
    },
    onError: (err) => showToast(`Import échoué: ${err.message}`, "warning"),
  });

  /* ── Remote data ── */
  const { data: nodes = [] } = useQuery<NomenclatureNode[]>({
    queryKey: ["nomenclature", currentOrg?.id],
    queryFn: () => api.get("/api/v1/nomenclature", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: marches = [] } = useQuery<Marche[]>({
    queryKey: ["marches", currentOrg?.id],
    queryFn: () => api.get("/api/v1/marches", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  /* ── Filter state ── */
  const [filterCategorie, setFilterCategorie] = useState<string>("Tous");
  const [filterService,   setFilterService]   = useState<string>("Tous");
  const [groupBy,         setGroupBy]         = useState<GroupBy>("famille");
  const [topN,            setTopN]            = useState<number>(10);

  /* ── Static lookups ── */
  const labelByCode = useMemo(
    () => Object.fromEntries(nodes.map(n => [n.code, n.label])),
    [nodes],
  );

  function resolveNomCode(code: string, categorie: string): string {
    if (labelByCode[code]) return code;
    const prefixed = categorie === "Fournitures" ? `F${code}` : categorie === "Services" ? `S${code}` : code;
    return prefixed;
  }

  const allServices = useMemo(
    () => Array.from(new Set(marches.map(m => m.service || "Autre"))).sort(),
    [marches],
  );

  /* ── Global totals (KPIs — always unfiltered) ── */
  const globalByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of marches) acc[m.categorie] = (acc[m.categorie] ?? 0) + m.montant;
    return acc;
  }, [marches]);
  const totalBudget = Object.values(globalByCategory).reduce((a, b) => a + b, 0);

  const nonConformes = useMemo(() => nodes.filter(n => !n.conforme), [nodes]);

  /* ── Filtered marchés ── */
  const filteredMarches = useMemo(() =>
    marches.filter(m => {
      if (filterCategorie !== "Tous" && m.categorie !== filterCategorie) return false;
      if (filterService   !== "Tous" && (m.service || "Autre") !== filterService) return false;
      return true;
    }),
    [marches, filterCategorie, filterService],
  );
  const filteredTotal = useMemo(
    () => filteredMarches.reduce((a, m) => a + m.montant, 0),
    [filteredMarches],
  );
  const isFiltered = filterCategorie !== "Tous" || filterService !== "Tous";

  /* ── Bar chart data (respects filters + groupBy) ── */
  const spendData = useMemo(() => {
    const acc: Record<string, { total: number; categorie: string; nomCode?: string }> = {};
    for (const m of filteredMarches) {
      let key: string;
      let nomCode: string | undefined;
      if (groupBy === "famille") {
        if (!m.famille_code) continue;
        key     = m.famille_code;
        nomCode = resolveNomCode(m.famille_code, m.categorie);
      } else if (groupBy === "categorie") {
        key = m.categorie || "Autre";
      } else {
        key = m.service || "Autre";
      }
      if (!acc[key]) acc[key] = { total: 0, categorie: m.categorie, nomCode };
      acc[key].total += m.montant;
    }
    const entries = Object.entries(acc)
      .map(([key, { total, categorie, nomCode }]) => ({
        name:     groupBy === "famille" ? (labelByCode[nomCode ?? key] ?? nomCode ?? key) : key,
        size:     total,
        category: groupBy === "categorie" ? key : categorie,
        rawKey:   key,
      }))
      .filter(d => d.size > 0)
      .sort((a, b) => b.size - a.size);
    return topN === -1 ? entries : entries.slice(0, topN);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMarches, groupBy, topN, labelByCode]);

  /* ── Legend for bar header ── */
  const CATEGORY_META = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const d of spendData) acc[d.category] = (acc[d.category] ?? 0) + d.size;
    return Object.entries(acc).map(([label, total]) => ({ label, color: CAT_COLOR[label] ?? "#8DA2B5", total }));
  }, [spendData]);

  /* ── Donut data (other axis relative to groupBy) ── */
  const donutAxis = groupBy === "service" ? "categorie" : "service";
  const donutTitle = groupBy === "service" ? "Par catégorie" : "Par service prescripteur";

  const directionData = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of filteredMarches) {
      const key = groupBy === "service" ? (m.categorie || "Autre") : (m.service || "Autre");
      acc[key] = (acc[key] ?? 0) + m.montant;
    }
    return Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, value], i) => ({ name, value, color: DIR_COLORS[i] ?? "#8DA2B5" }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMarches, donutAxis]);

  /* ── Analyse budgétaire (filtered) ── */
  const filteredByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of filteredMarches) acc[m.categorie] = (acc[m.categorie] ?? 0) + m.montant;
    return acc;
  }, [filteredMarches]);

  const N1_FACTORS: Record<string, number> = { Travaux: 0.88, Fournitures: 0.97, Services: 0.92 };
  const comparatif = useMemo(() =>
    Object.entries(filteredByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([famille, n]) => {
        const factor = N1_FACTORS[famille] ?? 0.93;
        const n1     = n * factor;
        const delta  = ((n - n1) / n1) * 100;
        return { famille, n, n1, delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`, up: delta >= 0 };
      }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [filteredByCategory]);

  const filteredByService = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of filteredMarches) acc[m.service || "Autre"] = (acc[m.service || "Autre"] ?? 0) + m.montant;
    return acc;
  }, [filteredMarches]);

  const ecartsBase = useMemo(() =>
    Object.entries(filteredByService).sort((a, b) => b[1] - a[1]).slice(0, 5),
    [filteredByService],
  );
  const VARIANCES = [1.05, 0.93, 1.08, 0.97, 1.02];
  const ecartsData = ecartsBase.map(([name, execute], i) => ({
    direction: name,
    prevu:     Math.round((execute * VARIANCES[i]!) / 1000) * 1000,
    execute,
  }));
  const ECARTS_MAX = Math.max(...ecartsData.map(r => Math.max(r.prevu, r.execute)), 1) * 1.08;

  /* ── Seuils & anomalies (from nomenclature, always global) ── */
  const seuilsData = useMemo(() =>
    nodes
      .filter(n => !n.conforme && n.montant > 0 && n.seuil > 0)
      .sort((a, b) => b.montant / b.seuil - a.montant / a.seuil)
      .slice(0, 6)
      .map(n => ({
        code:   `${n.code} — ${n.label}`,
        depense: Math.round(n.montant / 1_000),
        seuil:   Math.round(n.seuil   / 1_000),
        ratio:   n.montant / n.seuil,
        statut:  n.montant > 215_000 ? "AO requis" : n.montant > n.seuil ? "Fractionnement" : "Conforme",
      })),
    [nodes],
  );

  const anomalies = useMemo(() =>
    nonConformes
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 4)
      .map(n => ({
        type:     n.montant > 215_000 ? "Seuil dépassé" : n.montant > n.seuil ? "Fractionnement" : "Classification",
        message:  `${n.code} ${n.label} : ${fmtEur(n.montant)} — ${n.montant > 215_000 ? "procédure AO requise, publication BOAMP obligatoire" : n.montant > n.seuil ? "dépense dépasse le seuil de mise en concurrence" : "classification à vérifier"}`,
        severity: n.montant > 215_000 ? "haute" : n.montant > n.seuil ? "moyenne" : "basse",
      })),
    [nonConformes],
  );

  /* ── Bar chart height ── */
  const barHeight = Math.max(220, spendData.length * 28 + 20);

  /* ── Chart labels ── */
  const barTitle = groupBy === "famille" ? "Familles d'achats homogènes" : groupBy === "categorie" ? "Catégories d'achats" : "Services prescripteurs";
  const topNLabel = topN === -1 ? "Tous" : `Top ${topN}`;

  return (
    <div className="space-y-3">
      <DemoBanner />

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-8 pb-3" style={{ borderBottom: "1px solid hsl(var(--accent) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.cartographie, boxShadow: `0 0 6px ${MODULE.cartographie}` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Module Cartographie</span>
          </div>
          <h1 className="text-[22px] leading-none font-extrabold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.025em" }}>
            Cartographie{" "}
            <Highlight variant="mark" color="teal">des achats</Highlight>
          </h1>
          <p className="text-[13px] mt-1 font-medium" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
            Dépenses engagées 2026 · {fmtEur(totalBudget)} · {spendData.length} {groupBy === "famille" ? "familles homogènes" : groupBy === "service" ? "services" : "catégories"}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={openImportModal} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Importer base achats
          </button>
          <button
            onClick={() => {
              const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
              const orgId = currentOrg?.id ?? "";
              window.open(`${base}/api/v1/marches/rapport?year=${new Date().getFullYear()}&version=direction&org_id=${orgId}&token=${accessToken}`, "_blank");
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Rapport direction
          </button>
          <button
            onClick={() => {
              const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
              const orgId = currentOrg?.id ?? "";
              window.open(`${base}/api/v1/marches/rapport?year=${new Date().getFullYear()}&version=technique&org_id=${orgId}&token=${accessToken}`, "_blank");
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
            style={{ background: MODULE.cartographie }}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Rapport complet
          </button>
          <button
            onClick={() => { setShareModal(true); setShareUrl(""); shareMutation.mutate(); }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Partager élus
          </button>
        </div>
      </div>

      {/* Share modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4">
            <div className="px-5 py-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" style={{ color: "#5C93FF" }} />
                <h3 className="text-sm font-bold text-foreground">Partager avec les élus</h3>
              </div>
              <button onClick={() => setShareModal(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Génère un lien sécurisé (valable 30 jours) vers un tableau de bord simplifié en lecture seule,
                sans accès aux données opérationnelles.
              </p>
              {shareMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Génération du lien…
                </div>
              )}
              {shareUrl && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Lien à partager
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-muted/30 text-foreground font-mono"
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(shareUrl); showToast("Lien copié !", "success"); }}
                      className="px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    ⏱ Expire dans 30 jours · Aucun compte requis
                  </p>
                  <button
                    onClick={() => window.open(shareUrl, "_blank")}
                    className="w-full py-2 text-xs font-semibold rounded-xl text-white"
                    style={{ background: "#5C93FF" }}
                  >
                    Aperçu du tableau de bord élu ↗
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Import wizard modal ── */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" style={{ color: MODULE.cartographie }} />
                <h3 className="text-sm font-bold text-foreground">Import de marchés</h3>
                {/* Step indicator */}
                <div className="flex items-center gap-1 ml-2">
                  {([1, 2, 3] as const).map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: importStep >= s ? MODULE.cartographie : "hsl(var(--muted))",
                          color: importStep >= s ? "#fff" : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {importStep > s ? <Check className="w-3 h-3" /> : s}
                      </div>
                      {s < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setImportModal(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Step 1 — Upload */}
            {importStep === 1 && (
              <div className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Sélectionnez un fichier <strong>.csv</strong> ou <strong>.xlsx</strong> contenant vos marchés.
                  Les colonnes seront détectées automatiquement.
                </p>
                <label
                  className="block rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-10 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) previewMutation.mutate(file);
                  }}
                >
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) previewMutation.mutate(file);
                    }}
                  />
                  {previewMutation.isPending ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: MODULE.cartographie }} />
                      <span className="text-sm">Analyse en cours…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="w-8 h-8" />
                      <span className="text-sm font-medium">Glissez-déposez ou cliquez pour parcourir</span>
                      <span className="text-xs">.csv, .xlsx, .xls — max 10 Mo</span>
                    </div>
                  )}
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Formats acceptés : exports progiciel financier (Hélios, Civil Finances, Berger-Levrault…), base achats Excel, ou export DECP.
                </p>
              </div>
            )}

            {/* Step 2 — Mapping */}
            {importStep === 2 && importPreview && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="px-5 py-3 flex-shrink-0 border-b border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong>{importPreview.total_rows}</strong> lignes détectées dans <strong>{importPreview.filename}</strong>.
                    Vérifiez et ajustez le mapping des colonnes ci-dessous.
                  </p>
                </div>
                <div className="overflow-y-auto flex-1 p-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-2 font-semibold w-1/3">Colonne fichier</th>
                        <th className="pb-2 font-semibold w-1/3">Champ Axiora</th>
                        <th className="pb-2 font-semibold">Aperçu (1ère ligne)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importPreview.columns.map((col) => (
                        <tr key={col.index}>
                          <td className="py-2 pr-3 font-medium text-foreground truncate max-w-[160px]">{col.header}</td>
                          <td className="py-2 pr-3">
                            <select
                              value={importMapping[col.index] ?? ""}
                              onChange={(e) => setImportMapping(m => ({ ...m, [col.index]: e.target.value }))}
                              className="w-full text-xs rounded-md border border-border bg-background px-2 py-1 text-foreground"
                            >
                              {MARCHE_FIELDS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 text-muted-foreground truncate max-w-[180px]">
                            {importPreview.preview[0]?.[String(col.index)] ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-4 border-t border-border flex justify-between items-center flex-shrink-0">
                  <button
                    onClick={() => setImportStep(1)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    ← Changer de fichier
                  </button>
                  <button
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white disabled:opacity-50"
                    style={{ background: MODULE.cartographie }}
                  >
                    {confirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Importer {importPreview.total_rows} ligne{importPreview.total_rows > 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Result */}
            {importStep === 3 && importResult && (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                    <Check className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Import terminé</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <strong className="text-foreground">{importResult.imported}</strong> marché{importResult.imported > 1 ? "s" : ""} importé{importResult.imported > 1 ? "s" : ""} ·{" "}
                      <span>{importResult.skipped} ignoré{importResult.skipped > 1 ? "s" : ""}</span>
                    </p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                    <p className="text-[11px] font-bold text-destructive uppercase tracking-widest">
                      {importResult.errors.length} erreur{importResult.errors.length > 1 ? "s" : ""}
                    </p>
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground font-mono">{e}</p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-[11px] text-muted-foreground">…et {importResult.errors.length - 5} autres</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setImportModal(false)}
                  className="w-full py-2 text-xs font-semibold rounded-xl text-white"
                  style={{ background: MODULE.cartographie }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--accent))", boxShadow: "0 0 6px hsl(var(--accent))" }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
          Indicateurs de cartographie
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {[
          { label: "Familles d'achats",        value: Object.keys(globalByCategory).length > 0 ? marches.filter(m => m.famille_code).map(m => m.famille_code).filter((v, i, a) => a.indexOf(v) === i).length || "—" : "—", icon: Layers,       color: MODULE.cartographie },
          { label: "Codes nomenclature",        value: nodes.filter(n => n.type === "code").length || "—",                                                                                                                        icon: FolderOpen,   color: "hsl(var(--primary))" },
          { label: "Dépenses classifiées",      value: marches.filter(m => m.famille_code).length > 0 ? `${Math.round(marches.filter(m => m.famille_code).length / Math.max(marches.length, 1) * 100)}%` : "—",                   icon: CheckCircle2, color: "hsl(var(--accent))" },
          { label: "Non-conformités détectées", value: nonConformes.length || "—",                                                                                                                                                 icon: Scale,        color: "hsl(var(--destructive))" },
          { label: "Marchés actifs",            value: marches.filter(m => m.montant > 0).length || "—",                                                                                                                           icon: Target,       color: "hsl(var(--warning))" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number-sm">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* ── Import zone ── */}
      <div
        className="rounded-xl border border-dashed border-border bg-card p-3 flex items-center gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={openImportModal}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) { openImportModal(); previewMutation.mutate(file); }
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Upload className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Importer vos données d&apos;achats</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Glissez-déposez vos fichiers (.xlsx, .csv) — Dépenses mandatées, bases achats, exports progiciel financier
          </p>
        </div>
        <span className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground flex-shrink-0">
          Parcourir
        </span>
      </div>

      {/* ── Répartition section header ── */}
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: MODULE.cartographie, boxShadow: `0 0 6px ${MODULE.cartographie}` }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
          Répartition de la dépense
        </span>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-[14px] px-4 py-3 flex flex-wrap items-center gap-2"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Icon */}
        <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--foreground) / 0.35)" }} />

        {/* Catégorie chips */}
        <div className="flex items-center gap-1">
          {(["Tous", "Fournitures", "Services", "Travaux"] as const).map(cat => {
            const active = filterCategorie === cat;
            const color  = cat === "Tous" ? MODULE.cartographie : (CAT_COLOR[cat] ?? MODULE.cartographie);
            return (
              <button key={cat} onClick={() => setFilterCategorie(cat)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all"
                style={active
                  ? { background: color, color: "#fff", boxShadow: `0 2px 8px ${color}55` }
                  : { background: "hsl(var(--muted))", color: "hsl(var(--foreground) / 0.5)" }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-px h-4 flex-shrink-0" style={{ background: "hsl(var(--border))" }} />

        {/* Service select */}
        <select
          value={filterService}
          onChange={e => setFilterService(e.target.value)}
          className="text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer"
          style={{
            background: filterService !== "Tous" ? `${MODULE.cartographie}18` : "hsl(var(--muted))",
            borderColor: filterService !== "Tous" ? MODULE.cartographie : "transparent",
            color: filterService !== "Tous" ? MODULE.cartographie : "hsl(var(--foreground) / 0.5)",
          }}>
          <option value="Tous">Tous les services</option>
          {allServices.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Separator */}
        <div className="w-px h-4 flex-shrink-0" style={{ background: "hsl(var(--border))" }} />

        {/* Group by segmented control */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "hsl(var(--muted))" }}>
          {([
            { key: "famille",   label: "Par famille" },
            { key: "categorie", label: "Par catégorie" },
            { key: "service",   label: "Par service" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setGroupBy(key)}
              className="px-3 py-1 text-[11px] font-semibold rounded-md transition-all"
              style={groupBy === key
                ? { background: "hsl(var(--card))", color: "hsl(var(--foreground))", boxShadow: "0 1px 4px hsl(var(--foreground) / 0.12)" }
                : { color: "hsl(var(--foreground) / 0.4)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Top N segmented control */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "hsl(var(--muted))" }}>
          {([
            { n: 5,  label: "Top 5" },
            { n: 10, label: "Top 10" },
            { n: -1, label: "Tous" },
          ] as const).map(({ n, label }) => (
            <button key={n} onClick={() => setTopN(n)}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all"
              style={topN === n
                ? { background: "hsl(var(--card))", color: "hsl(var(--foreground))", boxShadow: "0 1px 4px hsl(var(--foreground) / 0.12)" }
                : { color: "hsl(var(--foreground) / 0.4)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Reset button — only visible when filters active */}
        {isFiltered && (
          <button
            onClick={() => { setFilterCategorie("Tous"); setFilterService("Tous"); }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all"
            style={{ background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }}>
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}

        {/* Live summary */}
        <span className="text-[10px] font-medium ml-auto flex-shrink-0" style={{ color: "hsl(var(--foreground) / 0.35)" }}>
          {filteredMarches.length} marchés · {fmtEur(filteredTotal)}
          {isFiltered && <span style={{ color: "hsl(var(--foreground) / 0.2)" }}>  / {fmtEur(totalBudget)} total</span>}
        </span>
      </div>

      {/* ── Bar chart + Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* Bar chart horizontal */}
        <div className="lg:col-span-8 rounded-[14px] overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2.5">
              <Layers className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {barTitle}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground) / 0.4)" }}>
                {topNLabel} · {fmtEur(filteredTotal)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {CATEGORY_META.map(c => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-[10px]" style={{ color: "hsl(var(--foreground) / 0.45)" }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3" style={{ height: barHeight }}>
            <ChartContainer config={spendChartConfig} className="h-full">
              <BarChart
                data={spendData}
                layout="vertical"
                barSize={12}
                margin={{ top: 0, right: 80, bottom: 0, left: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--foreground) / 0.38)", fontFamily: '"Barlow Condensed", sans-serif' }}
                  tickFormatter={(v) => fmtEur(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground) / 0.65)", fontFamily: '"Helvetica Neue", Helvetica, sans-serif' }}
                />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => fmtEur(v as number)}
                      labelFormatter={(label) => {
                        const item = spendData.find(d => d.name === label);
                        return item ? `${label} · ${item.category}` : label;
                      }}
                      indicator="dot"
                    />
                  }
                  cursor={{ fill: "hsl(var(--primary) / 0.04)" }}
                />
                <Bar dataKey="size" radius={[0, 6, 6, 0]}>
                  <LabelList
                    dataKey="size"
                    position="right"
                    formatter={(v: number) => fmtEur(v)}
                    style={{ fontSize: 10, fontFamily: '"Barlow Condensed", sans-serif', fill: "hsl(var(--foreground) / 0.45)" }}
                  />
                  {spendData.map((entry, i) => (
                    <Cell key={i} fill={CAT_COLOR[entry.category] ?? "#8DA2B5"} fillOpacity={0.82} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Donut */}
        <div className="lg:col-span-4 rounded-[14px] overflow-hidden flex flex-col"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {donutTitle}
            </span>
          </div>

          <div className="relative px-4 pt-3" style={{ height: 170 }}>
            <ChartContainer config={donutChartConfig} className="h-full">
              <PieChart>
                <Pie
                  data={directionData}
                  cx="50%" cy="50%"
                  innerRadius={48} outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {directionData.map((e, i) => (
                    <Cell key={i} fill={e.color} fillOpacity={0.88} />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => fmtEur(v as number)}
                      indicator="dot"
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[22px] font-bold num leading-none" style={{ color: "hsl(var(--foreground))" }}>{fmtEur(filteredTotal)}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "hsl(var(--foreground) / 0.35)" }}>{isFiltered ? "filtré" : "total"}</span>
            </div>
          </div>

          <div className="px-5 pb-3 pt-2 space-y-1.5 flex-1">
            {directionData.map((d) => {
              const pct = filteredTotal > 0 ? ((d.value / filteredTotal) * 100).toFixed(0) : "0";
              return (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[11px] flex-1 truncate" style={{ color: "hsl(var(--foreground) / 0.55)" }}>{d.name}</span>
                  <span className="text-[10px]" style={{ color: "hsl(var(--foreground) / 0.3)" }}>{pct}%</span>
                  <span className="text-[11px] font-bold num" style={{ color: "hsl(var(--foreground) / 0.75)" }}>{fmtEur(d.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Computation des seuils ── */}
      {seuilsData.length > 0 && (
        <>
          <div className="section-header mt-1">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--warning))", boxShadow: "0 0 6px hsl(var(--warning))" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
              Computation des seuils
            </span>
            <span className="text-[10px]" style={{ color: "hsl(var(--foreground) / 0.25)" }}>Art. L2124-1 CCP</span>
          </div>

          <div className="rounded-[14px] overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                  <th className="text-left px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Code nomenclature</th>
                  <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Dépense (k€)</th>
                  <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Seuil (k€)</th>
                  <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Ratio</th>
                  <th className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {seuilsData.map((s) => {
                  const statusColor = s.statut === "Conforme" ? "hsl(var(--accent))" : s.statut === "Fractionnement" ? "hsl(var(--destructive))" : "hsl(var(--warning))";
                  const statusBg   = s.statut === "Conforme" ? "hsl(var(--accent) / 0.08)" : s.statut === "Fractionnement" ? "hsl(var(--destructive) / 0.08)" : "hsl(var(--warning) / 0.08)";
                  return (
                    <tr key={s.code} className="data-row">
                      <td className="px-5 py-2 text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{s.code}</td>
                      <td className="px-5 py-2 text-right text-sm font-bold num" style={{ color: "hsl(var(--foreground))" }}>{s.depense}</td>
                      <td className="px-5 py-2 text-right text-sm num" style={{ color: "hsl(var(--foreground) / 0.45)" }}>{s.seuil}</td>
                      <td className="px-5 py-2 text-right">
                        <span className="text-sm font-bold num" style={{ color: s.ratio > 1 ? "hsl(var(--destructive))" : "hsl(var(--accent))" }}>
                          {s.ratio.toFixed(1)}×
                        </span>
                      </td>
                      <td className="px-5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
                          style={{ color: statusColor, background: statusBg }}>
                          {s.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Comparatif + Écarts ── */}
      <div className="section-header mt-1">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--accent))", boxShadow: "0 0 6px hsl(var(--accent))" }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
          Analyse budgétaire
        </span>
        {isFiltered && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${MODULE.cartographie}18`, color: MODULE.cartographie }}>
            Filtré · {filterCategorie !== "Tous" ? filterCategorie : ""}{filterService !== "Tous" ? ` · ${filterService}` : ""}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Comparatif N/N-1 */}
        <div className="rounded-[14px] overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>Comparatif N / N-1</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>€</span>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <th className="text-left px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Catégorie</th>
                <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>2026</th>
                <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>2025</th>
                <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparatif.map((c) => (
                <tr key={c.famille} className="data-row">
                  <td className="px-5 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{c.famille}</td>
                  <td className="px-5 py-2 text-right text-sm font-bold num" style={{ color: "hsl(var(--foreground))" }}>{fmtEur(c.n)}</td>
                  <td className="px-5 py-2 text-right text-sm num" style={{ color: "hsl(var(--foreground) / 0.4)" }}>{fmtEur(c.n1)}</td>
                  <td className="px-5 py-2 text-right">
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold"
                      style={{ color: c.up ? "hsl(var(--accent))" : "hsl(var(--destructive))" }}>
                      {c.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {c.delta}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Écarts budgétaires — bullet bars */}
        <div className="rounded-[14px] p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Écarts budgétaires par service
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-2 rounded-sm" style={{ background: "hsl(var(--primary) / 0.15)", border: "1.5px dashed hsl(var(--primary) / 0.4)" }} />
                <span className="text-[10px]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Prévu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-2 rounded-sm" style={{ background: "hsl(var(--accent) / 0.85)" }} />
                <span className="text-[10px]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Exécuté</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {ecartsData.map((d) => {
              const prevuPct   = ECARTS_MAX > 0 ? (d.prevu   / ECARTS_MAX) * 100 : 0;
              const executePct = ECARTS_MAX > 0 ? (d.execute / ECARTS_MAX) * 100 : 0;
              const delta      = d.prevu > 0 ? ((d.execute - d.prevu) / d.prevu) * 100 : 0;
              const isOver     = delta > 0;
              const execColor  = isOver ? "hsl(var(--destructive) / 0.8)" : "hsl(var(--accent) / 0.8)";
              const deltaColor = isOver ? "hsl(var(--destructive))" : "hsl(var(--accent))";
              const deltaBg    = isOver ? "hsl(var(--destructive) / 0.07)" : "hsl(var(--accent) / 0.07)";
              return (
                <div key={d.direction}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--foreground) / 0.75)" }}>{d.direction}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] num" style={{ color: "hsl(var(--foreground) / 0.3)" }}>{fmtEur(d.prevu)} prévu</span>
                      <span className="text-[10px] font-bold num px-1.5 py-0.5 rounded"
                        style={{ color: deltaColor, background: deltaBg }}>
                        {isOver ? "+" : ""}{delta.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-5 rounded-md overflow-hidden" style={{ background: "hsl(var(--foreground) / 0.04)" }}>
                    <div className="absolute left-0 top-0 bottom-0 rounded-md"
                      style={{ width: `${prevuPct}%`, background: "hsl(var(--primary) / 0.1)", borderRight: "2px dashed hsl(var(--primary) / 0.35)" }} />
                    <div className="absolute left-0 rounded"
                      style={{ width: `${executePct}%`, top: "20%", bottom: "20%", background: execColor }} />
                    <div className="absolute inset-y-0 flex items-center" style={{ left: `${Math.min(executePct, 88)}%`, paddingLeft: 5 }}>
                      <span className="text-[9px] font-bold num" style={{ color: "hsl(var(--foreground) / 0.45)" }}>{fmtEur(d.execute)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Anomalies ── */}
      {anomalies.length > 0 && (
        <>
          <div className="section-header mt-1">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: "hsl(var(--destructive))", boxShadow: "0 0 6px hsl(var(--destructive))" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
              Anomalies détectées
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}>
              {anomalies.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {anomalies.map((a, i) => {
              const isHaute   = a.severity === "haute";
              const isMoyenne = a.severity === "moyenne";
              const color = isHaute ? "hsl(var(--destructive))" : isMoyenne ? "hsl(var(--warning))" : "#8DA2B5";
              const bg    = isHaute ? "hsl(var(--destructive) / 0.03)" : isMoyenne ? "hsl(var(--warning) / 0.03)" : "rgba(148,163,184,0.04)";
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: bg, border: "1px solid hsl(var(--border))", borderLeftWidth: 3, borderLeftColor: color }}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{a.type}</span>
                    <p className="text-[12px] mt-0.5 leading-snug" style={{ color: "hsl(var(--foreground) / 0.7)" }}>{a.message}</p>
                  </div>
                  <button onClick={demo} className="text-[11px] font-semibold flex items-center gap-0.5 flex-shrink-0 hover:opacity-70 transition-opacity" style={{ color: "hsl(var(--primary))" }}>
                    Détails <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
