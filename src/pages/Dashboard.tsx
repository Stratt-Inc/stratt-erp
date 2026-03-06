import {
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Clock,
  Shield,
  RefreshCw,
  CheckCircle2,
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
import { motion } from "framer-motion";
import { CHART_COLORS, PALETTE } from "@/lib/palette";
import { StatsGrid } from "@/components/StatsGrid.tsx";

/* ── KPIs stratégiques ── */
const kpisStrategiques = [
  { label: "Marchés planifiés",    value: "147",    sub: "+12 vs N-1",    icon: FileCheck,  positive: true  },
  { label: "Montant prévisionnel", value: "84,2 M€", sub: "+8,3% vs N-1", icon: TrendingUp, positive: true  },
  { label: "Taux d'anticipation",  value: "76%",    sub: "+4 pts vs N-1", icon: Clock,      positive: true  },
  { label: "Taux de mutualisation",value: "42%",    sub: "Objectif : 55%",icon: Layers,     positive: false },
];

const kpisSecondaires = [
  { label: "Sécurité juridique",     value: "94%", icon: CheckCircle2, trend: { value: "+3%",  positive: true  } },
  { label: "Performance budgétaire", value: "0,91",icon: TrendingUp,   trend: { value: "-0,05", positive: false } },
  { label: "Marchés à risque",       value: "5",   icon: AlertTriangle, alert: true },
  { label: "Renouvellements < 6m",   value: "12",  icon: Clock },
];

/* ── Charts data ── */
const maturiteData = [
  { name: "Maturité", value: 68, fill: CHART_COLORS.primary },
];

const procedureData = [
  { name: "MAPA < 40k€",            value: 52, color: CHART_COLORS.primary   },
  { name: "MAPA < 90k€",            value: 34, color: CHART_COLORS.secondary },
  { name: "Appel d'offres ouvert",   value: 28, color: CHART_COLORS.tertiary  },
  { name: "Appel d'offres restreint",value: 10, color: CHART_COLORS.accent    },
  { name: "Accord-cadre",            value: 15, color: CHART_COLORS.accentSoft},
  { name: "Procédure négociée",      value: 8,  color: "#C4B5FD"              },
];

const timelineData = [
  { mois: "J", passations: 8,  previsionnel: 10 },
  { mois: "F", passations: 12, previsionnel: 11 },
  { mois: "M", passations: 18, previsionnel: 16 },
  { mois: "A", passations: 14, previsionnel: 15 },
  { mois: "M", passations: 16, previsionnel: 14 },
  { mois: "J", passations: 22, previsionnel: 20 },
  { mois: "J", passations: 10, previsionnel: 12 },
  { mois: "A", passations: 6,  previsionnel: 8  },
  { mois: "S", passations: 15, previsionnel: 14 },
  { mois: "O", passations: 12, previsionnel: 13 },
  { mois: "N", passations: 8,  previsionnel: 9  },
  { mois: "D", passations: 6,  previsionnel: 5  },
];

const budgetByDirection = [
  { direction: "Infrastructures", montant: 28.5 },
  { direction: "Éducation",       montant: 18.2 },
  { direction: "Numérique / TIC", montant: 14.7 },
  { direction: "Services",        montant: 12.3 },
  { direction: "RH",              montant: 5.8  },
  { direction: "Autres",          montant: 4.7  },
];

/* ── Alertes ── */
const alertes = [
  {
    severity: "critique",
    message: "3 codes nomenclature dépassent les seuils de publicité sans procédure formalisée (art. L2124-1 CCP)",
    icon: AlertTriangle,
  },
  {
    severity: "haute",
    message: "Risque de fractionnement détecté : 12 MAPA < 40k€ sur « Fournitures informatiques » totalisent 380k€",
    icon: Scale,
  },
  {
    severity: "moyenne",
    message: "5 accords-cadres arrivent à échéance dans les 90 jours — renouvellement à planifier",
    icon: RefreshCw,
  },
  {
    severity: "info",
    message: "23 dépenses non rattachées à un code de nomenclature — classification nécessaire",
    icon: AlertCircle,
  },
];

const severityConfig: Record<string, { bg: string; border: string; badge: string; text: string; label: string }> = {
  critique: {
    bg: "hsl(0 72% 51% / 0.04)",
    border: "hsl(0 72% 51%)",
    badge: "hsl(0 72% 51% / 0.10)",
    text: "hsl(0 72% 51%)",
    label: "Critique",
  },
  haute: {
    bg: "hsl(38 92% 50% / 0.04)",
    border: "hsl(38 92% 50%)",
    badge: "hsl(38 92% 50% / 0.10)",
    text: "hsl(38 92% 50%)",
    label: "Haute",
  },
  moyenne: {
    bg: "hsl(217 91% 60% / 0.04)",
    border: "hsl(217 91% 60%)",
    badge: "hsl(217 91% 60% / 0.10)",
    text: "hsl(217 91% 60%)",
    label: "Moyenne",
  },
  info: {
    bg: "hsl(var(--muted) / 0.5)",
    border: "hsl(var(--border))",
    badge: "hsl(var(--muted))",
    text: "hsl(var(--muted-foreground))",
    label: "Info",
  },
};

const conformite = [
  { label: "Seuils de procédure respectés", value: "139/147", ok: true  },
  { label: "Codes nomenclature exhaustifs",  value: "96%",     ok: true  },
  { label: "Codes mutuellement exclusifs",   value: "98%",     ok: true  },
  { label: "Dossiers documentés",            value: "91%",     ok: true  },
  { label: "Marchés sans justification",     value: "5",       ok: false },
  { label: "Risques fractionnement actifs",  value: "3",       ok: false },
];

const transformation = [
  { label: "Gain en anticipation",  value: "+18 j",  sub: "Délai moyen de préparation vs N-1",     icon: Clock    },
  { label: "Réduction du risque",   value: "-62%",   sub: "Anomalies détectées en amont",           icon: Shield   },
  { label: "Lisibilité budgétaire", value: "+34%",   sub: "Taux de classification automatique",     icon: BarChart3 },
];

/* ── Chart tooltip styles ── */
const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(var(--popover-foreground))",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  itemStyle: { color: "hsl(var(--foreground))" },
  cursor: { fill: "hsl(var(--muted) / 0.5)" },
};

const axisStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const gridStyle = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" };

/* ── Section wrapper ── */
function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1800px] mx-auto">

      {/* ── Page header ── */}
      <Section delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <p className="section-label mb-2.5">Pilotage stratégique</p>
            <h1 className="mb-2 text-2xl sm:text-[28px]">
              Tableau de bord
            </h1>
            <p className="text-[13px] sm:text-[14px] text-muted-foreground font-medium">
              Vision consolidée · Exercice budgétaire 2026 · Métropole de Lyon
            </p>
          </div>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <div className="badge-conforme text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              Conforme CCP 2024
            </div>
            <div className="badge-conforme text-[11px]">
              <Shield className="w-3 h-3" />
              RGPD
            </div>
          </div>
        </div>
      </Section>

      {/* ── KPIs stratégiques ── */}
      <Section delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpisStrategiques.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 + index * 0.07, ease: "easeOut" }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="stat-card group cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                  style={{
                    background: "hsl(var(--primary) / 0.09)",
                    border: "1px solid hsl(var(--primary) / 0.18)",
                  }}
                >
                  <kpi.icon className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} strokeWidth={2} />
                </div>
                <span
                  className="text-[11px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                  style={{
                    color: kpi.positive ? "hsl(142 71% 40%)" : "hsl(38 92% 45%)",
                    background: kpi.positive ? "hsl(142 71% 45% / 0.10)" : "hsl(38 92% 50% / 0.10)",
                  }}
                >
                  {kpi.positive
                    ? <ArrowUpRight className="w-3 h-3" />
                    : <Gauge className="w-3 h-3" />
                  }
                  {kpi.sub}
                </span>
              </div>
              <div className="metric-block">
                <span className="metric-value">{kpi.value}</span>
                <span className="metric-label mt-0.5">{kpi.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── KPIs secondaires ── */}
      <Section delay={0.1}>
        <StatsGrid stats={kpisSecondaires} columns="4" />
      </Section>

      {/* ── Charts row ── */}
      <Section delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Maturité achats */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                <Gauge className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                Indice de maturité achats
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-36 w-36">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="68%" outerRadius="100%"
                    startAngle={180} endAngle={0}
                    data={maturiteData}
                  >
                    <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={4} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-8 mb-4">
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "hsl(var(--primary))",
                  }}
                >
                  68
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                  Niveau : Structuré
                </p>
              </div>
              <div className="w-full space-y-2">
                {[
                  { label: "Nomenclature",    score: 82, color: PALETTE.primary   },
                  { label: "Planification",   score: 71, color: PALETTE.secondary },
                  { label: "Sécurité jur.",   score: 65, color: PALETTE.tertiary  },
                  { label: "Mutualisation",   score: 54, color: PALETTE.accent    },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-[11px]">
                    <span className="w-24 text-muted-foreground truncate">{item.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <span className="w-7 text-right font-semibold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Répartition par procédure */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Répartition par procédure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={procedureData}
                      dataKey="value"
                      innerRadius={32}
                      outerRadius={62}
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {procedureData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle.contentStyle}
                      itemStyle={tooltipStyle.itemStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-1">
                {procedureData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-[11px]">
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground flex-1 truncate">{item.name}</span>
                    <span className="font-semibold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline + Budget */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold">
                  Planning des passations 2026
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineData} barGap={1}>
                      <CartesianGrid {...gridStyle} vertical={false} />
                      <XAxis dataKey="mois" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={22} />
                      <Tooltip
                        contentStyle={tooltipStyle.contentStyle}
                        itemStyle={tooltipStyle.itemStyle}
                        cursor={tooltipStyle.cursor}
                      />
                      <Bar dataKey="passations"   name="Réalisé"       fill={PALETTE.primary}   radius={[3, 3, 0, 0]} barSize={10} />
                      <Bar dataKey="previsionnel" name="Prévisionnel"   fill={PALETTE.secondary} radius={[3, 3, 0, 0]} barSize={10} opacity={0.65} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-2 h-2 rounded-sm" style={{ background: PALETTE.primary }} />
                    Réalisé
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-2 h-2 rounded-sm opacity-65" style={{ background: PALETTE.secondary }} />
                    Prévisionnel
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold">
                  Dépenses consolidées par direction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetByDirection} layout="vertical" barSize={12}>
                      <CartesianGrid {...gridStyle} horizontal={false} />
                      <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis
                        dataKey="direction" type="category"
                        width={88} tick={axisStyle} axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle.contentStyle}
                        itemStyle={tooltipStyle.itemStyle}
                        cursor={tooltipStyle.cursor}
                        formatter={(v: number) => [`${v} M€`, "Budget"]}
                      />
                      <Bar
                        dataKey="montant"
                        fill={PALETTE.primary}
                        radius={[0, 3, 3, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* ── Alertes réglementaires ── */}
      <Section delay={0.2}>
        <div>
          <p className="section-label mb-3">Alertes réglementaires</p>
          <div className="space-y-2">
            {alertes.map((a, i) => {
              const cfg = severityConfig[a.severity];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.22 + i * 0.06, ease: "easeOut" }}
                  className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border-l-[3px] transition-all duration-200 hover:shadow-sm"
                  style={{
                    background: cfg.bg,
                    borderLeftColor: cfg.border,
                    borderTop: "1px solid hsl(var(--border) / 0.5)",
                    borderRight: "1px solid hsl(var(--border) / 0.5)",
                    borderBottom: "1px solid hsl(var(--border) / 0.5)",
                  }}
                >
                  <a.icon
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: cfg.text }}
                    strokeWidth={2}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.1em] mb-1"
                      style={{ background: cfg.badge, color: cfg.text }}
                    >
                      {cfg.label}
                    </span>
                    <p className="text-[13px] sm:text-[14px] text-foreground leading-relaxed font-medium">
                      {a.message}
                    </p>
                  </div>
                  <button
                    className="text-[12px] font-semibold flex items-center gap-1 flex-shrink-0 transition-colors hover:opacity-70"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    Traiter <ArrowUpRight className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Conformité + Impact stratégique ── */}
      <Section delay={0.25}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Conformité */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                Indicateurs de conformité réglementaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {conformite.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-muted/20 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: item.ok ? "hsl(var(--success))" : "hsl(var(--destructive))",
                        boxShadow: item.ok
                          ? "0 0 5px hsl(var(--success) / 0.5)"
                          : "0 0 5px hsl(var(--destructive) / 0.5)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground truncate">{item.label}</p>
                      <p
                        className="text-sm font-bold tabular-nums"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: item.ok ? "hsl(var(--foreground))" : "hsl(var(--destructive))",
                        }}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact stratégique */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                Impact stratégique — Transformation achats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {transformation.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20 transition-colors hover:bg-muted/40"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "hsl(var(--primary) / 0.09)",
                      border: "1px solid hsl(var(--primary) / 0.18)",
                    }}
                  >
                    <t.icon className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.sub}</p>
                  </div>
                  <span
                    className="text-xl font-bold tabular-nums"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "hsl(var(--primary))",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {t.value}
                  </span>
                </div>
              ))}

              {/* Suggestion block */}
              <div
                className="p-3.5 rounded-lg text-[12px] leading-relaxed"
                style={{
                  background: "hsl(var(--primary) / 0.06)",
                  border: "1px solid hsl(var(--primary) / 0.18)",
                }}
              >
                <p
                  className="font-bold text-[10px] uppercase tracking-[0.1em] mb-1.5"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  Suggestion d'optimisation
                </p>
                <p className="text-muted-foreground">
                  3 familles d'achats pourraient être regroupées en accord-cadre, réduisant les coûts de
                  passation de ~15% et renforçant la sécurité juridique.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}
