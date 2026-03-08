"use client";

import { useState, useRef } from "react";
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
}

interface MarcheStats {
  total: number;
  en_cours: number;
  alertes: number;
  budget_total: number;
  charge_total: number;
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
  planifie:  { bg: "rgba(107,114,128,0.08)", text: "hsl(220,9%,46%)",  border: "rgba(107,114,128,0.2)" },
  en_cours:  { bg: "rgba(91,107,245,0.08)",  text: "#5B6BF5",         border: "rgba(91,107,245,0.2)" },
  alerte:    { bg: "rgba(239,68,68,0.08)",   text: "#EF4444",         border: "rgba(239,68,68,0.2)" },
  termine:   { bg: "rgba(107,114,128,0.08)", text: "hsl(220,9%,46%)", border: "rgba(107,114,128,0.2)" },
};

const statutLabels: Record<string, string> = {
  planifie: "Planifié", en_cours: "En cours", alerte: "Alerte", termine: "Terminé",
};

const prioriteColors: Record<string, { bg: string; text: string }> = {
  normale:   { bg: "rgba(107,114,128,0.1)", text: "hsl(220,9%,46%)" },
  haute:     { bg: "rgba(245,158,11,0.1)",  text: "#F59E0B" },
  critique:  { bg: "rgba(239,68,68,0.1)",   text: "#EF4444" },
};

const FILTERS = ["Service", "Procédure", "Montant", "Année"];

export default function PlanificationPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"tableau" | "calendrier">("tableau");
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

  const filtered = marches.filter((m) =>
    !search || m.objet.toLowerCase().includes(search.toLowerCase()) ||
    m.reference.toLowerCase().includes(search.toLowerCase()) ||
    m.service.toLowerCase().includes(search.toLowerCase())
  );

  const selected = marches.find((m) => m.id === selectedId) ?? null;
  const budgetK = Math.round((stats?.budget_total ?? 0) / 1000);

  return (
    <div className="space-y-5">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">Module planification</p>
          <h1 className="text-2xl font-bold text-foreground">Planification stratégique des passations</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {stats?.total ?? 0} marchés planifiés · {budgetK} k€ prévisionnels · Exercice 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={demo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filtres avancés
          </button>
          <button onClick={demo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: "linear-gradient(135deg,#5B6BF5,#7B5BE8)" }}>
            <Plus className="w-3.5 h-3.5" /> Nouveau marché
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Marchés en cours", value: stats?.en_cours ?? 0, icon: CalendarRange, alert: false },
          { label: "Charge prévisionnelle", value: `${stats?.charge_total ?? 0} j/h`, icon: Users, alert: true },
          { label: "Chevauchements", value: "3", icon: Layers, alert: false },
          { label: "Impact budgétaire", value: `${budgetK} k€`, icon: TrendingUp, alert: false },
          { label: "Alertes seuils", value: stats?.alertes ?? 0, icon: AlertTriangle, alert: true },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.alert ? "#F59E0B" : "#5B6BF5" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
            </div>
            <span className="text-xl font-bold" style={{ color: kpi.alert ? "#F59E0B" : undefined }}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">Charge prévisionnelle par mois (j/homme)</h2>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chargeData} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="charge" name="Charge" fill="#5B6BF5" radius={[2, 2, 0, 0]} maxBarSize={14} />
                <Bar dataKey="capacite" name="Capacité" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Surcharge détectée en mars et juin — risque de retard sur les passations
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">Vision pluriannuelle 2024–2028</h2>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pluriannuelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="annee" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={30} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line yAxisId="left" dataKey="marches" name="Nb marchés" stroke="#5B6BF5" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" dataKey="montant" name="Montant (M€)" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 justify-center">
            {[{ label: "Nb marchés", color: "#5B6BF5" }, { label: "Montant (M€)", color: "#10B981" }].map((l) => (
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

      {/* Table + Side panel */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Réf.", "Objet du marché", "Service", "Montant", "Procédure", "Échéance", "Charge (j)", "Statut", ""].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((m) => {
                    const s = statutColors[m.statut] ?? statutColors.planifie;
                    const p = prioriteColors[m.priorite] ?? prioriteColors.normale;
                    const isSelected = selectedId === m.id;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedId(isSelected ? null : m.id)}
                        className="cursor-pointer transition-colors hover:bg-muted/30"
                        style={isSelected ? { background: "rgba(91,107,245,0.04)" } : undefined}
                      >
                        <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{m.reference}</td>
                        <td className="px-3 py-2.5 text-[13px] font-medium text-foreground max-w-[200px] truncate">{m.objet}</td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{m.service}</td>
                        <td className="px-3 py-2.5 text-[13px] font-semibold tabular-nums text-foreground">{m.montant.toLocaleString("fr-FR")} €</td>
                        <td className="px-3 py-2.5 text-[11px] text-foreground">{m.procedure}</td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground tabular-nums">{m.echeance}</td>
                        <td className="px-3 py-2.5 text-[11px] tabular-nums text-foreground">{m.charge}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                            style={{ background: s.bg, color: s.text, borderColor: s.border }}>
                            {statutLabels[m.statut] ?? m.statut}
                          </span>
                        </td>
                        <td className="px-3 py-2.5"><ChevronRight className="w-3 h-3 text-muted-foreground" /></td>
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
          <div className="w-72 flex-shrink-0 bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">{selected.reference}</span>
              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                style={{ background: (statutColors[selected.statut] ?? statutColors.planifie).bg, color: (statutColors[selected.statut] ?? statutColors.planifie).text, borderColor: (statutColors[selected.statut] ?? statutColors.planifie).border }}>
                {statutLabels[selected.statut] ?? selected.statut}
              </span>
            </div>
            <h3 className="text-[13px] font-semibold leading-snug text-foreground">{selected.objet}</h3>
            <div className="space-y-2 text-[12px]">
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
                style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
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
    </div>
  );
}
