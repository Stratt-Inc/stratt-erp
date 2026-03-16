"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { FileText, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";

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

const statusConfig: Record<string, { label: string; color: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = {
  draft: { label: "Brouillon", color: "#6B7280", icon: FileText },
  sent: { label: "Envoyée", color: "#5C93FF", icon: Clock },
  paid: { label: "Payée", color: "#10B981", icon: CheckCircle2 },
  overdue: { label: "En retard", color: "#EF4444", icon: AlertCircle },
  cancelled: { label: "Annulée", color: "#9CA3AF", icon: FileText },
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
    { label: "Total factures", value: invoices.length, color: "#5C93FF" },
    { label: "CA encaissé", value: `${totalRevenue.toLocaleString("fr-FR")} €`, color: "#10B981" },
    { label: "En attente", value: `${totalPending.toLocaleString("fr-FR")} €`, color: "#F59E0B" },
    { label: "En retard", value: overdue.length, color: "#EF4444" },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
              <FileText className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
          </div>
          <p className="text-sm text-muted-foreground">Devis, factures et suivi des paiements</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}>
            <Plus className="w-4 h-4" /> Nouvelle facture
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className="text-2xl font-bold font-mono text-foreground" style={typeof value === "number" && label === "En retard" && value > 0 ? { color } : {}}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numéro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Émission</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Échéance</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total HT</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => {
                const cfg = statusConfig[inv.status] ?? statusConfig.draft;
                const Icon = cfg.icon;
                return (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">{inv.number}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: `${cfg.color}14`, color: cfg.color }}>
                        <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{inv.issue_date}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{inv.due_date || "—"}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">{inv.subtotal.toLocaleString("fr-FR")} €</td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-bold text-foreground">{inv.total.toLocaleString("fr-FR")} €</td>
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
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
      <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
      <p className="font-semibold text-foreground">Aucune facture</p>
      <p className="text-sm text-muted-foreground mt-1">Créez votre première facture pour commencer.</p>
    </div>
  );
}
