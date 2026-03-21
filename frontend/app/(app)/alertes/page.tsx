"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MODULE } from "@/lib/colors";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { Highlight } from "@/components/Highlight";
import {
  BellRing, AlertTriangle, Clock, CreditCard, FileText,
  Calendar, TrendingDown, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";

/* ── Types ── */
interface DelaiAlert {
  marche_id: string;
  reference: string;
  objet: string;
  service: string;
  montant: number;
  type: "echeance" | "attribution" | "fin" | "paiement";
  label: string;
  due_date: string;
  jours_rest: number;
  urgence: "critique" | "haute" | "moyenne" | "faible";
  interets_moratoires?: number;
}

interface AlertesDashboard {
  total_alertes: number;
  critiques: number;
  hautes: number;
  moyennes: number;
  alertes: DelaiAlert[];
}

/* ── Helpers ── */
function fmtEur(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} M€`;
  if (v >= 1_000)     return `${Math.round(v / 1_000)} k€`;
  return `${v.toFixed(2)} €`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function joursLabel(j: number) {
  if (j < 0) return `En retard de ${-j} jour${-j > 1 ? "s" : ""}`;
  if (j === 0) return "Aujourd'hui";
  return `Dans ${j} jour${j > 1 ? "s" : ""}`;
}

const URGENCE_CONFIG: Record<string, { bg: string; color: string; border: string; icon: typeof AlertTriangle }> = {
  critique: { bg: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))", border: "hsl(var(--destructive) / 0.2)", icon: AlertTriangle },
  haute:    { bg: "hsl(var(--warning) / 0.08)",     color: "hsl(var(--warning))",     border: "hsl(var(--warning) / 0.2)",     icon: Clock },
  moyenne:  { bg: "hsl(var(--accent) / 0.06)",      color: "hsl(var(--accent))",      border: "hsl(var(--accent) / 0.15)",     icon: Calendar },
  faible:   { bg: "rgba(107,114,128,0.06)",          color: "#6B7280",                 border: "rgba(107,114,128,0.12)",         icon: CheckCircle2 },
};

const TYPE_ICON: Record<string, typeof BellRing> = {
  attribution: FileText,
  fin:         Calendar,
  paiement:    CreditCard,
  echeance:    Clock,
};

const DAYS_OPTIONS = [
  { label: "30 jours", value: 30 },
  { label: "60 jours", value: 60 },
  { label: "90 jours", value: 90 },
  { label: "180 jours", value: 180 },
];

export default function AlertesPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const [days,         setDays]         = useState(60);
  const [filterUrgence, setFilterUrgence] = useState<string>("tous");
  const [filterType,    setFilterType]    = useState<string>("tous");
  const [expandedId,    setExpandedId]    = useState<string | null>(null);

  const { data, isLoading } = useQuery<AlertesDashboard>({
    queryKey: ["alertes-dashboard", currentOrg?.id, days],
    queryFn: () => api.get(`/api/v1/marches/alertes/dashboard?days=${days}`, opts),
    enabled: !!accessToken && !!currentOrg,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  const alertes = useMemo(() => {
    if (!data?.alertes) return [];
    return data.alertes.filter(a => {
      if (filterUrgence !== "tous" && a.urgence !== filterUrgence) return false;
      if (filterType    !== "tous" && a.type    !== filterType)    return false;
      return true;
    });
  }, [data, filterUrgence, filterType]);

  const totalInterets = useMemo(
    () => alertes.reduce((s, a) => s + (a.interets_moratoires ?? 0), 0),
    [alertes],
  );

  return (
    <div className="space-y-4">
      <DemoBanner />

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-6 pb-3" style={{ borderBottom: "1px solid hsl(var(--destructive) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.alertes, boxShadow: `0 0 6px ${MODULE.alertes}` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Suivi réglementaire</span>
          </div>
          <h1 className="text-[22px] leading-none font-extrabold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.025em" }}>
            Alertes{" "}
            <Highlight variant="mark" color="amber">délais</Highlight>
          </h1>
          <p className="text-[13px] mt-1 font-medium" style={{ color: "hsl(var(--foreground) / 0.4)" }}>
            Délais réglementaires CCP · Intérêts moratoires · Échéances contractuelles
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {DAYS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setDays(o.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                days === o.value
                  ? "text-white border-transparent"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              style={days === o.value ? { background: MODULE.alertes } : {}}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Alertes totales",     value: data?.total_alertes ?? "—",                    color: MODULE.alertes,                     icon: BellRing },
          { label: "Critiques",            value: data?.critiques ?? "—",                         color: "hsl(var(--destructive))",          icon: AlertTriangle },
          { label: "Hautes",               value: data?.hautes ?? "—",                            color: "hsl(var(--warning))",              icon: Clock },
          { label: "Intérêts moratoires", value: totalInterets > 0 ? fmtEur(totalInterets) : "—", color: "hsl(var(--destructive))",         icon: TrendingDown },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number-sm">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* ── Info box délai paiement ── */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 flex gap-3 items-start">
        <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
        <div>
          <p className="text-xs font-semibold text-foreground">Délai de paiement réglementaire — 30 jours (art. L2192-12 CCP)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            En cas de dépassement, des intérêts moratoires courent automatiquement au taux BCE + 8 points (+ 40 € forfaitaires).
            Taux appliqué : <strong>17,25 % / an</strong> (1er semestre 2026).
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtrer :</span>
        <div className="flex gap-1">
          {["tous", "critique", "haute", "moyenne", "faible"].map(u => (
            <button
              key={u}
              onClick={() => setFilterUrgence(u)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors capitalize ${
                filterUrgence === u ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"
              }`}
              style={filterUrgence === u ? { background: u === "tous" ? MODULE.alertes : (URGENCE_CONFIG[u]?.color ?? MODULE.alertes) } : {}}
            >
              {u}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex gap-1">
          {["tous", "paiement", "attribution", "fin", "echeance"].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors ${
                filterType === t ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"
              }`}
              style={filterType === t ? { background: MODULE.alertes } : {}}
            >
              {t === "tous" ? "Tous types" : t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Alertes list ── */}
      {isLoading && (
        <div className="text-xs text-muted-foreground py-8 text-center">Chargement des alertes…</div>
      )}

      {!isLoading && alertes.length === 0 && (
        <div className="bg-card rounded-xl border border-border px-6 py-12 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--accent))" }} />
          <p className="text-sm font-semibold text-foreground">Aucune alerte sur cet horizon</p>
          <p className="text-xs text-muted-foreground mt-1">Tous les délais réglementaires sont respectés pour les prochains {days} jours.</p>
        </div>
      )}

      <div className="space-y-2">
        {alertes.map((alert) => {
          const cfg = URGENCE_CONFIG[alert.urgence] ?? URGENCE_CONFIG.faible;
          const TypeIcon = TYPE_ICON[alert.type] ?? Clock;
          const isExpanded = expandedId === alert.marche_id + alert.type;

          return (
            <div
              key={alert.marche_id + alert.type}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: cfg.border, background: cfg.bg }}
            >
              <div
                className="px-4 py-3 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : alert.marche_id + alert.type)}
              >
                {/* Urgence badge */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: cfg.color + "20" }}>
                  <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">{alert.reference}</span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: cfg.color + "20", color: cfg.color }}
                    >
                      {alert.label}
                    </span>
                    <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.objet}</p>
                </div>

                {/* Due date */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: cfg.color }}>{joursLabel(alert.jours_rest)}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{fmtDate(alert.due_date)}</p>
                </div>

                {/* Expand icon */}
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-current/10 space-y-2" style={{ borderColor: cfg.border }}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{alert.service || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Montant HT</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{fmtEur(alert.montant)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Échéance</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: cfg.color }}>{fmtDate(alert.due_date)}</p>
                    </div>
                    {(alert.interets_moratoires ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Intérêts moratoires</p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: "hsl(var(--destructive))" }}>
                          {fmtEur(alert.interets_moratoires!)} (+ 40 € forfait)
                        </p>
                      </div>
                    )}
                  </div>
                  {alert.type === "paiement" && alert.jours_rest < 0 && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-[11px] text-muted-foreground">
                      ⚠ Ce marché présente un dépassement du délai de paiement de 30 jours (art. L2192-12 CCP).
                      Des intérêts moratoires courent depuis le {fmtDate(alert.due_date)}.
                      Régularisez le paiement dès que possible.
                    </div>
                  )}
                  {alert.type === "attribution" && alert.jours_rest < 0 && (
                    <div className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-[11px] text-muted-foreground">
                      ⚠ La date d&apos;attribution est dépassée. Assurez-vous que la notification du marché a bien été envoyée et que le marché est publié au BOAMP si le montant le requiert.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
