"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoAction } from "@/store/toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line,
} from "recharts";
import {
  CalendarRange, Plus, Filter, Search, ChevronRight, AlertTriangle,
  Clock, FileText, LayoutList, Calendar, TrendingUp, Users, Layers, Scale, Zap,
  ChevronLeft, Bell,
} from "lucide-react";

interface Marche {
  id: string;
  reference: string;
  objet: string;
  service: string;
  montant: number;
  procedure: string;
  echeance: string;
  statut: string;
  priorite: string;
  charge: number;
  notes: string;
  date_lancement: string | null;
  date_attribution: string | null;
  date_fin: string | null;
}

interface MarcheStats {
  total: number;
  en_cours: number;
  alertes: number;
  budget_total: number;
  charge_total: number;
}

interface CalendarResponse {
  year: number;
  month: number;
  marches: Marche[];
}

interface AlertesResponse {
  days: number;
  horizon: string;
  marches: Marche[];
}

const chargeData = [
  { mois: "Jan", charge: 35, capacite: 50 }, { mois: "Fév", charge: 42, capacite: 50 },
  { mois: "Mar", charge: 58, capacite: 50 }, { mois: "Avr", charge: 45, capacite: 50 },
  { mois: "Mai", charge: 52, capacite: 50 }, { mois: "Jun", charge: 68, capacite: 50 },
  { mois: "Jul", charge: 30, capacite: 50 }, { mois: "Aoû", charge: 18, capacite: 50 },
  { mois: "Sep", charge: 48, capacite: 50 }, { mois: "Oct", charge: 40, capacite: 50 },
  { mois: "Nov", charge: 32, capacite: 50 }, { mois: "Déc", charge: 22, capacite: 50 },
];

const pluriannuelData = [
  { annee: "2024", marches: 128, montant: 72.1 }, { annee: "2025", marches: 135, montant: 78.4 },
  { annee: "2026", marches: 147, montant: 84.2 }, { annee: "2027 (P)", marches: 155, montant: 89.0 },
  { annee: "2028 (P)", marches: 162, montant: 94.5 },
];

const statutColors: Record<string, { bg: string; text: string; border: string }> = {
  planifie:  { bg: "rgba(107,114,128,0.08)", text: "hsl(var(--foreground) / 0.48)",  border: "rgba(107,114,128,0.2)" },
  en_cours:  { bg: "hsl(var(--primary) / 0.1)",  text: "hsl(var(--primary))",         border: "hsl(var(--primary) / 0.2)" },
  alerte:    { bg: "hsl(var(--destructive) / 0.08)",   text: "hsl(var(--destructive))",         border: "hsl(var(--destructive) / 0.2)" },
  termine:   { bg: "rgba(107,114,128,0.08)", text: "hsl(var(--foreground) / 0.48)", border: "rgba(107,114,128,0.2)" },
};

const statutLabels: Record<string, string> = {
  planifie: "Planifié", en_cours: "En cours", alerte: "Alerte", termine: "Terminé",
};

const prioriteColors: Record<string, { bg: string; text: string }> = {
  normale:   { bg: "rgba(107,114,128,0.1)", text: "hsl(var(--foreground) / 0.48)" },
  haute:     { bg: "hsl(var(--warning) / 0.1)",  text: "hsl(var(--warning))" },
  critique:  { bg: "hsl(var(--destructive) / 0.1)",   text: "hsl(var(--destructive))" },
};

// Color palette for calendar event bars
const EVENT_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--violet))", "hsl(var(--accent))", "#F97316", "hsl(var(--primary))"];

const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAY_NAMES = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  // Returns 0=Mon ... 6=Sun
  const d = new Date(year, month - 1, 1).getDay();
  return (d + 6) % 7;
}

const FILTERS = ["Service", "Procédure", "Montant", "Année"];

export default function PlanificationPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"tableau" | "calendrier">("tableau");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const demo = useDemoAction();

  const { data: marches = [], isLoading } = useQuery<Marche[]>({
    queryKey: ["marches", currentOrg?.id],
    queryFn: () => api.get("/api/v1/marches", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: stats } = useQuery<MarcheStats>({
    queryKey: ["marches", "stats", currentOrg?.id],
    queryFn: () => api.get("/api/v1/marches/stats", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: calData } = useQuery<CalendarResponse>({
    queryKey: ["marches", "calendar", currentOrg?.id, calYear, calMonth],
    queryFn: () => api.get(`/api/v1/marches/calendar?year=${calYear}&month=${calMonth}`, opts),
    enabled: !!accessToken && !!currentOrg && view === "calendrier",
  });

  const { data: alertesData } = useQuery<AlertesResponse>({
    queryKey: ["marches", "alertes", currentOrg?.id],
    queryFn: () => api.get("/api/v1/marches/alertes?days=30", opts),
    enabled: !!accessToken && !!currentOrg && view === "calendrier",
  });

  const filtered = marches.filter((m) =>
    !search || m.objet.toLowerCase().includes(search.toLowerCase()) ||
    m.reference.toLowerCase().includes(search.toLowerCase()) ||
    m.service.toLowerCase().includes(search.toLowerCase())
  );

  const selected = marches.find((m) => m.id === selectedId) ?? null;
  const budgetK = Math.round((stats?.budget_total ?? 0) / 1000);

  // Navigate calendar
  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Build calendar grid
  const totalDays = daysInMonth(calYear, calMonth);
  const firstDay = firstDayOfMonth(calYear, calMonth);
  const calMarchesWithColor = (calData?.marches ?? []).map((m, i) => ({
    ...m,
    color: EVENT_COLORS[i % EVENT_COLORS.length],
  }));

  function getMarcheEventForDay(day: number, marche: typeof calMarchesWithColor[0]) {
    const date = new Date(calYear, calMonth - 1, day);
    const launch = marche.date_lancement ? new Date(marche.date_lancement) : null;
    const fin = marche.date_fin ? new Date(marche.date_fin) : null;
    const attr = marche.date_attribution ? new Date(marche.date_attribution) : null;

    // Show if day falls on launch date (start of bar)
    if (launch) {
      const launchDate = new Date(launch.getFullYear(), launch.getMonth(), launch.getDate());
      const thisDate = new Date(calYear, calMonth - 1, day);
      if (launchDate.getTime() === thisDate.getTime()) return "start";
      // Show if day is within lancement→fin range
      const endDate = fin ? new Date(fin.getFullYear(), fin.getMonth(), fin.getDate()) : null;
      if (endDate && thisDate > launchDate && thisDate <= endDate) return "middle";
      if (!endDate && thisDate > launchDate) return null;
    }
    if (attr) {
      const attrDate = new Date(attr.getFullYear(), attr.getMonth(), attr.getDate());
      const thisDate = new Date(calYear, calMonth - 1, day);
      if (attrDate.getTime() === thisDate.getTime()) return "attribution";
    }
    return null;
  }

  function getDayMarchesEvents(day: number) {
    return calMarchesWithColor
      .map(m => ({ m, type: getMarcheEventForDay(day, m) }))
      .filter(({ type }) => type !== null);
  }

  return (
    <div className="space-y-3">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-start justify-between pb-3" style={{ borderBottom: "1px solid hsl(var(--primary) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 6px hsl(var(--primary))" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Module planification</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Passations de marchés</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">
            {stats?.total ?? 0} marchés · {budgetK} k€ prévisionnels · Exercice 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={demo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filtres avancés
          </button>
          <button onClick={demo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-3.5 h-3.5" /> Nouveau marché
          </button>
        </div>
      </div>

      {/* KPIs — signal tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {[
          { label: "Marchés en cours", value: stats?.en_cours ?? 0, icon: CalendarRange, color: "hsl(var(--primary))" },
          { label: "Charge prévi.", value: `${stats?.charge_total ?? 0} j/h`, icon: Users, color: "hsl(var(--accent))" },
          { label: "Chevauchements", value: "3", icon: Layers, color: "hsl(var(--violet))" },
          { label: "Budget impact", value: `${budgetK} k€`, icon: TrendingUp, color: "hsl(var(--accent))" },
          { label: "Alertes seuils", value: stats?.alertes ?? 0, icon: AlertTriangle, color: "hsl(var(--warning))" },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-tile" style={{ "--tile-color": kpi.color } as React.CSSProperties}>
            <p className="stat-number">{kpi.value}</p>
            <p className="stat-label">{kpi.label}</p>
            <kpi.icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">Charge prévisionnelle par mois (j/homme)</h2>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chargeData} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="charge" name="Charge" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} maxBarSize={14} />
                <Bar dataKey="capacite" name="Capacité" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Surcharge détectée en mars et juin — risque de retard sur les passations
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">Vision pluriannuelle 2024–2028</h2>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pluriannuelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="annee" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={30} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line yAxisId="left" dataKey="marches" name="Nb marchés" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" dataKey="montant" name="Montant (M€)" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-1.5 justify-center">
            {[{ label: "Nb marchés", color: "hsl(var(--primary))" }, { label: "Montant (M€)", color: "hsl(var(--accent))" }].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2 h-0.5 rounded" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Filters + View toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par objet, référence, service…"
            className="w-full pl-9 pr-3 py-1.5 text-[12px] h-8 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1.5 ml-auto">
          {FILTERS.map((f) => (
            <button key={f} onClick={demo} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors h-7">
              {f} <ChevronRight className="w-3 h-3 rotate-90" />
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg">
          {(["tableau", "calendrier"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors h-7 ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {v === "tableau" ? <LayoutList className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {v === "tableau" ? "Tableau" : "Calendrier"}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLEAU VIEW ── */}
      {view === "tableau" && (
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : (
              <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-450px)]">
                <table className="w-full">
                  <thead className="data-table-head">
                    <tr>
                      {["Réf.", "Objet du marché", "Service", "Montant", "Procédure", "Échéance", "Charge (j)", "Statut", ""].map((h) => (
                        <th key={h} className="data-th px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="data-table-body">
                    {filtered.map((m) => {
                      const s = statutColors[m.statut] ?? statutColors.planifie;
                      const isSelected = selectedId === m.id;
                      return (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedId(isSelected ? null : m.id)}
                          className="cursor-pointer data-row"
                          style={isSelected ? { background: "hsl(var(--primary) / 0.06)" } : undefined}
                        >
                          <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{m.reference}</td>
                          <td className="px-3 py-2 text-[13px] font-medium text-foreground max-w-[200px] truncate">{m.objet}</td>
                          <td className="px-3 py-2 text-[11px] text-muted-foreground">{m.service}</td>
                          <td className="px-3 py-2 num text-[15px] text-foreground">{m.montant.toLocaleString("fr-FR")} €</td>
                          <td className="px-3 py-2 text-[11px] text-foreground">{m.procedure}</td>
                          <td className="px-3 py-2 text-[11px] text-muted-foreground tabular-nums">{m.echeance}</td>
                          <td className="px-3 py-2 text-[11px] tabular-nums text-foreground">{m.charge}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                              style={{ background: s.bg, color: s.text, borderColor: s.border }}>
                              {statutLabels[m.statut] ?? m.statut}
                            </span>
                          </td>
                          <td className="px-3 py-2"><ChevronRight className="w-3 h-3 text-muted-foreground" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail side panel */}
          {selected && (
            <div className="w-72 flex-shrink-0 bg-card border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">{selected.reference}</span>
                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                  style={{ background: (statutColors[selected.statut] ?? statutColors.planifie).bg, color: (statutColors[selected.statut] ?? statutColors.planifie).text, borderColor: (statutColors[selected.statut] ?? statutColors.planifie).border }}>
                  {statutLabels[selected.statut] ?? selected.statut}
                </span>
              </div>
              <h3 className="text-[13px] font-semibold leading-snug text-foreground">{selected.objet}</h3>
              <div className="space-y-1.5 text-[12px]">
                {[
                  ["Service", selected.service],
                  ["Montant", `${selected.montant.toLocaleString("fr-FR")} €`],
                  ["Procédure", selected.procedure],
                  ["Échéance", selected.echeance],
                  ["Charge", `${selected.charge} j/homme`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
                {selected.date_lancement && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lancement</span>
                    <span className="font-medium text-foreground">{new Date(selected.date_lancement).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}
                {selected.date_attribution && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attribution</span>
                    <span className="font-medium text-foreground">{new Date(selected.date_attribution).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}
                {selected.date_fin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin prévue</span>
                    <span className="font-medium text-foreground">{new Date(selected.date_fin).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priorité</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: (prioriteColors[selected.priorite] ?? prioriteColors.normale).bg, color: (prioriteColors[selected.priorite] ?? prioriteColors.normale).text }}>
                    {selected.priorite}
                  </span>
                </div>
              </div>
              <div className="border-t border-border" />
              <div className="space-y-1.5">
                {[
                  { icon: FileText, label: "Créer un scénario" },
                  { icon: Clock, label: "Simuler les délais" },
                  { icon: Scale, label: "Vérifier les seuils" },
                  { icon: Zap, label: "Simulation budgétaire" },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} onClick={demo} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border text-foreground hover:bg-muted/50 transition-colors h-7">
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                ))}
              </div>
              {selected.statut === "alerte" && (
                <div className="p-2.5 rounded-lg border text-[11px] flex items-start gap-2"
                  style={{ background: "hsl(var(--destructive) / 0.05)", borderColor: "hsl(var(--destructive) / 0.2)" }}>
                  <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-500 leading-snug">Montant dépasse le seuil MAPA 90k€. Procédure formalisée requise (art. L2124-1 CCP).</span>
                </div>
              )}
              {selected.notes && (
                <p className="text-[11px] text-muted-foreground italic">{selected.notes}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === "calendrier" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Calendar grid */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-3">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <h2 className="text-[14px] font-semibold text-foreground">
                  {MONTH_NAMES[calMonth - 1]} {calYear}
                </h2>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-muted/30 min-h-[44px]" />
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1;
                  const events = getDayMarchesEvents(day);
                  const isToday = calYear === new Date().getFullYear() && calMonth === (new Date().getMonth() + 1) && day === new Date().getDate();
                  return (
                    <div key={day} className="bg-card min-h-[44px] p-1 relative">
                      <span className={`text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "text-white" : "text-foreground"}`}
                        style={isToday ? { background: "hsl(var(--primary))" } : undefined}>
                        {day}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {events.slice(0, 3).map(({ m, type }) => (
                          <div
                            key={m.id}
                            title={`${m.reference} — ${m.objet}${type === "attribution" ? " (attribution)" : ""}`}
                            className="h-1 rounded-full"
                            style={{ background: m.color, opacity: type === "attribution" ? 1 : 0.7 }}
                          />
                        ))}
                        {events.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{events.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              {calMarchesWithColor.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {calMarchesWithColor.map((m) => (
                    <div key={m.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                      <span className="truncate max-w-[120px]">{m.reference}</span>
                    </div>
                  ))}
                </div>
              )}

              {calMarchesWithColor.length === 0 && (
                <p className="text-center text-[12px] text-muted-foreground mt-3">Aucun marché avec dates pour ce mois.</p>
              )}
            </div>

            {/* Alertes panel */}
            <div className="bg-card border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h2 className="text-[13px] font-semibold text-foreground">Échéances à venir (30j)</h2>
              </div>

              {(alertesData?.marches ?? []).length === 0 ? (
                <p className="text-[12px] text-muted-foreground">Aucune échéance dans les 30 prochains jours.</p>
              ) : (
                <div className="space-y-1.5">
                  {(alertesData?.marches ?? []).map((m) => {
                    const s = statutColors[m.statut] ?? statutColors.planifie;
                    const nearestDate = m.date_attribution ?? m.date_fin;
                    const daysLeft = nearestDate
                      ? Math.ceil((new Date(nearestDate).getTime() - Date.now()) / 86400000)
                      : null;
                    return (
                      <div key={m.id} className="p-2 rounded-lg border border-border bg-muted/20 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[12px] font-medium text-foreground leading-snug line-clamp-2">{m.objet}</span>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{m.reference}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                            style={{ background: s.bg, color: s.text, borderColor: s.border }}>
                            {statutLabels[m.statut] ?? m.statut}
                          </span>
                          {daysLeft !== null && (
                            <span className={`text-[10px] font-semibold ${daysLeft <= 7 ? "text-red-500" : daysLeft <= 14 ? "text-amber-500" : "text-muted-foreground"}`}>
                              J{daysLeft > 0 ? `-${daysLeft}` : daysLeft === 0 ? " aujourd'hui" : `+${Math.abs(daysLeft)}`}
                            </span>
                          )}
                        </div>
                        {m.date_attribution && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Attribution : {new Date(m.date_attribution).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                        {m.date_fin && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarRange className="w-2.5 h-2.5" />
                            Fin : {new Date(m.date_fin).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Gantt-style timeline */}
          {calMarchesWithColor.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-3">
              <h2 className="text-[13px] font-semibold text-foreground mb-2 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-muted-foreground" />
                Chronologie des passations — {MONTH_NAMES[calMonth - 1]} {calYear}
              </h2>
              <div className="space-y-1.5">
                {calMarchesWithColor.map((m) => {
                  const launch = m.date_lancement ? new Date(m.date_lancement) : null;
                  const fin = m.date_fin ? new Date(m.date_fin) : null;

                  // Compute bar position within the month (0–100%)
                  const monthStart = new Date(calYear, calMonth - 1, 1).getTime();
                  const monthEnd = new Date(calYear, calMonth, 0, 23, 59, 59).getTime();
                  const monthDuration = monthEnd - monthStart;

                  const barStart = launch
                    ? Math.max(0, (launch.getTime() - monthStart) / monthDuration * 100)
                    : 0;
                  const barEnd = fin
                    ? Math.min(100, (fin.getTime() - monthStart) / monthDuration * 100)
                    : launch ? barStart + 5 : 100;
                  const barWidth = Math.max(1, barEnd - barStart);

                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="w-32 flex-shrink-0">
                        <span className="font-mono text-[10px] text-muted-foreground">{m.reference}</span>
                      </div>
                      <div className="flex-1 relative h-5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 h-full rounded-full flex items-center px-2"
                          style={{ left: `${barStart}%`, width: `${barWidth}%`, background: m.color, opacity: 0.8 }}
                        >
                          {barWidth > 15 && (
                            <span className="text-[9px] text-white font-medium truncate">{m.objet}</span>
                          )}
                        </div>
                        {m.date_attribution && (() => {
                          const attrPos = (new Date(m.date_attribution).getTime() - monthStart) / monthDuration * 100;
                          if (attrPos >= 0 && attrPos <= 100) {
                            return (
                              <div
                                className="absolute top-0 bottom-0 w-0.5"
                                style={{ left: `${attrPos}%`, background: "hsl(var(--warning))" }}
                                title={`Attribution: ${new Date(m.date_attribution).toLocaleDateString("fr-FR")}`}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="w-16 flex-shrink-0 text-[10px] text-muted-foreground text-right">
                        {m.montant > 0 ? `${Math.round(m.montant / 1000)}k€` : "—"}
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-32 flex-shrink-0" />
                  <div className="flex-1 flex justify-between text-[9px] text-muted-foreground">
                    <span>1</span>
                    <span>{Math.ceil(totalDays / 4)}</span>
                    <span>{Math.ceil(totalDays / 2)}</span>
                    <span>{Math.ceil(totalDays * 3 / 4)}</span>
                    <span>{totalDays}</span>
                  </div>
                  <div className="w-16 flex-shrink-0" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded-full bg-amber-400" /> Date attribution</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
