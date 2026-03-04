import {
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Clock,
  BarChart3,
  Shield,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const kpis = [
  { label: "Marchés planifiés", value: "147", icon: FileCheck, trend: "+12 vs N-1" },
  { label: "Montant prévisionnel", value: "84,2 M€", icon: TrendingUp, trend: "+8,3%" },
  { label: "Taux d'anticipation", value: "76%", icon: Clock, trend: "+4 pts" },
  { label: "Alertes actives", value: "8", icon: AlertTriangle, trend: "3 critiques", alert: true },
];

const procedureData = [
  { name: "MAPA < 40k€", value: 52, color: "hsl(215, 55%, 22%)" },
  { name: "MAPA < 90k€", value: 34, color: "hsl(215, 45%, 40%)" },
  { name: "Appel d'offres", value: 38, color: "hsl(168, 40%, 42%)" },
  { name: "Procédure négociée", value: 15, color: "hsl(205, 85%, 50%)" },
  { name: "Accord-cadre", value: 8, color: "hsl(215, 30%, 65%)" },
];

const budgetByDirection = [
  { direction: "DGA Infrastructures", montant: 28.5 },
  { direction: "DGA Éducation", montant: 18.2 },
  { direction: "DGA Numérique", montant: 12.8 },
  { direction: "DGA RH", montant: 9.4 },
  { direction: "DGA Finances", montant: 8.1 },
  { direction: "DGA Environnement", montant: 7.2 },
];

const timelineData = [
  { mois: "Jan", passations: 8 },
  { mois: "Fév", passations: 12 },
  { mois: "Mar", passations: 18 },
  { mois: "Avr", passations: 14 },
  { mois: "Mai", passations: 16 },
  { mois: "Jun", passations: 22 },
  { mois: "Jul", passations: 10 },
  { mois: "Aoû", passations: 6 },
  { mois: "Sep", passations: 15 },
  { mois: "Oct", passations: 12 },
  { mois: "Nov", passations: 8 },
  { mois: "Déc", passations: 6 },
];

const alertes = [
  { type: "critique", message: "3 marchés dépassent le seuil de 90 000 € sans procédure formalisée", icon: AlertTriangle },
  { type: "attention", message: "5 accords-cadres arrivent à échéance dans les 90 prochains jours", icon: RefreshCw },
  { type: "info", message: "Risque de fractionnement détecté sur la famille « Fournitures informatiques »", icon: Shield },
];

const conformite = [
  { label: "Seuils de procédure respectés", status: true, count: "139/147" },
  { label: "Marchés à renouveler (< 6 mois)", status: false, count: "12" },
  { label: "Dossiers complets", status: true, count: "95%" },
  { label: "Risques fractionnement identifiés", status: false, count: "3" },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord stratégique</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble des achats publics — Exercice 2026</p>
        </div>
        <div className="badge-conforme">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Conforme réglementation
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                <p className={`text-xs mt-1 ${kpi.alert ? "text-destructive" : "text-accent"}`}>
                  {kpi.trend}
                </p>
              </div>
              <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${
                kpi.alert ? "bg-destructive/10" : "bg-primary/10"
              }`}>
                <kpi.icon className={`w-4 h-4 ${kpi.alert ? "text-destructive" : "text-primary"}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Répartition par procédure */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par procédure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={procedureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {procedureData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {procedureData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline passations */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Timeline des passations 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 89%)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "hsl(215, 12%, 50%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215, 12%, 50%)" }} />
                  <Tooltip />
                  <Bar dataKey="passations" fill="hsl(215, 55%, 22%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Budget par direction */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Budget par direction (M€)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetByDirection} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 89%)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(215, 12%, 50%)" }} />
                  <YAxis
                    dataKey="direction"
                    type="category"
                    width={120}
                    tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }}
                  />
                  <Tooltip />
                  <Bar dataKey="montant" fill="hsl(168, 40%, 42%)" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes & Conformité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alertes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Alertes réglementaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertes.map((alerte, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded text-sm ${
                  alerte.type === "critique"
                    ? "bg-destructive/5 border border-destructive/20"
                    : alerte.type === "attention"
                    ? "bg-warning/5 border border-warning/20"
                    : "bg-info/5 border border-info/20"
                }`}
              >
                <alerte.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  alerte.type === "critique" ? "text-destructive" : alerte.type === "attention" ? "text-warning" : "text-info"
                }`} />
                <span className="text-foreground">{alerte.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conformité */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Indicateurs de conformité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conformite.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded border bg-card">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.status ? "bg-accent" : "bg-destructive"}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className={`text-sm font-semibold ${item.status ? "text-accent" : "text-destructive"}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Suggestions IA discrètes */}
      <Card className="shadow-sm border-accent/20 bg-accent/5">
        <CardContent className="py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Suggestion d'optimisation</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              3 familles d'achats pourraient être regroupées pour atteindre le seuil d'un accord-cadre, réduisant les coûts de passation de ~15%.
            </p>
          </div>
          <button className="text-xs text-accent font-medium hover:underline flex items-center gap-1">
            Analyser <ArrowUpRight className="w-3 h-3" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
