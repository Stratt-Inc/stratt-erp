"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { ShoppingCart, Plus, ShieldAlert, ShieldCheck, AlertTriangle, Info, Scale } from "lucide-react";
import { MODULE } from "@/lib/colors";

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
  sent: { label: "Envoyée", color: "hsl(var(--primary))" },
  received: { label: "Reçue", color: "hsl(var(--accent))" },
  cancelled: { label: "Annulée", color: "hsl(var(--destructive))" },
};

// ── CCP 2024 Thresholds ────────────────────────────────────────────────

const CCP_THRESHOLDS = [
  { max: 40_000, label: "Gré à gré", short: "GRÉ À GRÉ", color: "hsl(var(--accent))", bg: "hsl(var(--accent) / 0.08)", desc: "Commande directe sans mise en concurrence formelle obligatoire" },
  { max: 90_000, label: "MAPA simplifié", short: "MAPA", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.08)", desc: "Mise en concurrence adaptée — au moins 3 devis recommandés" },
  { max: 215_000, label: "MAPA publié", short: "MAPA+", color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.08)", desc: "Publication obligatoire sur le profil d'acheteur (art. L2124-1 CCP)" },
  { max: 5_538_000, label: "Appel d'offres", short: "AO", color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.08)", desc: "Procédure formalisée — publication BOAMP obligatoire" },
  { max: Infinity, label: "AO européen", short: "JOUE", color: "hsl(var(--violet))", bg: "hsl(var(--violet) / 0.08)", desc: "Publication JOUE (Journal Officiel de l'UE) obligatoire" },
];

function getThreshold(amount: number) {
  return CCP_THRESHOLDS.find((t) => amount < t.max) ?? CCP_THRESHOLDS[CCP_THRESHOLDS.length - 1];
}

// ── Demo compliance data ───────────────────────────────────────────────

const DEMO_SUPPLIERS = [
  {
    name: "Maintenance Équipements SA", family: "03.04 – Maintenance", cumul: 241_800, orders: 5,
    risk: "critical" as const, alerts: ["Seuil AO dépassé (+26 800 €)", "Publication BOAMP requise"],
  },
  {
    name: "Société Informatique du Nord", family: "02.01 – Fournitures informatiques", cumul: 187_400, orders: 4,
    risk: "high" as const, alerts: ["Seuil MAPA+ dépassé — AO requis", "Fractionnement potentiel détecté"],
  },
  {
    name: "Nettoyage Pro Services", family: "03.01 – Services de nettoyage", cumul: 94_200, orders: 3,
    risk: "medium" as const, alerts: ["Proche du seuil MAPA+ (215 000 €)"],
  },
  {
    name: "Formation Excellence", family: "04.02 – Services de formation", cumul: 67_300, orders: 2,
    risk: "low" as const, alerts: [],
  },
  {
    name: "Bureau Technique SARL", family: "01.02 – Fournitures de bureau", cumul: 38_600, orders: 6,
    risk: "low" as const, alerts: [],
  },
];

const DEMO_FRACTIONNEMENT = [
  {
    supplier: "Société Informatique du Nord", family: "02.01", score: 87,
    orders: ["BC-2026-0042 (48 500 €)", "BC-2026-0051 (43 200 €)", "BC-2026-0063 (47 800 €)"],
    period: "Jan – Mars 2026",
  },
  {
    supplier: "Bureau Technique SARL", family: "01.02", score: 34,
    orders: ["BC-2026-0011 (6 200 €)", "BC-2026-0018 (7 400 €)"],
    period: "Jan – Fév 2026",
  },
];

const RISK_CONFIG = {
  critical: { label: "Critique", color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.08)", icon: ShieldAlert },
  high: { label: "Élevé", color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.08)", icon: AlertTriangle },
  medium: { label: "Modéré", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.08)", icon: Info },
  low: { label: "Faible", color: "hsl(var(--accent))", bg: "hsl(var(--accent) / 0.08)", icon: ShieldCheck },
};

// ── ComplianceTab ──────────────────────────────────────────────────────

function ComplianceTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* CCP 2024 Scale */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <Scale className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
            Seuils CCP 2024 — Fournitures & Services
          </span>
        </div>
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
          {CCP_THRESHOLDS.filter((t) => t.max !== Infinity).map((t, i) => {
            const widths = [12, 15, 25, 35, 13]; // visual proportions
            return (
              <div key={t.short} className="flex items-center justify-center text-[9px] font-bold text-white rounded-sm flex-shrink-0"
                style={{ background: t.color, width: `${widths[i]}%`, opacity: 0.85 }}>
                {t.short}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {CCP_THRESHOLDS.filter((t) => t.max !== Infinity).map((t) => (
            <div key={t.short} className="rounded-lg px-3 py-2 space-y-0.5" style={{ background: t.bg, border: `1px solid ${t.color}22` }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold" style={{ color: t.color }}>{t.label}</span>
              </div>
              <p className="text-[11px] font-semibold text-foreground">
                {t.max === 40_000 ? "< 40 000 €" : t.max === 90_000 ? "40k – 90k €" : t.max === 215_000 ? "90k – 215k €" : "215k – 5,5M €"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier risk table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" style={{ color: "hsl(var(--destructive))" }} />
          <h2 className="text-sm font-semibold text-foreground">Contrôle automatique des seuils — cumul 12 mois glissants</h2>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}>
            {DEMO_SUPPLIERS.filter((s) => s.risk === "critical" || s.risk === "high").length} alertes
          </span>
        </div>
        <div className="divide-y divide-border">
          {DEMO_SUPPLIERS.map((s) => {
            const th = getThreshold(s.cumul);
            const rc = RISK_CONFIG[s.risk];
            const RiskIcon = rc.icon;
            const pctMax = Math.min((s.cumul / 300_000) * 100, 100);
            const isOpen = expanded === s.name;
            return (
              <div key={s.name}>
                <button
                  className="w-full data-row px-4 py-2.5 flex items-center gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : s.name)}
                >
                  <RiskIcon className="w-4 h-4 flex-shrink-0" style={{ color: rc.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: rc.bg, color: rc.color }}>
                        {rc.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{s.family} · {s.orders} commandes</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pctMax}%`, background: rc.color }} />
                      </div>
                      <span className="text-[11px] num font-bold text-foreground flex-shrink-0">
                        {s.cumul.toLocaleString("fr-FR")} €
                      </span>
                      <span className="text-[11px] font-semibold flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: th.bg, color: th.color }}>
                        {th.short}
                      </span>
                    </div>
                  </div>
                </button>
                {isOpen && s.alerts.length > 0 && (
                  <div className="px-4 pb-3 pt-1 space-y-1 bg-muted/20">
                    {s.alerts.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: rc.color }} />
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fractionnement */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: "hsl(var(--warning))" }} />
          <h2 className="text-sm font-semibold text-foreground">Détection du fractionnement illicite</h2>
        </div>
        <div className="divide-y divide-border">
          {DEMO_FRACTIONNEMENT.map((f) => (
            <div key={f.supplier} className="px-4 py-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                style={{ background: f.score >= 70 ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}>
                {f.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{f.supplier}</p>
                  <span className="text-[10px] text-muted-foreground">code {f.family}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-1">{f.period}</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.orders.map((o, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                      style={{ background: "hsl(var(--primary) / 0.07)", color: "hsl(var(--primary))" }}>
                      {o}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-muted-foreground">Score risque</p>
                <p className="text-lg font-extrabold" style={{ color: f.score >= 70 ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}>{f.score}<span className="text-xs font-normal">/100</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function ProcurementPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };
  const [tab, setTab] = useState<"commandes" | "conformite">("commandes");

  const { data: orders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["procurement", "orders", currentOrg?.id],
    queryFn: () => api.get("/api/v1/procurement/purchase-orders", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const totalOrdered = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const received = orders.filter(o => o.status === "received").length;
  const pending = orders.filter(o => o.status === "sent").length;
  const riskCount = DEMO_SUPPLIERS.filter((s) => s.risk === "critical" || s.risk === "high").length;

  return (
    <div className="space-y-3">
      <DemoBanner />

      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid hsl(var(--accent) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.procurement, boxShadow: `0 0 6px ${MODULE.procurement}` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Module achats</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Achats & Commandes</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Bons de commande · Conformité CCP 2024 · Détection fractionnement</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-4 h-4" /> Nouvelle commande
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Total commandes", value: orders.length, color: "hsl(var(--violet))", icon: ShoppingCart },
          { label: "Volume achats", value: `${totalOrdered.toLocaleString("fr-FR")} €`, color: MODULE.procurement, icon: ShoppingCart },
          { label: "En attente", value: pending, color: "hsl(var(--primary))", icon: ShoppingCart },
          { label: "Alertes conformité", value: riskCount, color: "hsl(var(--destructive))", icon: ShieldAlert },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/30 w-fit">
        {([
          { id: "commandes", label: "Commandes" },
          { id: "conformite", label: "Conformité CCP 2024" },
        ] as const).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={["px-4 py-1.5 rounded-md text-xs font-semibold transition-colors",
              tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}>
            {label}
            {id === "conformite" && riskCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
                style={{ background: "hsl(var(--destructive))" }}>{riskCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "conformite" && <ComplianceTab />}

      {tab === "commandes" && (
        isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
            <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="font-semibold text-foreground">Aucune commande</p>
            <p className="text-sm text-muted-foreground mt-1">Créez votre première commande fournisseur.</p>
          </div>
        ) : (
          <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-340px)]">
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
                  const th = getThreshold(o.total);
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
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: th.bg, color: th.color }}>{th.short}</span>
                          <span className="text-sm num font-bold text-foreground">{o.total.toLocaleString("fr-FR")} €</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
