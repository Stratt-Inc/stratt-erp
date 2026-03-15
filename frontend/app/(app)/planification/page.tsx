"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import {
  Calendar,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface Marche {
  id: string;
  objet: string;
  service: string;
  procedure: string;
  statut: string;
  montant: number;
  date_lancement: string | null;
  date_echeance: string | null;
  date_attribution: string | null;
  date_debut: string | null;
  date_fin: string | null;
  notes: string;
  created_at: string;
}

interface Alerte {
  marche_id: string;
  objet: string;
  service: string;
  procedure: string;
  statut: string;
  date: string;
  type: string;
  jours_restants: number;
  urgence: "urgent" | "proche" | "normal" | "depasse";
}

interface CalendrierData {
  marches: Marche[];
  alertes: Alerte[];
}

interface MarcheStats {
  total: number;
  planifies: number;
  en_cours: number;
  attribues: number;
  budget_total: number;
  alertes_j30: number;
}

// ── Constants ─────────────────────────────────────────────────────────

const PROCEDURES = ["MAPA", "AO_ouvert", "gre_a_gre", "negocie"];
const PROCEDURE_LABELS: Record<string, string> = {
  MAPA: "MAPA",
  AO_ouvert: "Appel d'offres",
  gre_a_gre: "Gré à gré",
  negocie: "Négocié",
};
const STATUTS = ["planifie", "en_cours", "attribue", "execute", "clos", "annule"];
const STATUT_LABELS: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  attribue: "Attribué",
  execute: "En exécution",
  clos: "Clos",
  annule: "Annulé",
};
const STATUT_COLORS: Record<string, string> = {
  planifie: "#5B6BF5",
  en_cours: "#F59E0B",
  attribue: "#10B981",
  execute: "#06B6D4",
  clos: "#6B7280",
  annule: "#EF4444",
};
const TYPE_ALERTE_LABELS: Record<string, string> = {
  lancement: "Lancement",
  echeance: "Échéance offres",
  attribution: "Attribution",
  fin: "Fin / Renouvellement",
};
const URGENCE_COLORS: Record<string, string> = {
  depasse: "#EF4444",
  urgent: "#F59E0B",
  proche: "#5B6BF5",
  normal: "#6B7280",
};

const MONTHS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=dimanche
}

// ── Modal création/édition ─────────────────────────────────────────────

interface MarcheFormData {
  objet: string;
  service: string;
  procedure: string;
  statut: string;
  montant: string;
  date_lancement: string;
  date_echeance: string;
  date_attribution: string;
  date_fin: string;
  notes: string;
}

const EMPTY_FORM: MarcheFormData = {
  objet: "",
  service: "",
  procedure: "MAPA",
  statut: "planifie",
  montant: "",
  date_lancement: "",
  date_echeance: "",
  date_attribution: "",
  date_fin: "",
  notes: "",
};

function MarcheModal({
  onClose,
  onSaved,
  token,
  orgId,
}: {
  onClose: () => void;
  onSaved: () => void;
  token: string;
  orgId: string;
}) {
  const [form, setForm] = useState<MarcheFormData>(EMPTY_FORM);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: MarcheFormData) =>
      api.post("/api/v1/marches", {
        objet: data.objet,
        service: data.service,
        procedure: data.procedure,
        statut: data.statut,
        montant: parseFloat(data.montant) || 0,
        date_lancement: data.date_lancement || null,
        date_echeance: data.date_echeance || null,
        date_attribution: data.date_attribution || null,
        date_fin: data.date_fin || null,
        notes: data.notes,
      }, { token, orgId }),
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Erreur lors de la création"),
  });

  const set = (k: keyof MarcheFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Nouveau marché</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
              Objet du marché *
            </label>
            <input
              value={form.objet}
              onChange={set("objet")}
              placeholder="Ex : Fourniture de matériel informatique"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Service / Direction
              </label>
              <input
                value={form.service}
                onChange={set("service")}
                placeholder="Ex : Direction Informatique"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Montant estimé (€)
              </label>
              <input
                type="number"
                value={form.montant}
                onChange={set("montant")}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Procédure
              </label>
              <select
                value={form.procedure}
                onChange={set("procedure")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PROCEDURES.map((p) => (
                  <option key={p} value={p}>{PROCEDURE_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Statut
              </label>
              <select
                value={form.statut}
                onChange={set("statut")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STATUTS.slice(0, 4).map((s) => (
                  <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Date de lancement
              </label>
              <input type="date" value={form.date_lancement} onChange={set("date_lancement")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Échéance offres
              </label>
              <input type="date" value={form.date_echeance} onChange={set("date_echeance")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Date d'attribution
              </label>
              <input type="date" value={form.date_attribution} onChange={set("date_attribution")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Fin / Renouvellement
              </label>
              <input type="date" value={form.date_fin} onChange={set("date_fin")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.objet || mutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
            style={{ background: "#5B6BF5" }}
          >
            {mutation.isPending ? "Création…" : "Créer le marché"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────

export default function PlanificationPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<"calendrier" | "liste" | "alertes">("calendrier");
  const [filterStatut, setFilterStatut] = useState("");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: calData } = useQuery<CalendrierData>({
    queryKey: ["marches", "calendrier", currentOrg?.id],
    queryFn: () => api.get("/api/v1/marches/calendrier", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: stats } = useQuery<MarcheStats>({
    queryKey: ["marches", "stats", currentOrg?.id],
    queryFn: () => api.get("/api/v1/marches/stats", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const marches = calData?.marches ?? [];
  const alertes = calData?.alertes ?? [];

  const filteredMarches = filterStatut
    ? marches.filter((m) => m.statut === filterStatut)
    : marches;

  // Alertes urgentes (≤30j ou dépassées)
  const alertesUrgentes = alertes.filter(
    (a) => a.urgence === "urgent" || a.urgence === "depasse"
  );

  // Marchés par jour pour le calendrier
  const marchesByDay: Record<string, Marche[]> = {};
  for (const m of marches) {
    const dates = [m.date_lancement, m.date_echeance, m.date_fin].filter(Boolean) as string[];
    for (const d of dates) {
      const [y, mo] = d.split("-").map(Number);
      if (y === calYear && mo - 1 === calMonth) {
        if (!marchesByDay[d]) marchesByDay[d] = [];
        marchesByDay[d].push(m);
      }
    }
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = (getFirstDayOfMonth(calYear, calMonth) + 6) % 7; // lundi=0
  const today = new Date().toISOString().slice(0, 10);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6" style={{ color: "#5B6BF5" }} />
            Calendrier des passations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Planification semi-automatisée des marchés publics
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "#5B6BF5" }}
        >
          <Plus className="w-4 h-4" />
          Nouveau marché
        </button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total", value: stats.total, icon: Calendar, color: "#5B6BF5" },
            { label: "Planifiés", value: stats.planifies, icon: Clock, color: "#6B7280" },
            { label: "En cours", value: stats.en_cours, icon: Clock, color: "#F59E0B" },
            { label: "Attribués", value: stats.attribues, icon: CheckCircle, color: "#10B981" },
            { label: "Budget total", value: formatEur(stats.budget_total), icon: Calendar, color: "#06B6D4" },
            {
              label: "Alertes J30",
              value: stats.alertes_j30,
              icon: AlertTriangle,
              color: "#EF4444",
              urgent: stats.alertes_j30 > 0,
            },
          ].map(({ label, value, icon: Icon, color, urgent }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4"
              style={urgent ? { borderColor: color, borderWidth: 1.5 } : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alertes urgentes */}
      {alertesUrgentes.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {alertesUrgentes.length} échéance{alertesUrgentes.length > 1 ? "s" : ""} urgente{alertesUrgentes.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2">
            {alertesUrgentes.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium truncate flex-1 mr-4">{a.objet}</span>
                <span className="text-muted-foreground text-xs mr-3">{TYPE_ALERTE_LABELS[a.type]}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: URGENCE_COLORS[a.urgence], background: `${URGENCE_COLORS[a.urgence]}18` }}
                >
                  {a.urgence === "depasse"
                    ? `${Math.abs(a.jours_restants)}j dépassé`
                    : `J-${a.jours_restants}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/30 w-fit">
        {(["calendrier", "liste", "alertes"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className={[
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
              viewMode === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {v === "calendrier" ? "Calendrier" : v === "liste" ? "Liste" : "Alertes"}
          </button>
        ))}
      </div>

      {/* Vue Calendrier */}
      {viewMode === "calendrier" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Nav mois */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold text-foreground">
              {MONTHS[calMonth]} {calYear}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>
          {/* Grille */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-border/50 bg-muted/5" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayMarches = marchesByDay[dateStr] ?? [];
              const isToday = dateStr === today;
              return (
                <div
                  key={day}
                  className={[
                    "min-h-[80px] border-r border-b border-border/50 p-1.5",
                    isToday ? "bg-primary/5" : "hover:bg-muted/10",
                  ].join(" ")}
                >
                  <div className={[
                    "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "text-white text-xs" : "text-muted-foreground",
                  ].join(" ")}
                  style={isToday ? { background: "#5B6BF5" } : undefined}
                  >
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayMarches.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
                        style={{
                          background: `${STATUT_COLORS[m.statut]}18`,
                          color: STATUT_COLORS[m.statut],
                        }}
                        title={m.objet}
                      >
                        {m.objet}
                      </div>
                    ))}
                    {dayMarches.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayMarches.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vue Liste */}
      {viewMode === "liste" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              {filteredMarches.length} marché{filteredMarches.length !== 1 ? "s" : ""}
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="px-2 py-1 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Tous les statuts</option>
                {STATUTS.map((s) => (
                  <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          {filteredMarches.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Aucun marché planifié. Cliquez sur &quot;Nouveau marché&quot; pour commencer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Objet", "Service", "Procédure", "Montant", "Lancement", "Échéance", "Statut"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMarches.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs">{m.objet}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{m.service || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{PROCEDURE_LABELS[m.procedure] || m.procedure}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">{m.montant > 0 ? formatEur(m.montant) : "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.date_lancement || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.date_echeance || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ color: STATUT_COLORS[m.statut], background: `${STATUT_COLORS[m.statut]}15` }}
                        >
                          {STATUT_LABELS[m.statut]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vue Alertes */}
      {viewMode === "alertes" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              {alertes.length} alerte{alertes.length !== 1 ? "s" : ""} calendrier
            </h2>
          </div>
          {alertes.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Aucune alerte — tous les marchés sont à jour.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Marché", "Service", "Type d'échéance", "Date", "J-Restants", "Urgence"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alertes.map((a, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{a.objet}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.service || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{TYPE_ALERTE_LABELS[a.type]}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.date}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                        {a.jours_restants >= 0 ? `J-${a.jours_restants}` : `J+${Math.abs(a.jours_restants)}`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                          style={{ color: URGENCE_COLORS[a.urgence], background: `${URGENCE_COLORS[a.urgence]}18` }}
                        >
                          {a.urgence === "depasse" ? "Dépassé" : a.urgence === "urgent" ? "Urgent" : a.urgence === "proche" ? "Proche" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MarcheModal
          onClose={() => setShowModal(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["marches"] })}
          token={accessToken ?? ""}
          orgId={currentOrg?.id ?? ""}
        />
      )}
    </div>
  );
}
