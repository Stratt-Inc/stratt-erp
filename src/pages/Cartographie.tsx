import {
  Upload,
  BarChart3,
  ArrowUpRight,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FolderOpen,
  Scale,
  Layers,
  Target,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CHART_COLORS, PALETTE, UI_COLORS, withAlpha } from "@/lib/palette";

/* ── Treemap data ── */
const flatTreemap = [
  { name: "Bâtiment", size: 15000000, category: "Travaux" },
  { name: "Voirie", size: 8500000, category: "Travaux" },
  { name: "Réseaux", size: 5000000, category: "Travaux" },
  { name: "Informatique", size: 7200000, category: "Fournitures" },
  { name: "Bureau", size: 4500000, category: "Fournitures" },
  { name: "Mobilier", size: 3500000, category: "Fournitures" },
  { name: "Scolaire", size: 3000000, category: "Fournitures" },
  { name: "Conseil", size: 8000000, category: "Services" },
  { name: "Nettoyage", size: 6000000, category: "Services" },
  { name: "Formation", size: 4800000, category: "Services" },
  { name: "Maintenance", size: 4000000, category: "Services" },
  { name: "Logiciels", size: 8000000, category: "PI/TIC" },
  { name: "Télécom", size: 4200000, category: "PI/TIC" },
  { name: "Hébergement", size: 2500000, category: "PI/TIC" },
];

const TREEMAP_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  withAlpha(PALETTE.primary, "E6"),
  withAlpha(PALETTE.primary, "CC"),
  withAlpha(PALETTE.secondary, "B3"),
  withAlpha(PALETTE.secondary, "99"),
  CHART_COLORS.accent,
  CHART_COLORS.accentSoft,
  withAlpha(PALETTE.accent, "E6"),
  withAlpha(PALETTE.tertiary, "CC"),
  withAlpha(PALETTE.primary, "CC"),
  withAlpha(PALETTE.secondary, "CC"),
  withAlpha(PALETTE.accentSoft, "CC"),
];

type TreemapContentProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  size?: number;
};

const CustomTreemapContent = (props: TreemapContentProps) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index = 0,
    name = "",
    size = 0,
  } = props;
  if (width < 30 || height < 20) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={TREEMAP_COLORS[index % TREEMAP_COLORS.length]} stroke={UI_COLORS.white} strokeWidth={2} rx={2} />
      {width > 60 && height > 28 && <text x={x + 5} y={y + 14} fill="white" fontSize={9} fontWeight={600}>{name}</text>}
      {width > 60 && height > 42 && <text x={x + 5} y={y + 26} fill="rgba(255,255,255,0.75)" fontSize={8}>{(size / 1000000).toFixed(1)} M€</text>}
    </g>
  );
};

/* ── Comparatif ── */
const comparatif = [
  { famille: "Travaux", n: 28.5, n1: 26.2, delta: "+8.8%", up: true },
  { famille: "Fournitures", n: 18.2, n1: 19.8, delta: "-8.1%", up: false },
  { famille: "Services", n: 22.8, n1: 21.1, delta: "+8.1%", up: true },
  { famille: "PI / TIC", n: 14.7, n1: 12.4, delta: "+18.5%", up: true },
];

/* ── Seuils (from livre blanc) ── */
const seuilsData = [
  { code: "02.01 — Informatique", depense: 380, seuil: 90, ratio: 4.2, statut: "Fractionnement" },
  { code: "03.02 — Nettoyage", depense: 245, seuil: 90, ratio: 2.7, statut: "Fractionnement" },
  { code: "01.01 — Bâtiment neuf", depense: 1200, seuil: 215, ratio: 5.6, statut: "AO requis" },
  { code: "04.01 — Logiciels", depense: 520, seuil: 215, ratio: 2.4, statut: "AO requis" },
  { code: "02.04 — Scolaire", depense: 85, seuil: 90, ratio: 0.94, statut: "Conforme" },
];

/* ── Direction pie ── */
const directionData = [
  { name: "Infrastructures", value: 28.5, color: CHART_COLORS.primary },
  { name: "Éducation", value: 18.2, color: CHART_COLORS.secondary },
  { name: "Numérique", value: 14.7, color: CHART_COLORS.tertiary },
  { name: "Services", value: 12.3, color: CHART_COLORS.accent },
  { name: "Autres", value: 10.5, color: CHART_COLORS.accentSoft },
];

/* ── Écarts budgétaires ── */
const ecartsData = [
  { direction: "Infrastructures", prevu: 30.0, execute: 28.5 },
  { direction: "Éducation", prevu: 17.0, execute: 18.2 },
  { direction: "Numérique", prevu: 13.5, execute: 14.7 },
  { direction: "Services", prevu: 12.0, execute: 12.3 },
  { direction: "RH", prevu: 6.0, execute: 5.8 },
];

/* ── Anomalies ── */
const anomalies = [
  { type: "Fractionnement", message: "02.01 Fournitures informatiques : 12 MAPA < 40k€ totalisent 380k€ — seuil de publicité dépassé", severity: "haute" },
  { type: "Concentration", message: "85% du budget « Conseil » attribué à 2 fournisseurs — défaut de mise en concurrence", severity: "moyenne" },
  { type: "Classification", message: "23 dépenses mandatées non rattachées à un code de nomenclature", severity: "basse" },
  { type: "Seuil dépassé", message: "Code 04.01 Logiciels : 520k€ sans procédure formalisée — AO requis", severity: "haute" },
];

export default function Cartographie() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">Module cartographie</p>
          <h1>Cartographie stratégique des achats</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Photographie fine de la dépense publique · 84,2 M€ consolidés · 14 familles homogènes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-[12px]">
            <Upload className="w-3.5 h-3.5" /> Importer base achats
          </Button>
          <Button size="sm" className="gap-2 text-[12px]">
            <BarChart3 className="w-3.5 h-3.5" /> Générer cartographie
          </Button>
        </div>
      </div>

      {/* KPIs Carto */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Familles d'achats", value: "14", icon: Layers },
          { label: "Codes nomenclature", value: "86", icon: FolderOpen },
          { label: "Dépenses classifiées", value: "96%", icon: CheckCircle2 },
          { label: "Fractionnements détectés", value: "5", icon: Scale, alert: true },
          { label: "Écart budgétaire moyen", value: "4,2%", icon: Target },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-3.5 h-3.5 ${kpi.alert ? "text-destructive" : "text-primary"}`} />
              <span className="metric-label">{kpi.label}</span>
            </div>
            <span className={`text-xl font-bold ${kpi.alert ? "text-destructive" : "text-foreground"}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Import Zone */}
      <Card className="border-dashed">
        <CardContent className="py-6 flex items-center gap-6">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <Upload className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium">Importer vos données d'achats</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Glissez-déposez vos fichiers (.xlsx, .csv) — Dépenses mandatées, bases achats, exports progiciel financier
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-[12px]">Parcourir</Button>
        </CardContent>
      </Card>

      {/* Treemap + Direction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <Card className="lg:col-span-8">
          <CardHeader className="pb-1">
            <CardTitle className="text-[13px] flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Cartographie par famille d'achats homogène
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap data={flatTreemap} dataKey="size" aspectRatio={4 / 3} content={<CustomTreemapContent />}>
                  <Tooltip formatter={(v: number) => [`${(v / 1000000).toFixed(2)} M€`, "Montant"]} />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-1">
            <CardTitle className="text-[13px]">Consolidation par direction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={directionData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" stroke={UI_COLORS.white} strokeWidth={2}>
                    {directionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} M€`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {directionData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                  <span className="font-semibold tabular-nums">{d.value} M€</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Computation des seuils (from livre blanc) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <Scale className="w-4 h-4 text-warning" />
            Computation des seuils de procédure
            <span className="text-[10px] text-muted-foreground font-normal ml-1">Art. L2124-1 CCP</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code nomenclature</th>
                <th className="text-right">Dépense cumulée (k€)</th>
                <th className="text-right">Seuil applicable (k€)</th>
                <th className="text-right">Ratio</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {seuilsData.map((s) => (
                <tr key={s.code}>
                  <td className="font-medium text-[12px]">{s.code}</td>
                  <td className="text-right tabular-nums text-[12px] font-semibold">{s.depense}</td>
                  <td className="text-right tabular-nums text-[12px] text-muted-foreground">{s.seuil}</td>
                  <td className="text-right tabular-nums text-[12px]">
                    <span className={s.ratio > 1 ? "text-destructive font-semibold" : "text-primary"}>{s.ratio.toFixed(1)}x</span>
                  </td>
                  <td>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      s.statut === "Conforme" ? "text-primary" : s.statut === "Fractionnement" ? "text-destructive" : "text-warning"
                    }`}>{s.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Comparatif + Écarts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px]">Comparatif N / N-1 (M€)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Famille</th>
                  <th className="text-right">2026 (N)</th>
                  <th className="text-right">2025 (N-1)</th>
                  <th className="text-right">Variation</th>
                </tr>
              </thead>
              <tbody>
                {comparatif.map((c) => (
                  <tr key={c.famille}>
                    <td className="font-medium text-[12px]">{c.famille}</td>
                    <td className="text-right font-semibold tabular-nums text-[12px]">{c.n}</td>
                    <td className="text-right text-muted-foreground tabular-nums text-[12px]">{c.n1}</td>
                    <td className="text-right">
                      <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${c.up ? "text-accent" : "text-destructive"}`}>
                        {c.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.delta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-[13px]">Écarts budgétaires par direction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ecartsData} layout="vertical" barGap={2} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke={UI_COLORS.lightStroke} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="direction" type="category" width={85} tick={{ fontSize: 10, fill: UI_COLORS.mutedText }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => `${v} M€`} />
                  <Bar dataKey="prevu" name="Prévu" fill={PALETTE.accent} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="execute" name="Exécuté" fill={PALETTE.primary} radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies */}
      <div>
        <p className="section-label mb-2">Anomalies détectées</p>
        <div className="space-y-2">
          {anomalies.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded border border-l-[3px] ${
              a.severity === "haute" ? "border-l-destructive bg-destructive/10" : a.severity === "moyenne" ? "border-l-warning bg-warning/15" : "border-l-muted-foreground bg-muted/30"
            }`}>
              <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                a.severity === "haute" ? "text-destructive" : a.severity === "moyenne" ? "text-warning" : "text-muted-foreground"
              }`} />
              <div className="flex-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  a.severity === "haute" ? "text-destructive" : a.severity === "moyenne" ? "text-warning" : "text-muted-foreground"
                }`}>{a.type}</span>
                <p className="text-[12px] text-foreground mt-0.5 leading-snug">{a.message}</p>
              </div>
              <button className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-0.5 flex-shrink-0">
                Détails <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
