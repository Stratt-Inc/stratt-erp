import { useState } from "react";
import {
  CalendarRange,
  Plus,
  Filter,
  Search,
  ChevronRight,
  AlertTriangle,
  Clock,
  FileText,
  LayoutList,
  Calendar,
  TrendingUp,
  Users,
  Layers,
  Scale,
  Zap,
  Target,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { CHART_COLORS, PALETTE, UI_COLORS } from "@/lib/palette";
import { StatsGrid } from "@/components/StatsGrid";
import { CalendarView } from "@/components/CalendarView";

const marches = [
  { id: "M2026-001", objet: "Maintenance ascenseurs — Lot 1 Centre", service: "DGA Bâtiments", montant: "120 000 €", procedure: "AO ouvert", echeance: "15/03/2026", statut: "En cours", priorite: "haute", charge: 12 },
  { id: "M2026-012", objet: "Fournitures bureau groupement", service: "DGA Support", montant: "45 000 €", procedure: "MAPA", echeance: "22/04/2026", statut: "Planifié", priorite: "normale", charge: 5 },
  { id: "M2026-018", objet: "Logiciel GRH — Renouvellement licence", service: "DGA RH", montant: "280 000 €", procedure: "AO ouvert", echeance: "01/06/2026", statut: "Planifié", priorite: "haute", charge: 18 },
  { id: "M2026-023", objet: "Nettoyage locaux administratifs", service: "DGA Moyens Gén.", montant: "95 000 €", procedure: "MAPA", echeance: "30/05/2026", statut: "Alerte", priorite: "critique", charge: 8 },
  { id: "M2026-031", objet: "Études géotechniques ZAC Nord", service: "DGA Urbanisme", montant: "58 000 €", procedure: "MAPA", echeance: "15/07/2026", statut: "Planifié", priorite: "normale", charge: 6 },
  { id: "M2026-042", objet: "Accord-cadre impression et reprographie", service: "DGA Communication", montant: "200 000 €", procedure: "Accord-cadre", echeance: "01/09/2026", statut: "En cours", priorite: "normale", charge: 14 },
  { id: "M2026-055", objet: "Mobilier scolaire — Écoles primaires", service: "DGA Éducation", montant: "175 000 €", procedure: "AO ouvert", echeance: "30/06/2026", statut: "Planifié", priorite: "haute", charge: 15 },
  { id: "M2026-061", objet: "Prestations intellectuelles urbanisme", service: "DGA Urbanisme", montant: "320 000 €", procedure: "AO restreint", echeance: "15/10/2026", statut: "Planifié", priorite: "haute", charge: 20 },
];

const chargeData = [
  { mois: "Jan", charge: 35, capacite: 50 },
  { mois: "Fév", charge: 42, capacite: 50 },
  { mois: "Mar", charge: 58, capacite: 50 },
  { mois: "Avr", charge: 45, capacite: 50 },
  { mois: "Mai", charge: 52, capacite: 50 },
  { mois: "Jun", charge: 68, capacite: 50 },
  { mois: "Jul", charge: 30, capacite: 50 },
  { mois: "Aoû", charge: 18, capacite: 50 },
  { mois: "Sep", charge: 48, capacite: 50 },
  { mois: "Oct", charge: 40, capacite: 50 },
  { mois: "Nov", charge: 32, capacite: 50 },
  { mois: "Déc", charge: 22, capacite: 50 },
];

const pluriannuelData = [
  { annee: "2024", marches: 128, montant: 72.1 },
  { annee: "2025", marches: 135, montant: 78.4 },
  { annee: "2026", marches: 147, montant: 84.2 },
  { annee: "2027 (P)", marches: 155, montant: 89.0 },
  { annee: "2028 (P)", marches: 162, montant: 94.5 },
];

const statusStyles: Record<string, string> = {
  "En cours": "bg-info/8 text-info border-info/15",
  "Planifié": "bg-muted text-muted-foreground border-border",
  "Alerte": "bg-destructive/8 text-destructive border-destructive/15",
};

const prioriteStyles: Record<string, string> = {
  normale: "bg-muted text-muted-foreground",
  haute: "bg-warning/8 text-warning",
  critique: "bg-destructive/8 text-destructive",
};

export default function Planification() {
  const [selectedMarche, setSelectedMarche] = useState<string | null>(null);
  const selected = marches.find((m) => m.id === selectedMarche);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 animate-fade-in">
        <div className="flex-1">
          <p className="section-label mb-2">Module planification</p>
          <h1 className="mb-2 text-2xl sm:text-3xl">Planification stratégique des passations</h1>
          <p className="text-[13px] sm:text-[14px] text-muted-foreground">147 marchés planifiés · 84,2 M€ prévisionnels · Exercice 2026</p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-[12px] sm:text-[13px] h-8 sm:h-9 px-2 sm:px-3 rounded-lg">
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filtres</span>
          </Button>
          <Button size="sm" className="gap-1 sm:gap-2 text-[12px] sm:text-[13px] h-8 sm:h-9 px-2 sm:px-3 rounded-lg">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nouveau</span>
          </Button>
        </div>
      </div>

      {/* KPIs Planification */}
      <StatsGrid
        stats={[
          { label: "Marchés en cours", value: "24", icon: CalendarRange, trend: { value: "+3", positive: true } },
          { label: "Charge prévisionnelle", value: "68%", icon: Users, alert: true, trend: { value: "+12%", positive: false } },
          { label: "Chevauchements", value: "3", icon: Layers, trend: { value: "-2", positive: true } },
          { label: "Impact budgétaire", value: "84,2 M€", icon: TrendingUp, trend: { value: "+8,3%", positive: true } },
          { label: "Alertes seuils", value: "5", icon: AlertTriangle, alert: true },
        ]}
        columns="5"
      />

      {/* Charge + Pluriannuel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-[13px] flex items-center gap-2">
              <Users className="w-4 h-4" />
              Charge prévisionnelle par mois (j/homme)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chargeData} barGap={1}>
                  <CartesianGrid strokeDasharray="3 3" stroke={UI_COLORS.lightStroke} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip />
                  <Bar dataKey="charge" name="Charge" fill={PALETTE.primary} radius={[2, 2, 0, 0]} barSize={14} />
                  <Bar dataKey="capacite" name="Capacité" fill={PALETTE.accent} radius={[2, 2, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-destructive mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Surcharge détectée en mars et juin — risque de retard sur les passations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-[13px] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Vision pluriannuelle 2024–2028
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pluriannuelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={UI_COLORS.lightStroke} vertical={false} />
                  <XAxis dataKey="annee" tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} width={30} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip />
                  <Line yAxisId="left" dataKey="marches" name="Nb marchés" stroke={PALETTE.primary} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" dataKey="montant" name="Montant (M€)" stroke={PALETTE.secondary} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2 justify-center">
              {[
                { label: "Nb marchés", color: CHART_COLORS.tertiary },
                { label: "Montant (M€)", color: CHART_COLORS.accent },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-0.5 rounded" style={{ backgroundColor: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" className="pl-10 text-[13px] h-10 rounded-lg w-full" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {["Service", "Procédure", "Montant", "Année"].map((f) => (
            <Button key={f} variant="outline" size="sm" className="text-[11px] sm:text-[12px] h-9 px-2.5 sm:px-3 gap-1 rounded-lg flex-shrink-0 whitespace-nowrap">
              {f} <ChevronRight className="w-3 h-3 rotate-90 hidden sm:block" />
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs tableau/calendrier */}
      <Tabs defaultValue="tableau" className="space-y-4">
        <TabsList className="h-10 w-full sm:w-auto">
          <TabsTrigger value="tableau" className="text-[12px] sm:text-[13px] gap-1.5 sm:gap-2 px-3 sm:px-4 h-8 flex-1 sm:flex-none">
            <LayoutList className="w-4 h-4" />
            Tableau
          </TabsTrigger>
          <TabsTrigger value="calendrier" className="text-[12px] sm:text-[13px] gap-1.5 sm:gap-2 px-3 sm:px-4 h-8 flex-1 sm:flex-none">
            <Calendar className="w-4 h-4" />
            Calendrier
          </TabsTrigger>
        </TabsList>

        {/* Vue Tableau */}
        <TabsContent value="tableau" className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="hidden sm:table-cell">Réf.</th>
                  <th>Objet du marché</th>
                  <th className="hidden md:table-cell">Service</th>
                  <th>Montant</th>
                  <th className="hidden lg:table-cell">Procédure</th>
                  <th className="hidden lg:table-cell">Échéance</th>
                  <th className="hidden xl:table-cell">Charge</th>
                  <th>Statut</th>
                  <th className="w-6"></th>
                </tr>
              </thead>
              <tbody>
                {marches.map((m) => (
                  <tr
                    key={m.id}
                    className={`cursor-pointer ${selectedMarche === m.id ? "bg-primary/4" : ""}`}
                    onClick={() => setSelectedMarche(m.id)}
                  >
                    <td className="font-mono text-[11px] text-muted-foreground hidden sm:table-cell">{m.id}</td>
                    <td className="font-medium text-[12px] sm:text-[13px] max-w-[160px] sm:max-w-[220px] truncate">{m.objet}</td>
                    <td className="text-muted-foreground text-[11px] hidden md:table-cell">{m.service}</td>
                    <td className="font-semibold text-[12px] sm:text-[13px] tabular-nums whitespace-nowrap">{m.montant}</td>
                    <td className="text-[11px] hidden lg:table-cell">{m.procedure}</td>
                    <td className="text-[11px] text-muted-foreground tabular-nums hidden lg:table-cell">{m.echeance}</td>
                    <td className="text-[11px] tabular-nums hidden xl:table-cell">{m.charge}</td>
                    <td>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${statusStyles[m.statut]}`}>
                        {m.statut}
                      </span>
                    </td>
                    <td><ChevronRight className="w-3 h-3 text-muted-foreground" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panel — desktop: sidebar, mobile: bottom sheet */}
        {selected && (
          <>
            {/* Desktop panel */}
            <div className="hidden lg:block w-80 flex-shrink-0 bg-card/95 backdrop-blur-sm border rounded-xl p-5 space-y-4 shadow-lg animate-slide-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[11px] text-muted-foreground">{selected.id}</span>
                  <h3 className="text-[15px] font-bold text-foreground leading-snug mt-1">{selected.objet}</h3>
                </div>
                <button onClick={() => setSelectedMarche(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <span className={`inline-flex px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest ${statusStyles[selected.statut]}`}>{selected.statut}</span>
              <div className="space-y-3 text-[13px]">
                {[["Service", selected.service], ["Montant", selected.montant], ["Procédure", selected.procedure], ["Échéance", selected.echeance], ["Charge", `${selected.charge} j/homme`]].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between"><span className="text-muted-foreground font-medium">{label}</span><span className="font-semibold text-foreground">{value}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-muted-foreground font-medium">Priorité</span><span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${prioriteStyles[selected.priorite]}`}>{selected.priorite}</span></div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Actions rapides</p>
                <Button size="sm" variant="outline" className="w-full gap-2 text-[12px] h-8 justify-start rounded-lg"><FileText className="w-3.5 h-3.5" /> Créer un scénario</Button>
                <Button size="sm" variant="outline" className="w-full gap-2 text-[12px] h-8 justify-start rounded-lg"><Clock className="w-3.5 h-3.5" /> Simuler les délais</Button>
                <Button size="sm" variant="outline" className="w-full gap-2 text-[12px] h-8 justify-start rounded-lg"><Scale className="w-3.5 h-3.5" /> Vérifier les seuils</Button>
                <Button size="sm" variant="outline" className="w-full gap-2 text-[12px] h-8 justify-start rounded-lg"><Zap className="w-3.5 h-3.5" /> Simulation budgétaire</Button>
              </div>
              {selected.statut === "Alerte" && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-[12px] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-destructive leading-relaxed font-medium">Montant dépasse le seuil MAPA 90k€. Procédure formalisée requise (art. L2124-1 CCP).</span>
                </div>
              )}
            </div>

            {/* Mobile bottom sheet */}
            <div className="lg:hidden fixed inset-0 z-40" onClick={() => setSelectedMarche(null)}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-14 left-0 right-0 bg-card border-t rounded-t-2xl shadow-xl max-h-[75vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[11px] text-muted-foreground">{selected.id}</span>
                      <h3 className="text-[14px] font-bold text-foreground leading-snug mt-0.5">{selected.objet}</h3>
                    </div>
                    <button onClick={() => setSelectedMarche(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${statusStyles[selected.statut]}`}>{selected.statut}</span>
                  <div className="space-y-2 text-[12px]">
                    {[["Service", selected.service], ["Montant", selected.montant], ["Procédure", selected.procedure], ["Échéance", selected.echeance]].map(([label, value]) => (
                      <div key={String(label)} className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-[11px] h-8 rounded-lg"><FileText className="w-3 h-3" /> Scénario</Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-[11px] h-8 rounded-lg"><Scale className="w-3 h-3" /> Seuils</Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TabsContent>

    {/* Vue Calendrier */}
    <TabsContent value="calendrier" className="space-y-4">
      <CalendarView marches={marches} onSelectMarche={setSelectedMarche} />

      {/* Detail panel for calendar view */}
      {selected && (
        <>
          {/* Desktop panel */}
          <div className="hidden lg:block w-80 bg-card/95 backdrop-blur-sm border rounded-xl p-5 space-y-4 shadow-lg animate-slide-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[11px] text-muted-foreground">{selected.id}</span>
                <h3 className="text-[15px] font-bold text-foreground leading-snug mt-1">{selected.objet}</h3>
              </div>
              <button onClick={() => setSelectedMarche(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <span className={`inline-flex px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest ${statusStyles[selected.statut]}`}>{selected.statut}</span>
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              {[["Service", selected.service], ["Montant", selected.montant], ["Procédure", selected.procedure], ["Échéance", selected.echeance], ["Charge", `${selected.charge} j/homme`],
                ["Priorité", <span key="prio" className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${prioriteStyles[selected.priorite]}`}>{selected.priorite}</span>],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile bottom sheet */}
          <div className="lg:hidden fixed inset-0 z-40" onClick={() => setSelectedMarche(null)}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-14 left-0 right-0 bg-card border-t rounded-t-2xl shadow-xl max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[11px] text-muted-foreground">{selected.id}</span>
                    <h3 className="text-[14px] font-bold text-foreground leading-snug mt-0.5">{selected.objet}</h3>
                  </div>
                  <button onClick={() => setSelectedMarche(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0"><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${statusStyles[selected.statut]}`}>{selected.statut}</span>
                <div className="space-y-2 text-[12px]">
                  {[["Service", selected.service], ["Montant", selected.montant], ["Procédure", selected.procedure], ["Échéance", selected.echeance]].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </TabsContent>
  </Tabs>
    </div>
  );
}
