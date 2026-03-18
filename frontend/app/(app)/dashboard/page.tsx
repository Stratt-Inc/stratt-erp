"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import {
  Users, FileText, Package, Briefcase, TrendingUp, ShoppingCart,
  BarChart2, Calculator, Calendar, Map, BookOpen, Download,
  AlertTriangle, ChevronRight, CalendarRange, Scale,
} from "lucide-react";

interface Overview {
  total_contacts: number;
  total_leads: number;
  total_deals: number;
  total_revenue: number;
  total_invoices: number;
  total_employees: number;
  total_products: number;
}

interface MarcheStats {
  total: number;
  en_cours: number;
  alertes: number;
  budget_total: number;
  charge_total: number;
}

const pilotageModules = [
  { label: "Planification", href: "/planification", icon: Calendar, color: "#5C93FF", description: "Marchés publics & calendrier des passations" },
  { label: "Cartographie", href: "/cartographie", icon: Map, color: "#06B6D4", description: "Dépenses par famille achats" },
  { label: "Nomenclature", href: "/nomenclature", icon: BookOpen, color: "#24DDB8", description: "Arborescence des codes achats" },
  { label: "Documents", href: "/exports", icon: Download, color: "#F59E0B", description: "Rapports & exports PDF/Excel" },
];

const erpModules = [
  { label: "CRM", href: "/crm", icon: Users, color: "#5C93FF" },
  { label: "Comptabilité", href: "/accounting", icon: Calculator, color: "#10B981" },
  { label: "Facturation", href: "/billing", icon: FileText, color: "#F59E0B" },
  { label: "Inventaire", href: "/inventory", icon: Package, color: "#8B5CF6" },
  { label: "RH", href: "/hr", icon: Briefcase, color: "#EC4899" },
  { label: "Achats", href: "/procurement", icon: ShoppingCart, color: "#06B6D4" },
  { label: "Analytics", href: "/analytics", icon: BarChart2, color: "#24DDB8" },
];

const staticAlerts = [
  { label: "Fractionnement détecté", detail: "02.01 Informatique · 380k€ cumulés · seuil 90k€ dépassé", severity: "haute", href: "/cartographie", t: "08:34" },
  { label: "Marché en alerte seuils", detail: "M2026-023 · Procédure formalisée requise (art. L2124-1)", severity: "haute", href: "/planification", t: "Hier" },
  { label: "23 dépenses non classifiées", detail: "Rattachement nomenclature manquant · Action requise", severity: "moyenne", href: "/nomenclature", t: "16 mars" },
];

const dateLabel = new Date().toLocaleDateString("fr-FR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

export default function DashboardPage() {
  const { accessToken, currentOrg, user } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: overview } = useQuery<Overview>({
    queryKey: ["analytics", "overview", currentOrg?.id],
    queryFn: () => api.get("/api/v1/analytics/overview", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: marcheStats } = useQuery<MarcheStats>({
    queryKey: ["marches", "stats", currentOrg?.id],
    queryFn: () => api.get("/api/v1/marches/stats", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const budgetK = Math.round((marcheStats?.budget_total ?? 0) / 1000);
  const firstName = user?.name?.split(" ")[0] ?? "vous";

  return (
    <div className="space-y-3">
      <DemoBanner />

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-8 pb-3" style={{ borderBottom: "1px solid rgba(92,147,255,0.08)" }}>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(30,50,80,0.22)" }}>
            {dateLabel}
          </p>
          <h1 className="text-[24px] leading-none font-extrabold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.025em" }}>
            Bonjour,{" "}
            <Highlight variant="mark" color="blue">{firstName}</Highlight>
          </h1>
          <p className="text-[11px] mt-0.5 font-medium" style={{ color: "rgba(30,50,80,0.4)" }}>
            {currentOrg?.name ?? "Organisation"}
          </p>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          {[
            { value: marcheStats?.en_cours ?? 0, unit: "marchés", sublabel: "en cours", color: "#5C93FF" },
            { value: `${budgetK}k`, unit: "€", sublabel: "budget prévi.", color: "#24DDB8" },
            { value: marcheStats?.alertes ?? 0, unit: "alertes", sublabel: "actives", color: marcheStats?.alertes ? "#F59E0B" : "#6B7280" },
          ].map(({ value, unit, sublabel, color }) => (
            <div key={sublabel} className="text-right">
              <div className="flex items-baseline gap-0.5 justify-end">
                <span className="font-display text-[28px] leading-none font-semibold" style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                <span className="font-display text-[13px] leading-none font-medium" style={{ color }}>{unit}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] mt-0.5" style={{ color: "rgba(30,50,80,0.25)" }}>{sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PILOTAGE ── */}
      <div>
        <div className="section-header">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#5C93FF", boxShadow: "0 0 6px #5C93FF" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Pilotage achats publics</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
          {[
            { label: "Marchés en cours", value: marcheStats?.en_cours ?? 0, icon: CalendarRange, color: "#5C93FF" },
            { label: "Budget prévisionnel", value: `${budgetK} k€`, icon: TrendingUp, color: "#24DDB8" },
            { label: "Charge prévisionnelle", value: `${marcheStats?.charge_total ?? 0} j/h`, icon: Scale, color: "#F59E0B" },
            { label: "Alertes actives", value: marcheStats?.alertes ?? 0, icon: AlertTriangle, color: marcheStats?.alertes ? "#EF4444" : "#6B7280" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
              <p className="stat-number">{value}</p>
              <p className="stat-label">{label}</p>
              <Icon className="stat-tile-icon" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 grid grid-cols-2 gap-2">
            {pilotageModules.map(({ label, href, icon: Icon, color, description }) => (
              <a
                key={href} href={href}
                className="group relative overflow-hidden rounded-xl p-3.5 flex flex-col justify-end transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", minHeight: 88 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}28`; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${color}0D`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <Icon className="absolute -right-2 -top-2 w-16 h-16 transition-all duration-300 group-hover:scale-110" style={{ color, opacity: 0.05 }} />
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `${color}50` }} />
                <div>
                  <p className="text-[13px] font-bold text-foreground leading-tight">{label}</p>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "rgba(30,50,80,0.4)" }}>{description}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="px-3.5 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#EF4444", boxShadow: "0 0 6px #EF4444" }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">Alertes</span>
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>{staticAlerts.length}</span>
            </div>
            <div className="relative">
              <div className="absolute left-[23px] top-0 bottom-0 w-px" style={{ background: "hsl(var(--border))" }} />
              {staticAlerts.map((a, i) => (
                <a key={i} href={a.href} className="flex gap-3 px-3.5 py-2.5 hover:bg-black/[0.025] transition-colors group relative"
                  style={{ borderBottom: i < staticAlerts.length - 1 ? "1px solid hsl(var(--border))" : undefined }}>
                  <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-0.5 border-2 z-10"
                    style={{ background: a.severity === "haute" ? "#EF4444" : "#F59E0B", borderColor: "hsl(var(--card))" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold text-foreground leading-tight">{a.label}</p>
                      <span className="text-[9px] font-medium flex-shrink-0" style={{ color: "rgba(30,50,80,0.3)" }}>{a.t}</span>
                    </div>
                    <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "rgba(30,50,80,0.38)" }}>{a.detail}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="px-3.5 py-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              <a href="/cartographie" className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all" style={{ color: "#5C93FF" }}>
                Toutes les anomalies <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── ERP ── */}
      <div>
        <div className="section-header">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#24DDB8", boxShadow: "0 0 6px #24DDB8" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Modules ERP</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {erpModules.map(({ label, href, icon: Icon, color }, idx) => {
            const statMap: (number | undefined)[] = [
              overview?.total_contacts, undefined, overview?.total_invoices,
              overview?.total_products, overview?.total_employees, overview?.total_leads, undefined,
            ];
            const stat = statMap[idx];
            return (
              <a key={href} href={href}
                className="group relative overflow-hidden rounded-xl flex flex-col"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", minHeight: 108, transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${color}45`; el.style.transform = "translateY(-2px)"; el.style.boxShadow = `0 8px 20px ${color}18`; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "hsl(var(--border))"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
              >
                <div className="relative flex-1 flex flex-col justify-between px-3 pt-3 pb-2" style={{ background: `${color}08` }}>
                  <div className="flex items-start justify-between">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1C`, border: `1px solid ${color}2A` }}>
                      <Icon className="w-[13px] h-[13px]" style={{ color }} />
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color }} />
                  </div>
                  <div className="mt-2">
                    {stat !== undefined ? (
                      <p className="font-display leading-none font-semibold tabular-nums" style={{ fontSize: "22px", color: "hsl(var(--foreground))" }}>{stat}</p>
                    ) : (
                      <div className="w-5 h-0.5 rounded-full" style={{ background: `${color}35` }} />
                    )}
                  </div>
                </div>
                <div style={{ height: 1, background: `${color}35` }} />
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-bold text-foreground truncate">{label}</p>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: "Leads pipeline", value: overview?.total_leads ?? 0, icon: TrendingUp, color: "#10B981" },
            { label: "Chiffre d'affaires encaissé", value: `${(overview?.total_revenue ?? 0).toLocaleString("fr-FR")} €`, icon: BarChart2, color: "#06B6D4" },
            { label: "Deals actifs", value: overview?.total_deals ?? 0, icon: Users, color: "#5C93FF" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
              <p className="stat-number-sm">{value}</p>
              <p className="stat-label">{label}</p>
              <Icon className="stat-tile-icon" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
