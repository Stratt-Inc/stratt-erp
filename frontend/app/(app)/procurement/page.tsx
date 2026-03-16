"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { ShoppingCart, Plus } from "lucide-react";

interface PurchaseOrder {
  id: string;
  number: string;
  status: string;
  order_date: string;
  delivery_date: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "#6B7280" },
  sent: { label: "Envoyée", color: "#5C93FF" },
  received: { label: "Reçue", color: "#10B981" },
  cancelled: { label: "Annulée", color: "#EF4444" },
};

export default function ProcurementPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: orders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["procurement", "orders", currentOrg?.id],
    queryFn: () => api.get("/api/v1/procurement/purchase-orders", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const totalOrdered = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const received = orders.filter(o => o.status === "received").length;
  const pending = orders.filter(o => o.status === "sent").length;

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
              <ShoppingCart className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Achats</h1>
          </div>
          <p className="text-sm text-muted-foreground">Commandes fournisseurs et gestion des approvisionnements</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}>
            <Plus className="w-4 h-4" /> Nouvelle commande
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total commandes", value: orders.length, color: "#8B5CF6" },
          { label: "Volume achats", value: `${totalOrdered.toLocaleString("fr-FR")} €`, color: "#10B981" },
          { label: "En attente", value: pending, color: "#5C93FF" },
          { label: "Reçues", value: received, color: "#06B6D4" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-foreground">Aucune commande</p>
          <p className="text-sm text-muted-foreground mt-1">Créez votre première commande fournisseur.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numéro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Livraison prévue</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total HT</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => {
                const cfg = statusConfig[o.status] ?? statusConfig.draft;
                return (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">{o.number}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: `${cfg.color}14`, color: cfg.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{o.order_date}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{o.delivery_date || "—"}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">{o.subtotal.toLocaleString("fr-FR")} €</td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-bold text-foreground">{o.total.toLocaleString("fr-FR")} €</td>
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
