"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { BarChart2, TrendingUp, Download } from "lucide-react";

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

const CLASS_COLORS: Record<string, string> = {
  A: "#5B6BF5",
  B: "#10B981",
  C: "#F59E0B",
};

const CLASS_BG: Record<string, string> = {
  A: "rgba(91,107,245,0.12)",
  B: "rgba(16,185,129,0.12)",
  C: "rgba(245,158,11,0.12)",
};

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function downloadCSV(rows: ABCRow[], dimension: string) {
  const header = "Rang,Libellé,Montant (€),Part (%),Cumulé (%),Classe\n";
  const lines = rows
    .map(
      (r) =>
        `${r.rank},"${r.label}",${r.total.toFixed(2)},${r.share.toFixed(2)},${r.cumulative.toFixed(2)},${r.class}`
    )
    .join("\n");
  const blob = new Blob([header + lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `abc_${dimension}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const [dimension, setDimension] = useState<"supplier" | "category">(
    "supplier"
  );
  const [thresholdA, setThresholdA] = useState(80);
  const [thresholdB, setThresholdB] = useState(95);

  const { data, isLoading, isError } = useQuery<ABCResult>({
    queryKey: ["analytics", "abc", currentOrg?.id, dimension, thresholdA, thresholdB],
    queryFn: () =>
      api.get(
        `/api/v1/analytics/abc?dimension=${dimension}&threshold_a=${thresholdA}&threshold_b=${thresholdB}`,
        { token: accessToken ?? "", orgId: currentOrg?.id }
      ),
    enabled: !!accessToken && !!currentOrg,
  });

  // Prépare les données pour le graphique (max 30 entrées pour la lisibilité)
  const chartData = (data?.rows ?? []).slice(0, 30).map((r) => ({
    name: r.label.length > 20 ? r.label.slice(0, 18) + "…" : r.label,
    montant: r.total,
    cumule: r.cumulative,
    class: r.class,
  }));

  const countA = data?.rows.filter((r) => r.class === "A").length ?? 0;
  const countB = data?.rows.filter((r) => r.class === "B").length ?? 0;
  const countC = data?.rows.filter((r) => r.class === "C").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-6 h-6" style={{ color: "#5B6BF5" }} />
            Classement ABC — Analyse de Pareto
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            20% des{" "}
            {dimension === "supplier" ? "fournisseurs" : "familles d'achat"}{" "}
            représentent 80% de la dépense
          </p>
        </div>
        {data && (
          <button
            onClick={() => downloadCSV(data.rows, dimension)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-border bg-card">
        {/* Dimension */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Dimension
          </label>
          <div className="flex gap-2">
            {(["supplier", "category"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDimension(d)}
                className={[
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  dimension === d
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60",
                ].join(" ")}
                style={
                  dimension === d
                    ? { background: "#5B6BF5" }
                    : undefined
                }
              >
                {d === "supplier" ? "Fournisseurs" : "Familles d'achat"}
              </button>
            ))}
          </div>
        </div>

        {/* Seuils */}
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Seuil A (%)
            </label>
            <input
              type="number"
              min={50}
              max={90}
              value={thresholdA}
              onChange={(e) => setThresholdA(Number(e.target.value))}
              className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Seuil A+B (%)
            </label>
            <input
              type="number"
              min={thresholdA + 1}
              max={99}
              value={thresholdB}
              onChange={(e) => setThresholdB(Number(e.target.value))}
              className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Dépense totale
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {formatEur(data.total_spend)}
            </p>
          </div>
          {(["A", "B", "C"] as const).map((cls) => {
            const count = cls === "A" ? countA : cls === "B" ? countB : countC;
            const label =
              cls === "A" ? "Stratégiques" : cls === "B" ? "Intermédiaires" : "Secondaires";
            return (
              <div
                key={cls}
                className="rounded-xl border border-border bg-card p-4"
                style={{ borderLeftWidth: 3, borderLeftColor: CLASS_COLORS[cls] }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Classe {cls} — {label}
                  </p>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: CLASS_COLORS[cls],
                      background: CLASS_BG[cls],
                    }}
                  >
                    {cls}
                  </span>
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
                  {count}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dimension === "supplier" ? "fournisseurs" : "familles"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Graphique Pareto */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Courbe de Pareto — Top 30{" "}
            {dimension === "supplier" ? "fournisseurs" : "familles"}
          </h2>
        </div>

        {isLoading && (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Chargement…
          </div>
        )}
        {isError && (
          <div className="h-64 flex items-center justify-center text-destructive text-sm">
            Erreur lors du chargement des données
          </div>
        )}
        {!isLoading && !isError && chartData.length === 0 && (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Aucune donnée disponible. Créez des commandes fournisseurs pour voir le classement ABC.
          </div>
        )}
        {!isLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 60, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                angle={-40}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === "montant") return [formatEur(value), "Montant"];
                  if (name === "cumule") return [`${value.toFixed(1)}%`, "% cumulé"];
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(v) =>
                  v === "montant" ? "Montant (€)" : "% cumulé"
                }
              />
              <ReferenceLine
                yAxisId="right"
                y={thresholdA}
                stroke={CLASS_COLORS.A}
                strokeDasharray="6 3"
                label={{
                  value: `A (${thresholdA}%)`,
                  position: "right",
                  fontSize: 10,
                  fill: CLASS_COLORS.A,
                }}
              />
              <ReferenceLine
                yAxisId="right"
                y={thresholdB}
                stroke={CLASS_COLORS.B}
                strokeDasharray="6 3"
                label={{
                  value: `B (${thresholdB}%)`,
                  position: "right",
                  fontSize: 10,
                  fill: CLASS_COLORS.B,
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="montant"
                fill="#5B6BF5"
                opacity={0.85}
                radius={[3, 3, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumule"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tableau détaillé */}
      {data && data.rows.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Détail du classement ({data.rows.length}{" "}
              {dimension === "supplier" ? "fournisseurs" : "familles"})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Rang", "Libellé", "Montant", "Part (%)", "Cumulé (%)", "Classe"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={row.rank}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-muted-foreground text-xs">
                      #{row.rank}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-foreground">
                      {formatEur(row.total)}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                      {row.share.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                      {row.cumulative.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          color: CLASS_COLORS[row.class],
                          background: CLASS_BG[row.class],
                        }}
                      >
                        {row.class}
                      </span>
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
