"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import {
  BarChart2, Users, FileText, Package, Briefcase,
  TrendingUp, Handshake, DollarSign, Download,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface Overview {
  total_contacts: number;
  total_leads: number;
  total_deals: number;
  total_revenue: number;
  total_invoices: number;
  total_employees: number;
  total_products: number;
}

interface ABCRow {
  label: string;
  total: number;
  rank: number;
  share: number;
  cumulative: number;
  class: "A" | "B" | "C";
}

interface ABCResult {
  dimension: string;
  total_spend: number;
  threshold_a: number;
  threshold_b: number;
  rows: ABCRow[];
}

// ── Constants ─────────────────────────────────────────────────────────

const CLASS_COLORS: Record<string, string> = { A: "#5C93FF", B: "#10B981", C: "#F59E0B" };
const CLASS_BG: Record<string, string> = {
  A: "rgba(92,147,255,0.12)", B: "rgba(16,185,129,0.12)", C: "rgba(245,158,11,0.12)",
};

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function downloadCSV(rows: ABCRow[], dimension: string) {
  const header = "Rang,Libellé,Montant (€),Part (%),Cumulé (%),Classe\n";
  const lines = rows.map((r) =>
    `${r.rank},"${r.label}",${r.total.toFixed(2)},${r.share.toFixed(2)},${r.cumulative.toFixed(2)},${r.class}`
  ).join("\n");
  const blob = new Blob([header + lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `abc_${dimension}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  color: string; sub?: string;
}) {
  return (
    <div className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
      {sub && (
        <span className="absolute top-4 right-6 text-[10px] font-semibold px-2 py-0.5 rounded-full z-10"
          style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>{sub}</span>
      )}
      <p className="stat-number-sm">{value}</p>
      <p className="stat-label">{label}</p>
      <Icon className="stat-tile-icon" />
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="num font-bold text-foreground">{value.toLocaleString("fr-FR")}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────

function OverviewTab({ overview, isLoading }: { overview?: Overview; isLoading: boolean }) {
  const metrics = [
    { label: "Contacts CRM", value: overview?.total_contacts ?? 0, icon: Users, color: "#5C93FF" },
    { label: "Leads", value: overview?.total_leads ?? 0, icon: TrendingUp, color: "#06B6D4" },
    { label: "Deals", value: overview?.total_deals ?? 0, icon: Handshake, color: "#24DDB8" },
    { label: "CA encaissé", value: `${(overview?.total_revenue ?? 0).toLocaleString("fr-FR")} €`, icon: DollarSign, color: "#10B981", sub: "Total payé" },
    { label: "Factures", value: overview?.total_invoices ?? 0, icon: FileText, color: "#F59E0B" },
    { label: "Employés", value: overview?.total_employees ?? 0, icon: Briefcase, color: "#EC4899" },
    { label: "Produits", value: overview?.total_products ?? 0, icon: Package, color: "#6366F1" },
  ];
  const maxValue = Math.max(
    overview?.total_contacts ?? 0, overview?.total_leads ?? 0, overview?.total_deals ?? 0,
    overview?.total_invoices ?? 0, overview?.total_employees ?? 0, overview?.total_products ?? 0, 1,
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#24DDB8", boxShadow: "0 0 6px #24DDB8" }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>
          Vue d&apos;ensemble ERP
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border p-3 flex flex-col justify-between"
          style={{ background: "linear-gradient(135deg, rgba(92,147,255,0.08), rgba(36,221,184,0.06))" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Santé globale</p>
          <div className="flex items-end gap-1 mt-1">
            <span className="text-3xl font-extrabold font-display text-foreground">
              {overview && overview.total_contacts + overview.total_leads + overview.total_deals > 0 ? "✓" : "—"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {overview?.total_contacts ?? 0} contacts · {overview?.total_leads ?? 0} leads · {overview?.total_deals ?? 0} deals
          </p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-3">
        <h2 className="text-sm font-bold text-foreground mb-3">Distribution des données</h2>
        <div className="space-y-2.5">
          <ProgressBar label="Contacts" value={overview?.total_contacts ?? 0} max={maxValue} color="#5C93FF" />
          <ProgressBar label="Leads" value={overview?.total_leads ?? 0} max={maxValue} color="#06B6D4" />
          <ProgressBar label="Deals" value={overview?.total_deals ?? 0} max={maxValue} color="#24DDB8" />
          <ProgressBar label="Factures" value={overview?.total_invoices ?? 0} max={maxValue} color="#F59E0B" />
          <ProgressBar label="Employés" value={overview?.total_employees ?? 0} max={maxValue} color="#EC4899" />
          <ProgressBar label="Produits" value={overview?.total_products ?? 0} max={maxValue} color="#6366F1" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { title: "CRM Pipeline", desc: `${overview?.total_leads ?? 0} leads actifs en cours de qualification`, color: "#5C93FF" },
          { title: "Facturation", desc: `${overview?.total_invoices ?? 0} factures — ${(overview?.total_revenue ?? 0).toLocaleString("fr-FR")} € encaissés`, color: "#F59E0B" },
          { title: "Inventaire", desc: `${overview?.total_products ?? 0} références produits gérées`, color: "#6366F1" },
        ].map((card) => (
          <div key={card.title} className="rounded-xl border border-border bg-card p-3">
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: card.color }} />
            <h3 className="text-sm font-bold text-foreground mb-1">{card.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ABC Tab ────────────────────────────────────────────────────────────

function ABCTab() {
  const { accessToken, currentOrg } = useAuthStore();
  const [dimension, setDimension] = useState<"supplier" | "category">("supplier");
  const [thresholdA, setThresholdA] = useState(80);
  const [thresholdB, setThresholdB] = useState(95);

  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data, isLoading, isError } = useQuery<ABCResult>({
    queryKey: ["analytics", "abc", currentOrg?.id, dimension, thresholdA, thresholdB],
    queryFn: () =>
      api.get(`/api/v1/analytics/abc?dimension=${dimension}&threshold_a=${thresholdA}&threshold_b=${thresholdB}`, opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const chartData = (data?.rows ?? []).slice(0, 30).map((r) => ({
    name: r.label.length > 18 ? r.label.slice(0, 16) + "…" : r.label,
    montant: r.total,
    cumule: r.cumulative,
  }));

  const countA = data?.rows.filter((r) => r.class === "A").length ?? 0;
  const countB = data?.rows.filter((r) => r.class === "B").length ?? 0;
  const countC = data?.rows.filter((r) => r.class === "C").length ?? 0;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 p-3 rounded-xl border border-border bg-card items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dimension</label>
          <div className="flex gap-2">
            {(["supplier", "category"] as const).map((d) => (
              <button key={d} onClick={() => setDimension(d)}
                className={["px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  dimension === d ? "text-white" : "text-muted-foreground bg-muted/30 hover:bg-muted/60"].join(" ")}
                style={dimension === d ? { background: "#5C93FF" } : undefined}>
                {d === "supplier" ? "Fournisseurs" : "Familles d'achat"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          {[{ label: "Seuil A (%)", val: thresholdA, set: setThresholdA, min: 50, max: 90 },
            { label: "Seuil A+B (%)", val: thresholdB, set: setThresholdB, min: thresholdA + 1, max: 99 }
          ].map(({ label, val, set, min, max }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
              <input type="number" min={min} max={max} value={val}
                onChange={(e) => set(Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ))}
        </div>
        {data && (
          <button onClick={() => downloadCSV(data.rows, dimension)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
        )}
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Dépense totale</p>
            <p className="text-2xl font-bold font-display text-foreground">{formatEur(data.total_spend)}</p>
          </div>
          {(["A", "B", "C"] as const).map((cls) => {
            const count = cls === "A" ? countA : cls === "B" ? countB : countC;
            const label = cls === "A" ? "Stratégiques" : cls === "B" ? "Intermédiaires" : "Secondaires";
            return (
              <div key={cls} className="rounded-xl border border-border bg-card p-3"
                style={{ borderLeftWidth: 3, borderLeftColor: CLASS_COLORS[cls] }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Classe {cls} — {label}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: CLASS_COLORS[cls], background: CLASS_BG[cls] }}>{cls}</span>
                </div>
                <p className="text-2xl font-bold font-display text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dimension === "supplier" ? "fournisseurs" : "familles"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pareto chart */}
      <div className="rounded-xl border border-border bg-card p-3">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Courbe de Pareto — Top 30 {dimension === "supplier" ? "fournisseurs" : "familles"}
        </h2>
        {isLoading && <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Chargement…</div>}
        {isError && <div className="h-56 flex items-center justify-center text-destructive text-sm">Erreur lors du chargement</div>}
        {!isLoading && !isError && chartData.length === 0 && (
          <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
            Aucune donnée — créez des commandes fournisseurs pour voir le classement ABC.
          </div>
        )}
        {!isLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 60, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-40} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) =>
                  name === "montant" ? [formatEur(value), "Montant"] : [`${(value as number).toFixed(1)}%`, "% cumulé"]} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(v) => v === "montant" ? "Montant (€)" : "% cumulé"} />
              <ReferenceLine yAxisId="right" y={thresholdA} stroke={CLASS_COLORS.A} strokeDasharray="6 3"
                label={{ value: `A (${thresholdA}%)`, position: "right", fontSize: 10, fill: CLASS_COLORS.A }} />
              <ReferenceLine yAxisId="right" y={thresholdB} stroke={CLASS_COLORS.B} strokeDasharray="6 3"
                label={{ value: `B (${thresholdB}%)`, position: "right", fontSize: 10, fill: CLASS_COLORS.B }} />
              <Bar yAxisId="left" dataKey="montant" fill="#5C93FF" opacity={0.85} radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cumule" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detail table */}
      {data && data.rows.length > 0 && (
        <div className="data-table-wrap overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Détail ({data.rows.length} {dimension === "supplier" ? "fournisseurs" : "familles"})
            </h2>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-600px)]">
            <table className="w-full text-sm">
              <thead className="data-table-head">
                <tr>
                  {["Rang", "Libellé", "Montant", "Part (%)", "Cumulé (%)", "Classe"].map((col) => (
                    <th key={col} className="data-th">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="data-table-body">
                {data.rows.map((row) => (
                  <tr key={row.rank} className="data-row">
                    <td className="px-4 py-2 font-mono text-muted-foreground text-xs">#{row.rank}</td>
                    <td className="px-4 py-2 font-medium text-foreground max-w-xs truncate">{row.label}</td>
                    <td className="px-4 py-2 num text-foreground">{formatEur(row.total)}</td>
                    <td className="px-4 py-2 num text-muted-foreground">{row.share.toFixed(1)}%</td>
                    <td className="px-4 py-2 num text-muted-foreground">{row.cumulative.toFixed(1)}%</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ color: CLASS_COLORS[row.class], background: CLASS_BG[row.class] }}>{row.class}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const [tab, setTab] = useState<"overview" | "abc">("overview");
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: overview, isLoading } = useQuery<Overview>({
    queryKey: ["analytics", "overview", currentOrg?.id],
    queryFn: () => api.get("/api/v1/analytics/overview", opts),
    enabled: !!accessToken && !!currentOrg,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-3">
      <DemoBanner />

      <div className="flex items-end justify-between gap-8 pb-3" style={{ borderBottom: "1px solid rgba(92,147,255,0.08)" }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(30,50,80,0.22)" }}>
            Module analytics
          </p>
          <h1 className="text-[22px] leading-none font-extrabold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.025em" }}>
            Analytics{" "}
            <span style={{
              background: "linear-gradient(135deg, #24DDB8 0%, #5C93FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              & Reporting
            </span>
          </h1>
          <p className="text-[13px] mt-1 font-medium" style={{ color: "rgba(30,50,80,0.4)" }}>
            Vue consolidée · Classement ABC · Courbe de Pareto
          </p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Temps réel</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/30 w-fit">
        {([
          { id: "overview", label: "Vue d'ensemble" },
          { id: "abc", label: "Classement ABC" },
        ] as const).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={["px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab overview={overview} isLoading={isLoading} />}
      {tab === "abc" && <ABCTab />}
    </div>
  );
}
