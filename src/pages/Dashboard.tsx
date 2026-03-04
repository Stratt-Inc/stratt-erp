import {
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Clock,
  Shield,
  RefreshCw,
  CheckCircle2,
  Target,
  Layers,
  Scale,
  BarChart3,
  ArrowUpRight,
  Gauge,
  Briefcase,
  AlertCircle,
  Zap,
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
  RadialBarChart,
  RadialBar,
} from "recharts";
import { CHART_COLORS, PALETTE, UI_COLORS, withAlpha } from "@/lib/palette";
import {StatsGrid} from "@/components/StatsGrid.tsx";

/* ── KPIs stratégiques ── */
const kpisStrategiques = [
  { label: "Marchés planifiés", value: "147", sub: "+12 vs N-1", icon: FileCheck, positive: true },
  { label: "Montant prévisionnel", value: "84,2 M€", sub: "+8,3% vs N-1", icon: TrendingUp, positive: true },
  { label: "Taux d'anticipation", value: "76%", sub: "+4 pts vs N-1", icon: Clock, positive: true },
  { label: "Taux de mutualisation", value: "42%", sub: "Objectif : 55%", icon: Layers, positive: false },
];

const kpisSecondaires = [
  { label: "Sécurité juridique", value: "94%", icon: CheckCircle2, trend: { value: "+3%", positive: true } },
  { label: "Performance budgétaire", value: "0,91", icon: TrendingUp, trend: { value: "-0,05", positive: false } },
  { label: "Marchés à risque", value: "5", icon: AlertTriangle, alert: true },
  { label: "Renouvellements < 6 mois", value: "12", icon: Clock },
];

/* ── Maturité achats (jauge) ── */
const maturiteData = [
  { name: "Maturité", value: 68, fill: CHART_COLORS.tertiary },
];

/* ── Répartition par procédure ── */
const procedureData = [
  { name: "MAPA < 40k€", value: 52, color: CHART_COLORS.primary },
  { name: "MAPA < 90k€", value: 34, color: CHART_COLORS.secondary },
  { name: "Appel d'offres ouvert", value: 28, color: CHART_COLORS.tertiary },
  { name: "Appel d'offres restreint", value: 10, color: withAlpha(PALETTE.primary, "CC") },
  { name: "Accord-cadre", value: 15, color: CHART_COLORS.accent },
  { name: "Procédure négociée", value: 8, color: CHART_COLORS.accentSoft },
];

/* ── Timeline passations ── */
const timelineData = [
  { mois: "J", passations: 8, previsionnel: 10 },
  { mois: "F", passations: 12, previsionnel: 11 },
  { mois: "M", passations: 18, previsionnel: 16 },
  { mois: "A", passations: 14, previsionnel: 15 },
  { mois: "M", passations: 16, previsionnel: 14 },
  { mois: "J", passations: 22, previsionnel: 20 },
  { mois: "J", passations: 10, previsionnel: 12 },
  { mois: "A", passations: 6, previsionnel: 8 },
  { mois: "S", passations: 15, previsionnel: 14 },
  { mois: "O", passations: 12, previsionnel: 13 },
  { mois: "N", passations: 8, previsionnel: 9 },
  { mois: "D", passations: 6, previsionnel: 5 },
];

/* ── Budget par direction ── */
const budgetByDirection = [
  { direction: "Infrastructures", montant: 28.5 },
  { direction: "Éducation", montant: 18.2 },
  { direction: "Numérique / TIC", montant: 14.7 },
  { direction: "Services", montant: 12.3 },
  { direction: "RH", montant: 5.8 },
  { direction: "Autres", montant: 4.7 },
];

/* ── Alertes réglementaires ── */
const alertes = [
  { severity: "critique", message: "3 codes nomenclature dépassent les seuils de publicité sans procédure formalisée (art. L2124-1 CCP)", icon: AlertTriangle },
  { severity: "haute", message: "Risque de fractionnement détecté : 12 MAPA < 40k€ sur « Fournitures informatiques » totalisent 380k€", icon: Scale },
  { severity: "moyenne", message: "5 accords-cadres arrivent à échéance dans les 90 jours — renouvellement à planifier", icon: RefreshCw },
  { severity: "info", message: "23 dépenses non rattachées à un code de nomenclature — classification nécessaire", icon: AlertCircle },
];

const severityStyles: Record<string, string> = {
  critique: "border-l-destructive bg-destructive/4",
  haute: "border-l-warning bg-warning/4",
  moyenne: "border-l-info bg-info/4",
  info: "border-l-muted-foreground bg-muted/40",
};
const severityIconColor: Record<string, string> = {
  critique: "text-destructive",
  haute: "text-warning",
  moyenne: "text-info",
  info: "text-muted-foreground",
};

/* ── Conformité ── */
const conformite = [
  { label: "Seuils de procédure respectés", value: "139/147", ok: true },
  { label: "Codes nomenclature exhaustifs", value: "96%", ok: true },
  { label: "Codes mutuellement exclusifs", value: "98%", ok: true },
  { label: "Dossiers documentés", value: "91%", ok: true },
  { label: "Marchés sans justification", value: "5", ok: false },
  { label: "Risques fractionnement actifs", value: "3", ok: false },
];

/* ── Transformation ── */
const transformation = [
  { label: "Gain en anticipation", value: "+18 jours", sub: "Délai moyen de préparation vs N-1", icon: Clock },
  { label: "Réduction du risque", value: "-62%", sub: "Anomalies détectées en amont", icon: Shield },
  { label: "Lisibilité budgétaire", value: "+34%", sub: "Taux de classification automatique", icon: BarChart3 },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8 max-w-[1800px] mx-auto">
      {/* ── En-tête ── */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <p className="section-label mb-2">Pilotage stratégique</p>
          <h1 className="mb-2">Tableau de bord — Gouvernance des achats</h1>
          <p className="text-[14px] text-muted-foreground">
            Vision consolidée · Exercice budgétaire 2026 · Métropole de Lyon
          </p>
        </div>
        <div className="flex gap-3">
          <div className="badge-conforme">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Conforme CCP 2024
          </div>
          <div className="badge-conforme">
            <Shield className="w-3.5 h-3.5" />
            RGPD
          </div>
        </div>
      </div>

      {/* ── KPIs stratégiques ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {kpisStrategiques.map((kpi, index) => (
          <div
            key={kpi.label}
            className="stat-card"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center backdrop-blur-sm">
                <kpi.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-[11px] font-bold flex items-center gap-1 ${kpi.positive ? "text-accent" : "text-warning"}`}>
                {kpi.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                {kpi.sub}
              </span>
            </div>
            <div className="metric-block">
              <span className="metric-value">{kpi.value}</span>
              <span className="metric-label mt-1">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Indicateurs secondaires ── */}
      <StatsGrid
        stats={kpisSecondaires}
        columns="4"
      />

      {/* ── Row : Maturité + Procédures + Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Maturité achats */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-[13px] flex items-center gap-2">
              <Gauge className="w-4 h-4 text-accent" />
              Indice de maturité achats
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={180}
                  endAngle={0}
                  data={maturiteData}
                >
                  <RadialBar background dataKey="value" cornerRadius={4} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-8">
              <span className="text-3xl font-bold text-accent">68</span>
              <span className="text-sm text-muted-foreground">/100</span>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Niveau : Structuré</p>
            </div>
            <div className="w-full mt-4 space-y-1.5">
              {[
                { label: "Nomenclature", score: 82 },
                { label: "Planification", score: 71 },
                { label: "Sécurité juridique", score: 65 },
                { label: "Mutualisation", score: 54 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-28 text-muted-foreground truncate">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium">{item.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Répartition par procédure */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-1">
            <CardTitle className="text-[13px] flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Répartition par procédure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={procedureData}
                    dataKey="value"
                    innerRadius={35}
                    outerRadius={64}
                    paddingAngle={2}
                    stroke={UI_COLORS.white}
                    strokeWidth={1.5}
                  >
                    {procedureData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-1">
              {procedureData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground flex-1 truncate">{item.name}</span>
                  <span className="font-semibold tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline + Budget */}
        <div className="lg:col-span-5 space-y-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[13px]">Planning des passations 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData} barGap={1}>
                    <CartesianGrid strokeDasharray="3 3" stroke={UI_COLORS.lightStroke} vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip />
                    <Bar dataKey="passations" name="Réalisé" fill={PALETTE.primary} radius={[2, 2, 0, 0]} barSize={12} />
                    <Bar dataKey="previsionnel" name="Prévisionnel" fill={PALETTE.accent} radius={[2, 2, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-[13px]">Dépenses consolidées par direction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetByDirection} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke={UI_COLORS.lightStroke} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="direction" type="category" width={100} tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => `${v} M€`} />
                    <Bar dataKey="montant" fill={PALETTE.primary} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Alertes réglementaires ── */}
      <div className="animate-slide-in">
        <p className="section-label mb-3">Alertes réglementaires</p>
        <div className="space-y-3">
          {alertes.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-xl border-l-4 backdrop-blur-sm transition-all duration-200 hover:shadow-md ${severityStyles[a.severity]}`}
            >
              <a.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${severityIconColor[a.severity]}`} />
              <div className="flex-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${severityIconColor[a.severity]}`}>
                  {a.severity}
                </span>
                <p className="text-[14px] text-foreground mt-1 leading-relaxed font-medium">
                  {a.message}
                </p>
              </div>
              <button className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1 flex-shrink-0 transition-colors">
                Traiter <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Conformité + Transformation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Conformité */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Indicateurs de conformité réglementaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {conformite.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded border bg-card">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.ok ? "bg-accent" : "bg-destructive"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.ok ? "text-foreground" : "text-destructive"}`}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Impact stratégique / Transformation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Impact stratégique — Transformation achats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transformation.map((t) => (
              <div key={t.label} className="flex items-center gap-4 p-3 rounded border bg-card">
                <div className="w-9 h-9 rounded bg-accent/8 flex items-center justify-center flex-shrink-0">
                  <t.icon className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.sub}</p>
                </div>
                <span className="text-lg font-bold text-accent">{t.value}</span>
              </div>
            ))}
            <div className="p-3 rounded border border-accent/15 bg-accent/4 text-[12px] text-foreground leading-relaxed">
              <p className="font-semibold text-accent text-[10px] uppercase tracking-wider mb-1">Suggestion d'optimisation</p>
              3 familles d'achats pourraient être regroupées en accord-cadre, réduisant les coûts de passation de ~15% et renforçant la sécurité juridique.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
