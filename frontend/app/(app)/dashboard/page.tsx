"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import {
  Users, FileText, Package, Briefcase, TrendingUp, ShoppingCart,
  BarChart2, Calculator,
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

const modules = [
  { label: "CRM", href: "/crm", icon: Users, color: "#5B6BF5", description: "Contacts, leads & deals" },
  { label: "Comptabilité", href: "/accounting", icon: Calculator, color: "#10B981", description: "Comptes & transactions" },
  { label: "Facturation", href: "/billing", icon: FileText, color: "#F59E0B", description: "Devis & factures" },
  { label: "Inventaire", href: "/inventory", icon: Package, color: "#6366F1", description: "Produits & stocks" },
  { label: "RH", href: "/hr", icon: Briefcase, color: "#EC4899", description: "Employés & congés" },
  { label: "Achats", href: "/procurement", icon: ShoppingCart, color: "#8B5CF6", description: "Commandes fournisseurs" },
  { label: "Analytics", href: "/analytics", icon: BarChart2, color: "#06B6D4", description: "Rapports & tableaux de bord" },
];

export default function DashboardPage() {
  const { accessToken, currentOrg, user } = useAuthStore();

  const { data: overview } = useQuery<Overview>({
    queryKey: ["analytics", "overview", currentOrg?.id],
    queryFn: () => api.get("/api/v1/analytics/overview", { token: accessToken ?? "", orgId: currentOrg?.id }),
    enabled: !!accessToken && !!currentOrg,
  });

  const stats = [
    { label: "Contacts", value: overview?.total_contacts ?? 0, icon: Users, color: "#5B6BF5" },
    { label: "Leads", value: overview?.total_leads ?? 0, icon: TrendingUp, color: "#10B981" },
    { label: "Factures", value: overview?.total_invoices ?? 0, icon: FileText, color: "#F59E0B" },
    { label: "CA (payé)", value: `${(overview?.total_revenue ?? 0).toLocaleString("fr-FR")} €`, icon: BarChart2, color: "#06B6D4" },
    { label: "Produits", value: overview?.total_products ?? 0, icon: Package, color: "#6366F1" },
    { label: "Employés", value: overview?.total_employees ?? 0, icon: Briefcase, color: "#EC4899" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d&apos;ensemble de{" "}
          <span className="font-semibold text-foreground">{currentOrg?.name ?? "votre organisation"}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${color}15` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Modules grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Modules ERP
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {modules.map(({ label, href, icon: Icon, color, description }) => (
            <a key={href} href={href}
              className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="font-semibold text-foreground text-sm">{label}</p>
              <p className="text-muted-foreground text-xs mt-1">{description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
