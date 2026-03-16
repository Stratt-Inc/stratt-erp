"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { Package, Plus, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit_price: number;
  cost_price: number;
  stock: number;
  reorder_at: number;
  unit: string;
  is_active: boolean;
}

export default function InventoryPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["inventory", "products", currentOrg?.id],
    queryFn: () => api.get("/api/v1/inventory/products", opts),
    enabled: !!accessToken && !!currentOrg,
  });
  const lowStock = products.filter((p) => p.stock <= p.reorder_at && p.reorder_at > 0);
  const totalValue = products.reduce((s, p) => s + p.stock * p.cost_price, 0);

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex items-center justify-between pb-5" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#8B5CF6", boxShadow: "0 0 6px #8B5CF6" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Module Inventaire</span>
          </div>
          <h1 className="text-[26px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Stocks & Produits</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Produits, stocks et gestion des références</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}>
            <Plus className="w-4 h-4" /> Nouveau produit
          </button>
        )}
      </div>

      {/* Stats — signal tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Produits actifs", value: products.filter((p) => p.is_active).length, icon: Package, color: "#8B5CF6" },
          { label: "Valeur stock", value: `${totalValue.toLocaleString("fr-FR")} €`, icon: Package, color: "#10B981" },
          { label: "Stock faible", value: lowStock.length, icon: AlertTriangle, color: lowStock.length > 0 ? "#EF4444" : "#6B7280" },
          { label: "Catégories", value: new Set(products.map(p => p.category)).size, icon: Package, color: "#5C93FF" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#EF4444" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#FCA5A5" }}>
              {lowStock.length} produit{lowStock.length > 1 ? "s" : ""} en stock faible
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#F87171" }}>
              {lowStock.map(p => p.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
          <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-foreground">Aucun produit</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez vos premiers produits.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Catégorie</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Prix vente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const isLow = p.stock <= p.reorder_at && p.reorder_at > 0;
                return (
                  <tr key={p.id} className="data-row transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground hidden md:table-cell">{p.sku || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{p.category || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="num text-[16px] font-semibold" style={{ color: isLow ? "#EF4444" : "#10B981" }}>
                        {p.stock} {p.unit}
                      </span>
                      {isLow && <span className="ml-1 text-[10px] text-red-500">⚠</span>}
                    </td>
                    <td className="px-4 py-3 text-right num text-[15px] text-foreground hidden md:table-cell">
                      {p.unit_price.toLocaleString("fr-FR")} €
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: p.is_active ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)", color: p.is_active ? "#10B981" : "#6B7280" }}>
                        {p.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
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
