"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
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
  { label: "Planification", href: "/planification", icon: Calendar, color: "#5B6BF5", description: "Marchés publics & calendrier" },
  { label: "Cartographie", href: "/cartographie", icon: Map, color: "#06B6D4", description: "Dépenses par famille" },
  { label: "Nomenclature", href: "/nomenclature", icon: BookOpen, color: "#6366F1", description: "Arborescence des codes achats" },
  { label: "Documents", href: "/exports", icon: Download, color: "#F59E0B", description: "Rapports & exports PDF" },
];

const erpModules = [
  { label: "CRM", href: "/crm", icon: Users, color: "#5B6BF5", description: "Contacts, leads & deals" },
  { label: "Comptabilité", href: "/accounting", icon: Calculator, color: "#10B981", description: "Comptes & transactions" },
  { label: "Facturation", href: "/billing", icon: FileText, color: "#F59E0B", description: "Devis & factures" },
  { label: "Inventaire", href: "/inventory", icon: Package, color: "#6366F1", description: "Produits & stocks" },
  { label: "RH", href: "/hr", icon: Briefcase, color: "#EC4899", description: "Employés & congés" },
  { label: "Achats", href: "/procurement", icon: ShoppingCart, color: "#8B5CF6", description: "Commandes fournisseurs" },
  { label: "Analytics", href: "/analytics", icon: BarChart2, color: "#06B6D4", description: "Rapports & tableaux de bord" },
];

const staticAlerts = [
  { label: "Fractionnement détecté", detail: "02.01 Informatique · 380k€ cumulés · seuil 90k€ dépassé", severity: "haute", href: "/cartographie" },
  { label: "Marché en alerte", detail: "M2026-023 · Procédure formalisée requise (art. L2124-1)", severity: "haute", href: "/planification" },
  { label: "23 dépenses non classifiées", detail: "Rattachement nomenclature manquant", severity: "moyenne", href: "/nomenclature" },
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

  const marcheKpis = [
    { label: "Marchés en cours", value: marcheStats?.en_cours ?? 0, icon: CalendarRange, color: "#5B6BF5" },
    { label: "Alertes actives",  value: marcheStats?.alertes ?? 0,   icon: AlertTriangle,  color: "#EF4444" },
    { label: "Budget prévisionnel", value: `${budgetK} k€`,          icon: TrendingUp,     color: "#10B981" },
    { label: "Charge prévisionnelle", value: `${marcheStats?.charge_total ?? 0} j/h`, icon: Scale, color: "#F59E0B" },
  ];

  const erpStats = [
    { label: "Contacts", value: overview?.total_contacts ?? 0,   icon: Users,     color: "#5B6BF5" },
    { label: "Leads",    value: overview?.total_leads ?? 0,      icon: TrendingUp, color: "#10B981" },
    { label: "Factures", value: overview?.total_invoices ?? 0,   icon: FileText,  color: "#F59E0B" },
    { label: "CA payé",  value: `${(overview?.total_revenue ?? 0).toLocaleString("fr-FR")} €`, icon: BarChart2, color: "#06B6D4" },
    { label: "Produits", value: overview?.total_products ?? 0,   icon: Package,   color: "#6366F1" },
    { label: "Employés", value: overview?.total_employees ?? 0,  icon: Briefcase, color: "#EC4899" },
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground capitalize mb-0.5">{dateLabel}</p>
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d&apos;ensemble de{" "}
          <span className="font-semibold text-foreground">{currentOrg?.name ?? "votre organisation"}</span>
        </p>
      </div>

      {/* ── Pilotage achats publics ── */}
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Pilotage achats publics
        </h2>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {marcheKpis.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Modules + Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            {pilotageModules.map(({ label, href, icon: Icon, color, description }) => (
              <a
                key={href}
                href={href}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-muted-foreground text-xs mt-1">{description}</p>
              </a>
            ))}
          </div>

          {/* Alertes */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
              <h3 className="text-sm font-semibold text-foreground">Alertes prioritaires</h3>
              <span
                className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
              >
                {staticAlerts.length}
              </span>
            </div>
            <div className="divide-y divide-border">
              {staticAlerts.map((a, i) => (
                <a key={i} href={a.href} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: a.severity === "haute" ? "#EF4444" : "#F59E0B" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{a.detail}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                </a>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-border">
              <a href="/cartographie" className="text-[10px] font-semibold flex items-center gap-1 hover:underline" style={{ color: "#5B6BF5" }}>
                Voir toutes les anomalies <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── ERP ── */}
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Modules ERP
        </h2>

        {/* KPIs ERP */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {erpStats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon className="w-3 h-3" style={{ color }} />
                </div>
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {erpModules.map(({ label, href, icon: Icon, color, description }) => (
            <a
              key={href}
              href={href}
              className="group rounded-xl border border-border bg-card p-4 hover:border-primary/20 hover:shadow-sm transition-all"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="font-semibold text-foreground text-xs">{label}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5 leading-snug">{description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
