"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { Calculator, Plus, TrendingUp, TrendingDown } from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  reference: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  account_id: string;
}

const typeColors: Record<string, string> = {
  asset: "#5C93FF", liability: "#EF4444", equity: "#24DDB8",
  revenue: "#10B981", expense: "#F59E0B",
};
const typeLabels: Record<string, string> = {
  asset: "Actif", liability: "Passif", equity: "Capitaux propres",
  revenue: "Recettes", expense: "Dépenses",
};

type Tab = "accounts" | "transactions";

export default function AccountingPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const [tab, setTab] = useState<Tab>("accounts");
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: accs = [], isLoading: loadingA } = useQuery<Account[]>({
    queryKey: ["accounting", "accounts", currentOrg?.id],
    queryFn: () => api.get("/api/v1/accounting/accounts", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: txns = [], isLoading: loadingT } = useQuery<Transaction[]>({
    queryKey: ["accounting", "transactions", currentOrg?.id],
    queryFn: () => api.get("/api/v1/accounting/transactions", opts),
    enabled: !!accessToken && !!currentOrg,
  });
  const totalCredits = txns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits = txns.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-3">
      <DemoBanner />

      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(16,185,129,0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Module comptabilité</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Plan comptable</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Comptes, transactions et rapports financiers</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#5C93FF" }}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>

      {/* Stats — signal tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Comptes actifs", value: accs.filter(a => a.is_active).length, icon: Calculator, color: "#5C93FF" },
          { label: "Transactions", value: txns.length, icon: Calculator, color: "#6B7280" },
          { label: "Total crédits", value: `${totalCredits.toLocaleString("fr-FR")} €`, icon: Calculator, color: "#10B981" },
          { label: "Total débits", value: `${totalDebits.toLocaleString("fr-FR")} €`, icon: Calculator, color: "#EF4444" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-1">
        {(["accounts", "transactions"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t === "accounts" ? "Plan comptable" : "Transactions"}
          </button>
        ))}
      </div>

      {(loadingA || loadingT) ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : tab === "accounts" ? (
        <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-320px)]">
          <table className="w-full">
            <thead className="data-table-head">
              <tr>
                <th className="data-th">Code</th>
                <th className="data-th">Compte</th>
                <th className="data-th">Type</th>
                <th className="data-th data-th-r">Solde</th>
              </tr>
            </thead>
            <tbody className="data-table-body">
              {accs.map((a) => (
                <tr key={a.id} className="data-row">
                  <td className="px-4 py-2 text-sm font-mono font-semibold text-foreground">{a.code}</td>
                  <td className="px-4 py-2 text-sm text-foreground">{a.name}</td>
                  <td className="px-4 py-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${typeColors[a.type] ?? "#6B7280"}14`, color: typeColors[a.type] ?? "#6B7280" }}>
                      {typeLabels[a.type] ?? a.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-sm num font-bold"
                    style={{ color: a.balance >= 0 ? "#10B981" : "#EF4444" }}>
                    {a.balance.toLocaleString("fr-FR")} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-320px)]">
          <table className="w-full">
            <thead className="data-table-head">
              <tr>
                <th className="data-th">Date</th>
                <th className="data-th">Description</th>
                <th className="data-th hidden md:table-cell">Référence</th>
                <th className="data-th">Type</th>
                <th className="data-th data-th-r">Montant</th>
              </tr>
            </thead>
            <tbody className="data-table-body">
              {txns.map((t) => (
                <tr key={t.id} className="data-row">
                  <td className="px-4 py-2 text-sm text-muted-foreground font-mono">{t.date}</td>
                  <td className="px-4 py-2 text-sm text-foreground">{t.description}</td>
                  <td className="px-4 py-2 text-sm font-mono text-muted-foreground hidden md:table-cell">{t.reference || "—"}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: t.type === "credit" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: t.type === "credit" ? "#10B981" : "#EF4444" }}>
                      {t.type === "credit" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {t.type === "credit" ? "Crédit" : "Débit"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-sm num font-bold"
                    style={{ color: t.type === "credit" ? "#10B981" : "#EF4444" }}>
                    {t.type === "credit" ? "+" : "-"}{t.amount.toLocaleString("fr-FR")} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
