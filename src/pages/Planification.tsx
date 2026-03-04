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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="p-8 space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <p className="section-label mb-2">Module planification</p>
          <h1 className="mb-2">Planification stratégique des passations</h1>
          <p className="text-[14px] text-muted-foreground">147 marchés planifiés · 84,2 M€ prévisionnels · Exercice 2026</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2 text-[13px] h-9 rounded-lg">
            <Filter className="w-4 h-4" /> Filtres avancés
          </Button>
          <Button size="sm" className="gap-2 text-[13px] h-9 rounded-lg">
            <Plus className="w-4 h-4" /> Nouveau marché
          </Button>
        </div>
      </div>

      {/* KPIs Planification */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
        {[
          { label: "Marchés en cours", value: "24", icon: CalendarRange },
          { label: "Charge prévisionnelle", value: "68%", icon: Users, alert: true },
          { label: "Chevauchements", value: "3", icon: Layers },
          { label: "Impact budgétaire simulé", value: "84,2 M€", icon: TrendingUp },
          { label: "Alertes seuils", value: "5", icon: AlertTriangle, alert: true },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center gap-2.5 mb-3">
              <kpi.icon className={`w-4 h-4 ${kpi.alert ? "text-warning" : "text-primary"}`} />
              <span className="metric-label">{kpi.label}</span>
            </div>
            <span className={`text-2xl font-bold ${kpi.alert ? "text-warning" : "text-foreground"}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

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

      {/* Search + Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Rechercher par objet, référence, service…" className="pl-9 text-[12px] h-8" />
        </div>
        <div className="flex gap-1.5 ml-auto">
          {["Service", "Procédure", "Montant", "Année"].map((f) => (
            <Button key={f} variant="outline" size="sm" className="text-[11px] h-7 px-2.5 gap-1">
              {f} <ChevronRight className="w-3 h-3 rotate-90" />
            </Button>
          ))}
        </div>
        <Tabs defaultValue="tableau">
          <TabsList className="h-7">
            <TabsTrigger value="tableau" className="text-[11px] gap-1 px-2.5 h-6"><LayoutList className="w-3 h-3" />Tableau</TabsTrigger>
            <TabsTrigger value="calendrier" className="text-[11px] gap-1 px-2.5 h-6"><Calendar className="w-3 h-3" />Calendrier</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table + Detail */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="bg-card border rounded overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Objet du marché</th>
                  <th>Service</th>
                  <th>Montant</th>
                  <th>Procédure</th>
                  <th>Échéance</th>
                  <th>Charge (j)</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {marches.map((m) => (
                  <tr
                    key={m.id}
                    className={`cursor-pointer ${selectedMarche === m.id ? "bg-primary/4" : ""}`}
                    onClick={() => setSelectedMarche(m.id)}
                  >
                    <td className="font-mono text-[11px] text-muted-foreground">{m.id}</td>
                    <td className="font-medium text-[13px] max-w-[220px] truncate">{m.objet}</td>
                    <td className="text-muted-foreground text-[11px]">{m.service}</td>
                    <td className="font-semibold text-[13px] tabular-nums">{m.montant}</td>
                    <td className="text-[11px]">{m.procedure}</td>
                    <td className="text-[11px] text-muted-foreground tabular-nums">{m.echeance}</td>
                    <td className="text-[11px] tabular-nums">{m.charge}</td>
                    <td>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusStyles[m.statut]}`}>
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

        {/* Side panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 bg-card border rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">{selected.id}</span>
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusStyles[selected.statut]}`}>
                {selected.statut}
              </span>
            </div>
            <h3 className="text-[13px] leading-snug">{selected.objet}</h3>
            <div className="space-y-2 text-[12px]">
              {[
                ["Service", selected.service],
                ["Montant", selected.montant],
                ["Procédure", selected.procedure],
                ["Échéance", selected.echeance],
                ["Charge", `${selected.charge} j/homme`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priorité</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${prioriteStyles[selected.priorite]}`}>{selected.priorite}</span>
              </div>
            </div>
            <div className="panel-divider" />
            <div className="space-y-1.5">
              <Button size="sm" variant="outline" className="w-full gap-2 text-[11px] h-7 justify-start">
                <FileText className="w-3 h-3" /> Créer un scénario
              </Button>
              <Button size="sm" variant="outline" className="w-full gap-2 text-[11px] h-7 justify-start">
                <Clock className="w-3 h-3" /> Simuler les délais
              </Button>
              <Button size="sm" variant="outline" className="w-full gap-2 text-[11px] h-7 justify-start">
                <Scale className="w-3 h-3" /> Vérifier les seuils
              </Button>
              <Button size="sm" variant="outline" className="w-full gap-2 text-[11px] h-7 justify-start">
                <Zap className="w-3 h-3" /> Simulation budgétaire
              </Button>
            </div>
            {selected.statut === "Alerte" && (
              <div className="p-2.5 rounded bg-destructive/5 border border-destructive/15 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-destructive leading-snug">Montant dépasse le seuil MAPA 90k€. Procédure formalisée requise (art. L2124-1 CCP).</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
