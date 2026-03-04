import {
  Upload,
  BarChart3,
  TreeDeciduous,
  ArrowUpRight,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FolderOpen,
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
} from "recharts";

const treemapData = [
  {
    name: "Travaux",
    size: 28500000,
    children: [
      { name: "Bâtiment", size: 15000000 },
      { name: "Voirie", size: 8500000 },
      { name: "Réseaux", size: 5000000 },
    ],
  },
  {
    name: "Fournitures",
    size: 18200000,
    children: [
      { name: "Informatique", size: 7200000 },
      { name: "Bureau", size: 4500000 },
      { name: "Mobilier", size: 3500000 },
      { name: "Scolaire", size: 3000000 },
    ],
  },
  {
    name: "Services",
    size: 22800000,
    children: [
      { name: "Conseil", size: 8000000 },
      { name: "Nettoyage", size: 6000000 },
      { name: "Formation", size: 4800000 },
      { name: "Maintenance", size: 4000000 },
    ],
  },
  {
    name: "PI / TIC",
    size: 14700000,
    children: [
      { name: "Logiciels", size: 8000000 },
      { name: "Télécom", size: 4200000 },
      { name: "Hébergement", size: 2500000 },
    ],
  },
];

const flatTreemap = treemapData.flatMap((cat) =>
  cat.children!.map((child) => ({
    name: `${cat.name} > ${child.name}`,
    size: child.size,
    category: cat.name,
  }))
);

const TREEMAP_COLORS = [
  "hsl(215, 55%, 22%)",
  "hsl(215, 45%, 35%)",
  "hsl(215, 40%, 48%)",
  "hsl(205, 85%, 50%)",
  "hsl(168, 40%, 42%)",
  "hsl(168, 35%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(215, 30%, 60%)",
  "hsl(215, 25%, 70%)",
  "hsl(205, 50%, 65%)",
  "hsl(168, 30%, 65%)",
  "hsl(215, 20%, 75%)",
  "hsl(168, 25%, 72%)",
];

const comparatif = [
  { famille: "Travaux", n: 28.5, n1: 26.2, delta: "+8.8%" },
  { famille: "Fournitures", n: 18.2, n1: 19.8, delta: "-8.1%" },
  { famille: "Services", n: 22.8, n1: 21.1, delta: "+8.1%" },
  { famille: "PI / TIC", n: 14.7, n1: 12.4, delta: "+18.5%" },
];

const anomalies = [
  { type: "fractionnement", message: "Fournitures informatiques : 12 marchés < 40k€ totalisent 380k€", severity: "haute" },
  { type: "concentration", message: "85% du budget Conseil attribué à 2 fournisseurs", severity: "moyenne" },
  { type: "classification", message: "23 achats non rattachés à une famille de nomenclature", severity: "basse" },
];

const directionData = [
  { name: "DGA Infrastructures", value: 28.5, color: "hsl(215, 55%, 22%)" },
  { name: "DGA Éducation", value: 18.2, color: "hsl(205, 85%, 50%)" },
  { name: "DGA Numérique", value: 14.7, color: "hsl(168, 40%, 42%)" },
  { name: "DGA Services", value: 12.3, color: "hsl(215, 40%, 48%)" },
  { name: "Autres", value: 10.5, color: "hsl(215, 25%, 70%)" },
];

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name } = props;
  if (width < 40 || height < 25) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={TREEMAP_COLORS[index % TREEMAP_COLORS.length]}
        stroke="hsl(0, 0%, 100%)"
        strokeWidth={2}
        rx={3}
      />
      {width > 70 && height > 35 && (
        <text
          x={x + 6}
          y={y + 16}
          fill="white"
          fontSize={10}
          fontWeight={500}
        >
          {name?.split(" > ")[1] || name}
        </text>
      )}
      {width > 70 && height > 50 && (
        <text
          x={x + 6}
          y={y + 30}
          fill="rgba(255,255,255,0.7)"
          fontSize={9}
        >
          {(props.size / 1000000).toFixed(1)} M€
        </text>
      )}
    </g>
  );
};

export default function Cartographie() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cartographie des achats</h1>
          <p className="text-sm text-muted-foreground mt-1">Vision stratégique et analyse budgétaire — 84,2 M€ consolidés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="w-3.5 h-3.5" /> Importer données
          </Button>
          <Button size="sm" className="gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Générer cartographie
          </Button>
        </div>
      </div>

      {/* Import Zone */}
      <Card className="shadow-sm border-dashed">
        <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Glissez-déposez vos fichiers ou cliquez pour importer</p>
            <p className="text-xs text-muted-foreground mt-1">Formats acceptés : .xlsx, .csv — Bases achats, nomenclatures</p>
          </div>
        </CardContent>
      </Card>

      {/* Treemap + Direction Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TreeDeciduous className="w-4 h-4" />
              Cartographie par famille d'achats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={flatTreemap}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  content={<CustomTreemapContent />}
                >
                  <Tooltip
                    formatter={(value: number) => [`${(value / 1000000).toFixed(2)} M€`, "Montant"]}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par direction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={directionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                    {directionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} M€`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {directionData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground truncate flex-1">{d.name}</span>
                  <span className="font-medium">{d.value} M€</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparatif N/N-1 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Comparatif année N / N-1 (M€)</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="data-table">
            <thead>
              <tr>
                <th>Famille d'achats</th>
                <th className="text-right">2026 (N)</th>
                <th className="text-right">2025 (N-1)</th>
                <th className="text-right">Variation</th>
              </tr>
            </thead>
            <tbody>
              {comparatif.map((c) => (
                <tr key={c.famille}>
                  <td className="font-medium flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    {c.famille}
                  </td>
                  <td className="text-right font-medium">{c.n}</td>
                  <td className="text-right text-muted-foreground">{c.n1}</td>
                  <td className="text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      c.delta.startsWith("+") ? "text-accent" : "text-destructive"
                    }`}>
                      {c.delta.startsWith("+") ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {c.delta}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Anomalies */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Anomalies détectées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {anomalies.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded border bg-card">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                a.severity === "haute" ? "bg-destructive" : a.severity === "moyenne" ? "bg-warning" : "bg-info"
              }`} />
              <div className="flex-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">{a.type}</span>
                <p className="text-sm mt-0.5">{a.message}</p>
              </div>
              <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1 flex-shrink-0">
                Détails <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
