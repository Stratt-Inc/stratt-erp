"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { FileText, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { MODULE } from "@/lib/colors";

interface Invoice {
  id: string;
  number: string;
  status: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = {
  draft: { label: "Brouillon", color: "#6B7280", bg: "rgba(107,114,128,0.08)", icon: FileText },
  sent: { label: "Envoyée", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.08)", icon: Clock },
  paid: { label: "Payée", color: "hsl(var(--accent))", bg: "hsl(var(--accent) / 0.08)", icon: CheckCircle2 },
  overdue: { label: "En retard", color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.08)", icon: AlertCircle },
  cancelled: { label: "Annulée", color: "#9CA3AF", bg: "rgba(156,163,175,0.08)", icon: FileText },
};

export default function BillingPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["billing", "invoices", currentOrg?.id],
    queryFn: () => api.get("/api/v1/billing/invoices", opts),
    enabled: !!accessToken && !!currentOrg,
  });
  const paid = invoices.filter((i) => i.status === "paid");
  const pending = invoices.filter((i) => i.status === "sent");
  const overdue = invoices.filter((i) => i.status === "overdue");
  const totalRevenue = paid.reduce((s, i) => s + i.total, 0);
  const totalPending = pending.reduce((s, i) => s + i.total, 0);

  const stats = [
    { label: "Total factures", value: invoices.length, color: MODULE.billing, icon: FileText },
    { label: "CA encaissé", value: `${totalRevenue.toLocaleString("fr-FR")} €`, color: "hsl(var(--accent))", icon: FileText },
    { label: "En attente", value: `${totalPending.toLocaleString("fr-FR")} €`, color: "hsl(var(--warning))", icon: FileText },
    { label: "En retard", value: overdue.length, color: "hsl(var(--destructive))", icon: FileText },
  ];

  return (
    <div className="space-y-3">
      <DemoBanner />

      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid hsl(var(--success) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.billing, boxShadow: `0 0 6px ${MODULE.billing}` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Module facturation</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Facturation</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Devis, factures et suivi des paiements</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-4 h-4" /> Nouvelle facture
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stats.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-280px)]">
          <table className="w-full">
            <thead className="data-table-head">
              <tr>
                <th className="data-th">Numéro</th>
                <th className="data-th">Statut</th>
                <th className="data-th hidden md:table-cell">Émission</th>
                <th className="data-th hidden lg:table-cell">Échéance</th>
                <th className="data-th data-th-r">Total HT</th>
                <th className="data-th data-th-r">Total TTC</th>
              </tr>
            </thead>
            <tbody className="data-table-body">
              {invoices.map((inv) => {
                const cfg = statusConfig[inv.status] ?? statusConfig.draft;
                const Icon = cfg.icon;
                return (
                  <tr key={inv.id} className="data-row">
                    <td className="px-4 py-2 text-sm font-mono font-semibold text-foreground">{inv.number}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">{inv.issue_date}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground hidden lg:table-cell">{inv.due_date || "—"}</td>
                    <td className="px-4 py-2 text-right text-sm num text-muted-foreground">{inv.subtotal.toLocaleString("fr-FR")} €</td>
                    <td className="px-4 py-2 text-right text-sm num font-bold text-foreground">{inv.total.toLocaleString("fr-FR")} €</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
      <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
      <p className="font-semibold text-foreground">Aucune facture</p>
      <p className="text-sm text-muted-foreground mt-1">Créez votre première facture pour commencer.</p>
    </div>
  );
}
