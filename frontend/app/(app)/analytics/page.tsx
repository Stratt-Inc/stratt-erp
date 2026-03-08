"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { BarChart2, Users, FileText, Package, Briefcase, TrendingUp, Handshake, DollarSign } from "lucide-react";

interface Overview {
  total_contacts: number;
  total_leads: number;
  total_deals: number;
  total_revenue: number;
  total_invoices: number;
  total_employees: number;
  total_products: number;
}

function MetricCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.FC<{ className?: string; style?: React.CSSProperties }>; color: string; sub?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}14` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        {sub && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
            {sub}
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold font-mono tabular-nums text-foreground">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-mono font-bold text-foreground">{value.toLocaleString("fr-FR")}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: overview, isLoading } = useQuery<Overview>({
    queryKey: ["analytics", "overview", currentOrg?.id],
    queryFn: () => api.get("/api/v1/analytics/overview", opts),
    enabled: !!accessToken && !!currentOrg,
    refetchInterval: 30_000,
  });

  const metrics = [
    { label: "Contacts CRM", value: overview?.total_contacts ?? 0, icon: Users, color: "#5B6BF5" },
    { label: "Leads", value: overview?.total_leads ?? 0, icon: TrendingUp, color: "#06B6D4" },
    { label: "Deals", value: overview?.total_deals ?? 0, icon: Handshake, color: "#9B6FE8" },
    { label: "CA encaissé", value: `${(overview?.total_revenue ?? 0).toLocaleString("fr-FR")} €`, icon: DollarSign, color: "#10B981", sub: "Total payé" },
    { label: "Factures", value: overview?.total_invoices ?? 0, icon: FileText, color: "#F59E0B" },
    { label: "Employés", value: overview?.total_employees ?? 0, icon: Briefcase, color: "#EC4899" },
    { label: "Produits", value: overview?.total_products ?? 0, icon: Package, color: "#6366F1" },
  ];

  const maxValue = Math.max(
    overview?.total_contacts ?? 0,
    overview?.total_leads ?? 0,
    overview?.total_deals ?? 0,
    overview?.total_invoices ?? 0,
    overview?.total_employees ?? 0,
    overview?.total_products ?? 0,
    1,
  );

  return (
    <div className="space-y-8">
      <DemoBanner />

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.1)" }}>
          <BarChart2 className="w-3.5 h-3.5" style={{ color: "#06B6D4" }} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
          Temps réel
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}

            {/* Revenue highlight */}
            <div className="lg:col-span-1 bg-card rounded-xl border border-border p-5 flex flex-col justify-between"
              style={{ background: "linear-gradient(135deg, rgba(91,107,245,0.06), rgba(155,111,232,0.06))" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Santé globale</p>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-3xl font-extrabold font-mono text-foreground">
                  {overview && overview.total_contacts + overview.total_leads + overview.total_deals > 0 ? "✓" : "—"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {overview?.total_contacts ?? 0} contacts · {overview?.total_leads ?? 0} leads · {overview?.total_deals ?? 0} deals
              </p>
            </div>
          </div>

          {/* Distribution chart (CSS-only bars) */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-sm font-bold text-foreground mb-5">Distribution des données</h2>
            <div className="space-y-4">
              <ProgressBar label="Contacts" value={overview?.total_contacts ?? 0} max={maxValue} color="#5B6BF5" />
              <ProgressBar label="Leads" value={overview?.total_leads ?? 0} max={maxValue} color="#06B6D4" />
              <ProgressBar label="Deals" value={overview?.total_deals ?? 0} max={maxValue} color="#9B6FE8" />
              <ProgressBar label="Factures" value={overview?.total_invoices ?? 0} max={maxValue} color="#F59E0B" />
              <ProgressBar label="Employés" value={overview?.total_employees ?? 0} max={maxValue} color="#EC4899" />
              <ProgressBar label="Produits" value={overview?.total_products ?? 0} max={maxValue} color="#6366F1" />
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "CRM Pipeline", desc: `${overview?.total_leads ?? 0} leads actifs en cours de qualification`, color: "#5B6BF5" },
              { title: "Facturation", desc: `${overview?.total_invoices ?? 0} factures — ${(overview?.total_revenue ?? 0).toLocaleString("fr-FR")} € encaissés`, color: "#F59E0B" },
              { title: "Inventaire", desc: `${overview?.total_products ?? 0} références produits gérées`, color: "#6366F1" },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-border bg-card p-5">
                <div className="w-2 h-2 rounded-full mb-3" style={{ background: card.color }} />
                <h3 className="text-sm font-bold text-foreground mb-1">{card.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
