"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import { useDemoAction } from "@/store/toast";
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

/* ── Données ── */
const spendData = [
  { name: "Bâtiment",    size: 15.0, category: "Travaux"      },
  { name: "Conseil",     size: 8.0,  category: "Services"     },
  { name: "Logiciels",   size: 8.0,  category: "PI/TIC"       },
  { name: "Voirie",      size: 8.5,  category: "Travaux"      },
  { name: "Informatique",size: 7.2,  category: "Fournitures"  },
  { name: "Nettoyage",   size: 6.0,  category: "Services"     },
  { name: "Réseaux",     size: 5.0,  category: "Travaux"      },
  { name: "Formation",   size: 4.8,  category: "Services"     },
  { name: "Télécom",     size: 4.2,  category: "PI/TIC"       },
  { name: "Bureau",      size: 4.5,  category: "Fournitures"  },
  { name: "Maintenance", size: 4.0,  category: "Services"     },
  { name: "Mobilier",    size: 3.5,  category: "Fournitures"  },
  { name: "Hébergement", size: 2.5,  category: "PI/TIC"       },
  { name: "Scolaire",    size: 3.0,  category: "Fournitures"  },
].sort((a, b) => b.size - a.size);

// Sequential blue→teal palette for spend charts
const CAT_COLOR: Record<string, string> = {
  "Travaux":     "#3B6FE8",
  "Fournitures": "#5C93FF",
  "Services":    "#24DDB8",
  "PI/TIC":      "#1CC4A8",
};

const spendChartConfig: ChartConfig = {
  size: { label: "Dépense (M€)", color: "#5C93FF" },
};

const CATEGORY_META = [
  { label: "Travaux",     color: "#3B6FE8", total: 28.5 },
  { label: "Fournitures", color: "#5C93FF", total: 18.2 },
  { label: "Services",    color: "#24DDB8", total: 22.8 },
  { label: "PI/TIC",      color: "#1CC4A8", total: 14.7 },
];

const directionData = [
  { name: "Infrastructures", value: 28.5, color: "#3B6FE8" },
  { name: "Éducation",       value: 18.2, color: "#5C93FF" },
  { name: "Numérique",       value: 14.7, color: "#33B5D4" },
  { name: "Services",        value: 12.3, color: "#24DDB8" },
  { name: "Autres",          value: 10.5, color: "#A8C4E0" },
];

const directionChartConfig: ChartConfig = {
  value: { label: "Budget (M€)", color: "#5C93FF" },
};

const comparatif = [
  { famille: "Travaux",     n: 28.5, n1: 26.2, delta: "+8.8%",  up: true  },
  { famille: "Fournitures", n: 18.2, n1: 19.8, delta: "-8.1%",  up: false },
  { famille: "Services",    n: 22.8, n1: 21.1, delta: "+8.1%",  up: true  },
  { famille: "PI / TIC",    n: 14.7, n1: 12.4, delta: "+18.5%", up: true  },
];

const seuilsData = [
  { code: "02.01 — Informatique",  depense: 380,  seuil: 90,  ratio: 4.2,  statut: "Fractionnement" },
  { code: "03.02 — Nettoyage",     depense: 245,  seuil: 90,  ratio: 2.7,  statut: "Fractionnement" },
  { code: "01.01 — Bâtiment neuf", depense: 1200, seuil: 215, ratio: 5.6,  statut: "AO requis"      },
  { code: "04.01 — Logiciels",     depense: 520,  seuil: 215, ratio: 2.4,  statut: "AO requis"      },
  { code: "02.04 — Scolaire",      depense: 85,   seuil: 90,  ratio: 0.94, statut: "Conforme"       },
];

const ecartsData = [
  { direction: "Infrastructures", prevu: 30.0, execute: 28.5 },
  { direction: "Éducation",       prevu: 17.0, execute: 18.2 },
  { direction: "Numérique",       prevu: 13.5, execute: 14.7 },
  { direction: "Services",        prevu: 12.0, execute: 12.3 },
  { direction: "RH",              prevu: 6.0,  execute: 5.8  },
];

const ECARTS_MAX = Math.max(...ecartsData.map(r => Math.max(r.prevu, r.execute))) * 1.08;

const anomalies = [
  { type: "Fractionnement", message: "02.01 Fournitures informatiques : 12 MAPA < 40k€ totalisent 380k€ — seuil de publicité dépassé", severity: "haute" },
  { type: "Concentration",  message: "85% du budget « Conseil » attribué à 2 fournisseurs — défaut de mise en concurrence", severity: "moyenne" },
  { type: "Classification", message: "23 dépenses mandatées non rattachées à un code de nomenclature", severity: "basse" },
  { type: "Seuil dépassé",  message: "Code 04.01 Logiciels : 520k€ sans procédure formalisée — AO requis", severity: "haute" },
];

interface NomenclatureNode {
  id: string; code: string; label: string; type: string;
  montant: number; seuil: number; conforme: boolean;
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

  const nonConformes = nodes.filter((n) => !n.conforme);

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "10px",
    fontSize: "12px",
    boxShadow: "0 4px 16px hsl(var(--foreground) / 0.1)",
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="space-y-3">
      <DemoBanner />

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-8 pb-3" style={{ borderBottom: "1px solid hsl(var(--primary) / 0.08)" }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "hsl(var(--foreground) / 0.22)" }}>
            Module cartographie
          </p>
          <h1 className="text-[22px] leading-none font-extrabold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.025em" }}>
            Cartographie{" "}
            <Highlight variant="mark" color="teal">des achats</Highlight>
          </h1>
          <p className="text-[13px] mt-1 font-medium" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
            Photographie fine de la dépense publique · 84,2 M€ consolidés · 14 familles homogènes
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={demo} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Importer base achats
          </button>
          <button
            onClick={demo}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
            style={{ background: "hsl(var(--primary))" }}
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
          { label: "Familles d'achats",       value: "14",                                                   icon: Layers,       color: "hsl(var(--accent))" },
          { label: "Codes nomenclature",       value: `${nodes.filter(n => n.type === "code").length || 86}`, icon: FolderOpen,   color: "hsl(var(--primary))" },
          { label: "Dépenses classifiées",     value: "96%",                                                  icon: CheckCircle2, color: "hsl(var(--accent))" },
          { label: "Fractionnements détectés", value: `${nonConformes.length || 5}`,                          icon: Scale,        color: "hsl(var(--destructive))" },
          { label: "Écart budgétaire moyen",   value: "4,2%",                                                 icon: Target,       color: "hsl(var(--warning))" },
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

      {/* ── Bar chart familles + Direction ── */}
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 6px hsl(var(--primary))" }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
          Répartition de la dépense
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* Bar chart horizontal — 14 familles */}
        <div className="lg:col-span-8 rounded-[14px] overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2.5">
              <Layers className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Familles d&apos;achats homogènes
              </span>
            </div>
            {/* Légende catégories */}
            <div className="flex items-center gap-3">
              {CATEGORY_META.map(c => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-[10px]" style={{ color: "hsl(var(--foreground) / 0.45)" }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3" style={{ height: 300 }}>
            <ChartContainer config={spendChartConfig} className="h-full">
              <BarChart
                data={spendData}
                layout="vertical"
                barSize={12}
                margin={{ top: 0, right: 52, bottom: 0, left: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--foreground) / 0.38)", fontFamily: '"Barlow Condensed", sans-serif' }}
                  tickFormatter={(v) => `${v}M€`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={76}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground) / 0.65)", fontFamily: '"Helvetica Neue", Helvetica, sans-serif' }}
                />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => `${v} M€`}
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
                    formatter={(v: number) => `${v}M€`}
                    style={{ fontSize: 10, fontFamily: '"Barlow Condensed", sans-serif', fill: "hsl(var(--foreground) / 0.45)" }}
                  />
                  {spendData.map((entry, i) => (
                    <Cell key={i} fill={CAT_COLOR[entry.category]} fillOpacity={0.82} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Donut — par direction */}
        <div className="lg:col-span-4 rounded-[14px] overflow-hidden flex flex-col"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center px-5 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Par direction
            </span>
          </div>

          {/* Donut centré avec total */}
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
                      formatter={(v) => `${v} M€`}
                      indicator="dot"
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
            {/* Total centré */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[22px] font-bold num leading-none" style={{ color: "hsl(var(--foreground))" }}>84,2</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "hsl(var(--foreground) / 0.35)" }}>M€ total</span>
            </div>
          </div>

          {/* Liste directions */}
          <div className="px-5 pb-3 pt-2 space-y-1.5 flex-1">
            {directionData.map((d) => {
              const pct = ((d.value / 84.2) * 100).toFixed(0);
              return (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[11px] flex-1 truncate" style={{ color: "hsl(var(--foreground) / 0.55)" }}>{d.name}</span>
                  <span className="text-[10px]" style={{ color: "hsl(var(--foreground) / 0.3)" }}>{pct}%</span>
                  <span className="text-[11px] font-bold num" style={{ color: "hsl(var(--foreground) / 0.75)" }}>{d.value}M€</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Computation des seuils ── */}
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
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>M€</span>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <th className="text-left px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Famille</th>
                <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>2026</th>
                <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>2025</th>
                <th className="text-right px-5 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.35)" }}>Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparatif.map((c) => (
                <tr key={c.famille} className="data-row">
                  <td className="px-5 py-2 text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{c.famille}</td>
                  <td className="px-5 py-2 text-right text-sm font-bold num" style={{ color: "hsl(var(--foreground))" }}>{c.n}</td>
                  <td className="px-5 py-2 text-right text-sm num" style={{ color: "hsl(var(--foreground) / 0.4)" }}>{c.n1}</td>
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
              Écarts budgétaires par direction
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
              const prevuPct   = (d.prevu   / ECARTS_MAX) * 100;
              const executePct = (d.execute / ECARTS_MAX) * 100;
              const delta      = ((d.execute - d.prevu) / d.prevu) * 100;
              const isOver     = delta > 0;
              const execColor  = isOver
                ? "hsl(var(--destructive) / 0.8)"
                : "hsl(var(--accent) / 0.8)";
              const deltaColor = isOver ? "hsl(var(--destructive))" : "hsl(var(--accent))";
              const deltaBg    = isOver ? "hsl(var(--destructive) / 0.07)" : "hsl(var(--accent) / 0.07)";
              return (
                <div key={d.direction}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--foreground) / 0.75)" }}>{d.direction}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] num" style={{ color: "hsl(var(--foreground) / 0.3)" }}>{d.prevu}M€ prévu</span>
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
                      <span className="text-[9px] font-bold num" style={{ color: "hsl(var(--foreground) / 0.45)" }}>{d.execute}M€</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Anomalies ── */}
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
    </div>
  );
}
