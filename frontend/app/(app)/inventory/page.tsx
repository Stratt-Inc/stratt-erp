"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { Package, Plus, AlertTriangle } from "lucide-react";
import { MODULE } from "@/lib/colors";

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
    <div className="space-y-3">
      <DemoBanner />

      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid hsl(var(--violet) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.inventory, boxShadow: `0 0 6px ${MODULE.inventory}` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Module Inventaire</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Stocks & Produits</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Produits, stocks et gestion des références</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-4 h-4" /> Nouveau produit
          </button>
        )}
      </div>

      {/* Stats — signal tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Produits actifs", value: products.filter((p) => p.is_active).length, icon: Package, color: MODULE.inventory },
          { label: "Valeur stock", value: `${totalValue.toLocaleString("fr-FR")} €`, icon: Package, color: "hsl(var(--accent))" },
          { label: "Stock faible", value: lowStock.length, icon: AlertTriangle, color: lowStock.length > 0 ? "hsl(var(--destructive))" : "#6B7280" },
          { label: "Catégories", value: new Set(products.map(p => p.category)).size, icon: Package, color: "hsl(var(--primary))" },
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
        <div className="flex items-start gap-3 p-3 rounded-xl"
          style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
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
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
          <Package className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="font-semibold text-foreground">Aucun produit</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez vos premiers produits.</p>
        </div>
      ) : (
        <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-310px)]">
          <table className="w-full">
            <thead className="data-table-head">
              <tr>
                <th className="data-th">Produit</th>
                <th className="data-th hidden md:table-cell">SKU</th>
                <th className="data-th hidden lg:table-cell">Catégorie</th>
                <th className="data-th data-th-r">Stock</th>
                <th className="data-th data-th-r hidden md:table-cell">Prix vente</th>
                <th className="data-th">Statut</th>
              </tr>
            </thead>
            <tbody className="data-table-body">
              {products.map((p) => {
                const isLow = p.stock <= p.reorder_at && p.reorder_at > 0;
                return (
                  <tr key={p.id} className="data-row">
                    <td className="px-4 py-2">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{p.description}</p>}
                    </td>
                    <td className="px-4 py-2 text-sm font-mono text-muted-foreground hidden md:table-cell">{p.sku || "—"}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground hidden lg:table-cell">{p.category || "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="num text-[16px] font-semibold" style={{ color: isLow ? "hsl(var(--destructive))" : "hsl(var(--accent))" }}>
                        {p.stock} {p.unit}
                      </span>
                      {isLow && <span className="ml-1 text-[10px] text-red-500">⚠</span>}
                    </td>
                    <td className="px-4 py-2 text-right num text-[15px] text-foreground hidden md:table-cell">
                      {p.unit_price.toLocaleString("fr-FR")} €
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: p.is_active ? "hsl(var(--accent) / 0.1)" : "rgba(107,114,128,0.1)", color: p.is_active ? "hsl(var(--accent))" : "#6B7280" }}>
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
