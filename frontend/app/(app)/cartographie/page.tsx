"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import { useDemoAction } from "@/store/toast";
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
} from "lucide-react";

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
  "Travaux":      "#3B6FE8",
  "Fournitures":  "#5C93FF",
  "Services":     "#24DDB8",
  "PI/TIC":       "#1CC4A8",
};

const spendChartConfig: ChartConfig = { size: { label: "Dépense (€)", color: "#5C93FF" } };
const directionChartConfig: ChartConfig = { value: { label: "Budget (€)", color: "#5C93FF" } };

/* ── Helpers ── */
function fmtEur(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} M€`;
  return `${Math.round(v / 1_000)} k€`;
}

export default function CartographiePage() {
  const { accessToken, currentOrg } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };
  const demo = useDemoAction();

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

  /* ── Computed data ── */

  // Label lookup: code → label from nomenclature
  const labelByCode = Object.fromEntries(nodes.map(n => [n.code, n.label]));

  // Spend by famille_code (from marchés)
  const spendByFamille: Record<string, { total: number; categorie: string }> = {};
  for (const m of marches) {
    if (!m.famille_code) continue;
    if (!spendByFamille[m.famille_code]) spendByFamille[m.famille_code] = { total: 0, categorie: m.categorie };
    spendByFamille[m.famille_code].total += m.montant;
  }

  const spendData = Object.entries(spendByFamille)
    .map(([code, { total, categorie }]) => ({
      name: labelByCode[code] ?? code,
      size: total,
      category: categorie,
    }))
    .filter(d => d.size > 0)
    .sort((a, b) => b.size - a.size)
    .slice(0, 14);

  // Totals by category
  const byCategory: Record<string, number> = {};
  for (const m of marches) {
    byCategory[m.categorie] = (byCategory[m.categorie] ?? 0) + m.montant;
  }
  const totalBudget = Object.values(byCategory).reduce((a, b) => a + b, 0);

  // CATEGORY_META for legend
  const CATEGORY_META = Object.entries(byCategory).map(([label, total]) => ({
    label,
    color: CAT_COLOR[label] ?? "#8DA2B5",
    total,
  }));

  // Donut: by service
  const byService: Record<string, number> = {};
  for (const m of marches) {
    const svc = m.service || "Autre";
    byService[svc] = (byService[svc] ?? 0) + m.montant;
  }
  const dirColors = ["#3B6FE8", "#5C93FF", "#33B5D4", "#24DDB8", "#A8C4E0", "#7B9CBF"];
  const directionData = Object.entries(byService)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], i) => ({ name, value, color: dirColors[i] ?? "#8DA2B5" }));

  // Non-conformes from nomenclature (for seuils table)
  const nonConformes = nodes.filter(n => !n.conforme);
  const seuilsData = nodes
    .filter(n => !n.conforme && n.montant > 0 && n.seuil > 0)
    .sort((a, b) => b.montant / b.seuil - a.montant / a.seuil)
    .slice(0, 6)
    .map(n => ({
      code: `${n.code} — ${n.label}`,
      depense: Math.round(n.montant / 1_000),
      seuil: Math.round(n.seuil / 1_000),
      ratio: n.montant / n.seuil,
      statut: n.montant > 215_000 ? "AO requis" : n.montant > n.seuil ? "Fractionnement" : "Conforme",
    }));

  // Anomalies from non-conformes
  const anomalies = nonConformes
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 4)
    .map(n => ({
      type: n.montant > 215_000 ? "Seuil dépassé" : n.montant > n.seuil ? "Fractionnement" : "Classification",
      message: `${n.code} ${n.label} : ${fmtEur(n.montant)} — ${n.montant > 215_000 ? "procédure AO requise, publication BOAMP obligatoire" : n.montant > n.seuil ? "dépense dépasse le seuil de mise en concurrence" : "classification à vérifier"}`,
      severity: n.montant > 215_000 ? "haute" : n.montant > n.seuil ? "moyenne" : "basse",
    }));

  // Comparatif N/N-1 — N from real data, N-1 approx ×0.9 with category-specific variance
  const N1_FACTORS: Record<string, number> = { Travaux: 0.88, Fournitures: 0.97, Services: 0.92 };
  const comparatif = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([famille, n]) => {
      const factor = N1_FACTORS[famille] ?? 0.93;
      const n1 = n * factor;
      const delta = ((n - n1) / n1) * 100;
      return { famille, n, n1, delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`, up: delta >= 0 };
    });

  // Budget ecarts — by service (prevu = approx 95% of executed, realistic small variance)
  const VARIANCE: Record<string, number> = {};
  let vi = 0;
  const VARIANCES = [1.05, 0.93, 1.08, 0.97, 1.02];
  for (const svc of Object.keys(byService).slice(0, 5)) {
    VARIANCE[svc] = VARIANCES[vi++] ?? 1;
  }
  const ecartsData = directionData.map(d => ({
    direction: d.name,
    prevu: Math.round((d.value * (VARIANCE[d.name] ?? 1)) / 1000) * 1000,
    execute: d.value,
  }));
  const ECARTS_MAX = Math.max(...ecartsData.map(r => Math.max(r.prevu, r.execute))) * 1.08;

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "10px",
    fontSize: "12px",
    boxShadow: "0 4px 16px hsl(var(--foreground) / 0.1)",
    color: "hsl(var(--foreground))",
  };
  void tooltipStyle;

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
            Photographie fine de la dépense publique · {fmtEur(totalBudget)} consolidés · {spendData.length} familles homogènes
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={demo} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Importer base achats
          </button>
          <button
            onClick={demo}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
            style={{ background: MODULE.cartographie }}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Générer cartographie
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--accent))", boxShadow: "0 0 6px hsl(var(--accent))" }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
          Indicateurs de cartographie
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {[
          { label: "Familles d'achats",        value: spendData.length || "—",                            icon: Layers,       color: MODULE.cartographie },
          { label: "Codes nomenclature",        value: nodes.filter(n => n.type === "code").length || "—", icon: FolderOpen,   color: "hsl(var(--primary))" },
          { label: "Dépenses classifiées",      value: marches.filter(m => m.famille_code).length > 0 ? `${Math.round(marches.filter(m => m.famille_code).length / Math.max(marches.length, 1) * 100)}%` : "—", icon: CheckCircle2, color: "hsl(var(--accent))" },
          { label: "Non-conformités détectées", value: nonConformes.length || "—",                         icon: Scale,        color: "hsl(var(--destructive))" },
          { label: "Marchés actifs",            value: marches.filter(m => m.montant > 0).length || "—",   icon: Target,       color: "hsl(var(--warning))" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number-sm">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* ── Import zone ── */}
      <div className="rounded-xl border border-dashed border-border bg-card p-3 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Upload className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Importer vos données d&apos;achats</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Glissez-déposez vos fichiers (.xlsx, .csv) — Dépenses mandatées, bases achats, exports progiciel financier
          </p>
        </div>
        <button onClick={demo} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors flex-shrink-0">
          Parcourir
        </button>
      </div>

      {/* ── Bar chart familles + Donut service ── */}
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: MODULE.cartographie, boxShadow: `0 0 6px ${MODULE.cartographie}` }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
          Répartition de la dépense
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* Bar chart horizontal — familles */}
        <div className="lg:col-span-8 rounded-[14px] overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2.5">
              <Layers className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Familles d&apos;achats homogènes
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

          <div className="px-4 py-3" style={{ height: Math.max(240, spendData.length * 26 + 20) }}>
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
                  width={90}
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

        {/* Donut — par service */}
        <div className="lg:col-span-4 rounded-[14px] overflow-hidden flex flex-col"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Par service prescripteur
            </span>
          </div>

          <div className="relative px-4 pt-3" style={{ height: 170 }}>
            <ChartContainer config={directionChartConfig} className="h-full">
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
              <span className="text-[22px] font-bold num leading-none" style={{ color: "hsl(var(--foreground))" }}>{fmtEur(totalBudget)}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "hsl(var(--foreground) / 0.35)" }}>total</span>
            </div>
          </div>

          <div className="px-5 pb-3 pt-2 space-y-1.5 flex-1">
            {directionData.map((d) => {
              const pct = totalBudget > 0 ? ((d.value / totalBudget) * 100).toFixed(0) : "0";
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
