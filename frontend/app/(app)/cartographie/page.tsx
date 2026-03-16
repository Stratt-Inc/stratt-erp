"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoAction } from "@/store/toast";
import {
  ResponsiveContainer, Treemap, Tooltip, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Upload, BarChart3, AlertTriangle, TrendingDown, TrendingUp,
  Layers, FolderOpen, Scale, Target, CheckCircle2, ArrowUpRight, Map,
} from "lucide-react";

/* ── Static data (mirrors maquette) ── */
const flatTreemap = [
  { name: "Bâtiment", size: 15000000, category: "Travaux" },
  { name: "Voirie", size: 8500000, category: "Travaux" },
  { name: "Réseaux", size: 5000000, category: "Travaux" },
  { name: "Informatique", size: 7200000, category: "Fournitures" },
  { name: "Bureau", size: 4500000, category: "Fournitures" },
  { name: "Mobilier", size: 3500000, category: "Fournitures" },
  { name: "Scolaire", size: 3000000, category: "Fournitures" },
  { name: "Conseil", size: 8000000, category: "Services" },
  { name: "Nettoyage", size: 6000000, category: "Services" },
  { name: "Formation", size: 4800000, category: "Services" },
  { name: "Maintenance", size: 4000000, category: "Services" },
  { name: "Logiciels", size: 8000000, category: "PI/TIC" },
  { name: "Télécom", size: 4200000, category: "PI/TIC" },
  { name: "Hébergement", size: 2500000, category: "PI/TIC" },
];

/* Couleurs groupées par catégorie — palette cohérente avec le PieChart */
const CAT_COLORS: Record<string, { base: string; shades: string[] }> = {
  "Travaux":      { base: "#3b82f6", shades: ["#1e40af", "#2563eb", "#3b82f6"] },
  "Fournitures":  { base: "#8b5cf6", shades: ["#4c1d95", "#7c3aed", "#8b5cf6", "#a78bfa"] },
  "Services":     { base: "#10b981", shades: ["#065f46", "#059669", "#10b981", "#34d399"] },
  "PI/TIC":       { base: "#f59e0b", shades: ["#92400e", "#d97706", "#f59e0b"] },
};

// Index counter per category to pick shades
const catIdx: Record<string, number> = {};
const CELL_COLORS: Record<string, string> = {};
for (const item of flatTreemap) {
  const cat = CAT_COLORS[item.category];
  if (!cat) continue;
  catIdx[item.category] = (catIdx[item.category] ?? 0);
  CELL_COLORS[item.name] = cat.shades[catIdx[item.category] % cat.shades.length];
  catIdx[item.category]++;
}

const CATEGORY_META = [
  { label: "Travaux",     color: "#2563eb", total: 28.5 },
  { label: "Fournitures", color: "#7c3aed", total: 18.2 },
  { label: "Services",    color: "#059669", total: 22.8 },
  { label: "PI/TIC",      color: "#d97706", total: 14.7 },
];

/* PieChart directions — mêmes teintes */
const directionData = [
  { name: "Infrastructures", value: 28.5, color: "#1e40af" },
  { name: "Éducation",       value: 18.2, color: "#7c3aed" },
  { name: "Numérique",       value: 14.7, color: "#d97706" },
  { name: "Services",        value: 12.3, color: "#059669" },
  { name: "Autres",          value: 10.5, color: "#94a3b8" },
];

const TOTAL_ALL = 84.2;

const CustomTreemapContent = (props: {
  x?: number; y?: number; width?: number; height?: number; name?: string; size?: number;
}) => {
  const { x = 0, y = 0, width = 0, height = 0, name = "", size = 0 } = props;
  if (width < 18 || height < 14) return null;
  const fill = CELL_COLORS[name] ?? "#64748b";
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill={fill} rx={3} />
      {width > 48 && height > 22 && (
        <text x={x + 7} y={y + 15} fill="white" fontSize={10} fontWeight={600}>{name}</text>
      )}
      {width > 48 && height > 36 && (
        <text x={x + 7} y={y + 28} fill="rgba(255,255,255,0.7)" fontSize={9}>
          {(size / 1_000_000).toFixed(1)} M€
        </text>
      )}
    </g>
  );
};

const comparatif = [
  { famille: "Travaux", n: 28.5, n1: 26.2, delta: "+8.8%", up: true },
  { famille: "Fournitures", n: 18.2, n1: 19.8, delta: "-8.1%", up: false },
  { famille: "Services", n: 22.8, n1: 21.1, delta: "+8.1%", up: true },
  { famille: "PI / TIC", n: 14.7, n1: 12.4, delta: "+18.5%", up: true },
];

const seuilsData = [
  { code: "02.01 — Informatique", depense: 380, seuil: 90, ratio: 4.2, statut: "Fractionnement" },
  { code: "03.02 — Nettoyage", depense: 245, seuil: 90, ratio: 2.7, statut: "Fractionnement" },
  { code: "01.01 — Bâtiment neuf", depense: 1200, seuil: 215, ratio: 5.6, statut: "AO requis" },
  { code: "04.01 — Logiciels", depense: 520, seuil: 215, ratio: 2.4, statut: "AO requis" },
  { code: "02.04 — Scolaire", depense: 85, seuil: 90, ratio: 0.94, statut: "Conforme" },
];


const ecartsData = [
  { direction: "Infrastructures", prevu: 30.0, execute: 28.5 },
  { direction: "Éducation", prevu: 17.0, execute: 18.2 },
  { direction: "Numérique", prevu: 13.5, execute: 14.7 },
  { direction: "Services", prevu: 12.0, execute: 12.3 },
  { direction: "RH", prevu: 6.0, execute: 5.8 },
];

const anomalies = [
  { type: "Fractionnement", message: "02.01 Fournitures informatiques : 12 MAPA < 40k€ totalisent 380k€ — seuil de publicité dépassé", severity: "haute" },
  { type: "Concentration", message: "85% du budget « Conseil » attribué à 2 fournisseurs — défaut de mise en concurrence", severity: "moyenne" },
  { type: "Classification", message: "23 dépenses mandatées non rattachées à un code de nomenclature", severity: "basse" },
  { type: "Seuil dépassé", message: "Code 04.01 Logiciels : 520k€ sans procédure formalisée — AO requis", severity: "haute" },
];

interface NomenclatureNode { id: string; code: string; label: string; type: string; montant: number; seuil: number; conforme: boolean; }

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
    borderRadius: "8px",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Module cartographie</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.1)" }}>
              <Map className="w-3.5 h-3.5" style={{ color: "#06B6D4" }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Cartographie stratégique des achats</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
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
            style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Générer cartographie
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Familles d'achats", value: "14", icon: Layers, alert: false },
          { label: "Codes nomenclature", value: `${nodes.filter(n => n.type === "code").length || 86}`, icon: FolderOpen, alert: false },
          { label: "Dépenses classifiées", value: "96%", icon: CheckCircle2, alert: false },
          { label: "Fractionnements détectés", value: `${nonConformes.length || 5}`, icon: Scale, alert: true },
          { label: "Écart budgétaire moyen", value: "4,2%", icon: Target, alert: false },
        ].map(({ label, value, icon: Icon, alert }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5" style={{ color: alert ? "#EF4444" : "#5C93FF" }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
            </div>
            <span className="text-xl font-bold font-display" style={{ color: alert ? "#EF4444" : "hsl(var(--foreground))" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Import zone */}
      <div className="rounded-xl border border-dashed border-border bg-card p-6 flex items-center gap-6">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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

      {/* Treemap + Direction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: "#5C93FF" }} />
              <h2 className="text-sm font-semibold text-foreground">Cartographie par famille d&apos;achats homogène</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">84,2 M€ total</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={flatTreemap} dataKey="size" aspectRatio={4 / 3} content={<CustomTreemapContent />}>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${(v / 1_000_000).toFixed(2)} M€`, "Montant"]}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>

          {/* Category legend */}
          <div className="flex items-center gap-5 mt-4 flex-wrap">
            {CATEGORY_META.map((cat) => (
              <div key={cat.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cat.color }} />
                <span className="text-[11px] text-muted-foreground">{cat.label}</span>
                <span className="text-[11px] font-semibold num text-foreground">{cat.total} M€</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Consolidation par direction</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={directionData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" stroke="white" strokeWidth={2}>
                  {directionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} M€`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {directionData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                <span className="font-semibold num text-foreground">{d.value} M€</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Computation des seuils */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Scale className="w-4 h-4" style={{ color: "#F59E0B" }} />
          <h2 className="text-sm font-semibold text-foreground">Computation des seuils de procédure</h2>
          <span className="text-xs text-muted-foreground ml-1">Art. L2124-1 CCP</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code nomenclature</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dépense cumulée (k€)</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seuil applicable (k€)</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ratio</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {seuilsData.map((s) => (
              <tr key={s.code} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-foreground">{s.code}</td>
                <td className="px-5 py-3 text-right text-sm font-semibold num text-foreground">{s.depense}</td>
                <td className="px-5 py-3 text-right text-sm num text-muted-foreground">{s.seuil}</td>
                <td className="px-5 py-3 text-right text-sm num">
                  <span style={{ color: s.ratio > 1 ? "#EF4444" : "#10B981", fontWeight: s.ratio > 1 ? 700 : 400 }}>
                    {s.ratio.toFixed(1)}x
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: s.statut === "Conforme" ? "#10B981" : s.statut === "Fractionnement" ? "#EF4444" : "#F59E0B",
                    }}
                  >
                    {s.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparatif N/N-1 + Écarts budgétaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Comparatif N / N-1 (M€)</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Famille</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">2026 (N)</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">2025 (N-1)</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparatif.map((c) => (
                <tr key={c.famille} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{c.famille}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold num text-foreground">{c.n}</td>
                  <td className="px-5 py-3 text-right text-sm num text-muted-foreground">{c.n1}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className="inline-flex items-center gap-0.5 text-xs font-semibold"
                      style={{ color: c.up ? "#10B981" : "#EF4444" }}
                    >
                      {c.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {c.delta}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Écarts budgétaires par direction</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ecartsData} layout="vertical" barGap={2} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="direction" type="category" width={88} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} M€`} />
                <Bar dataKey="prevu" name="Prévu" fill="hsl(var(--muted))" radius={[0, 2, 2, 0]} />
                <Bar dataKey="execute" name="Exécuté" fill="#5C93FF" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Anomalies */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Anomalies détectées</p>
        <div className="space-y-2">
          {anomalies.map((a, i) => {
            const isHaute = a.severity === "haute";
            const isMoyenne = a.severity === "moyenne";
            const borderColor = isHaute ? "#EF4444" : isMoyenne ? "#F59E0B" : "hsl(var(--muted-foreground))";
            const bg = isHaute ? "rgba(239,68,68,0.04)" : isMoyenne ? "rgba(245,158,11,0.04)" : "hsl(var(--muted)/0.3)";
            const textColor = isHaute ? "#EF4444" : isMoyenne ? "#F59E0B" : "hsl(var(--muted-foreground))";
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border"
                style={{ borderLeftWidth: "3px", borderLeftColor: borderColor, background: bg }}
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: textColor }} />
                <div className="flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: textColor }}>{a.type}</span>
                  <p className="text-sm text-foreground mt-0.5 leading-snug">{a.message}</p>
                </div>
                <button onClick={demo} className="text-xs font-semibold hover:underline flex items-center gap-0.5 flex-shrink-0" style={{ color: "#5C93FF" }}>
                  Détails <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
