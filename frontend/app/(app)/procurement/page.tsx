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
    <div className="space-y-3">
      <DemoBanner />

      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(6,182,212,0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#06B6D4", boxShadow: "0 0 6px #06B6D4" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Module achats</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Achats & Commandes</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Bons de commande et gestion des fournisseurs</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}>
            <Plus className="w-4 h-4" /> Nouvelle commande
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Total commandes", value: orders.length, color: "#8B5CF6", icon: ShoppingCart },
          { label: "Volume achats", value: `${totalOrdered.toLocaleString("fr-FR")} €`, color: "#10B981", icon: ShoppingCart },
          { label: "En attente", value: pending, color: "#5C93FF", icon: ShoppingCart },
          { label: "Reçues", value: received, color: "#06B6D4", icon: ShoppingCart },
        ].map(({ label, value, color, icon: Icon }) => (
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
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
          <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="font-semibold text-foreground">Aucune commande</p>
          <p className="text-sm text-muted-foreground mt-1">Créez votre première commande fournisseur.</p>
        </div>
      ) : (
        <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-280px)]">
          <table className="w-full">
            <thead className="data-table-head">
              <tr>
                <th className="data-th">Numéro</th>
                <th className="data-th">Statut</th>
                <th className="data-th hidden md:table-cell">Date</th>
                <th className="data-th hidden lg:table-cell">Livraison prévue</th>
                <th className="data-th data-th-r">Total HT</th>
                <th className="data-th data-th-r">Total TTC</th>
              </tr>
            </thead>
            <tbody className="data-table-body">
              {orders.map((o) => {
                const cfg = statusConfig[o.status] ?? statusConfig.draft;
                return (
                  <tr key={o.id} className="data-row">
                    <td className="px-4 py-2 text-sm font-mono font-semibold text-foreground">{o.number}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: `${cfg.color}14`, color: cfg.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">{o.order_date}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground hidden lg:table-cell">{o.delivery_date || "—"}</td>
                    <td className="px-4 py-2 text-right text-sm num text-muted-foreground">{o.subtotal.toLocaleString("fr-FR")} €</td>
                    <td className="px-4 py-2 text-right text-sm num font-bold text-foreground">{o.total.toLocaleString("fr-FR")} €</td>
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
