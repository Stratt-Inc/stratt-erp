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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const marches = [
  { id: "M2026-001", objet: "Maintenance ascenseurs — Lot 1 Centre", service: "DGA Bâtiments", montant: "120 000 €", procedure: "Appel d'offres", echeance: "15/03/2026", statut: "En cours", priorite: "haute" },
  { id: "M2026-012", objet: "Fournitures bureau groupement", service: "DGA Support", montant: "45 000 €", procedure: "MAPA", echeance: "22/04/2026", statut: "Planifié", priorite: "normale" },
  { id: "M2026-018", objet: "Logiciel GRH — Renouvellement", service: "DGA RH", montant: "280 000 €", procedure: "Appel d'offres", echeance: "01/06/2026", statut: "Planifié", priorite: "haute" },
  { id: "M2026-023", objet: "Nettoyage locaux administratifs", service: "DGA Moyens Généraux", montant: "95 000 €", procedure: "MAPA", echeance: "30/05/2026", statut: "Alerte", priorite: "critique" },
  { id: "M2026-031", objet: "Études géotechniques ZAC Nord", service: "DGA Urbanisme", montant: "58 000 €", procedure: "MAPA", echeance: "15/07/2026", statut: "Planifié", priorite: "normale" },
  { id: "M2026-042", objet: "Accord-cadre impression", service: "DGA Communication", montant: "200 000 €", procedure: "Accord-cadre", echeance: "01/09/2026", statut: "En cours", priorite: "normale" },
  { id: "M2026-055", objet: "Mobilier scolaire — Écoles primaires", service: "DGA Éducation", montant: "175 000 €", procedure: "Appel d'offres", echeance: "30/06/2026", statut: "Planifié", priorite: "haute" },
];

const ganttData = [
  { mois: "Jan", ao: 3, mapa: 5, ac: 1 },
  { mois: "Fév", ao: 4, mapa: 6, ac: 0 },
  { mois: "Mar", ao: 6, mapa: 8, ac: 2 },
  { mois: "Avr", ao: 3, mapa: 7, ac: 1 },
  { mois: "Mai", ao: 5, mapa: 6, ac: 1 },
  { mois: "Jun", ao: 7, mapa: 9, ac: 2 },
  { mois: "Jul", ao: 2, mapa: 5, ac: 1 },
  { mois: "Aoû", ao: 1, mapa: 3, ac: 0 },
  { mois: "Sep", ao: 4, mapa: 6, ac: 2 },
  { mois: "Oct", ao: 3, mapa: 5, ac: 1 },
  { mois: "Nov", ao: 2, mapa: 4, ac: 1 },
  { mois: "Déc", ao: 1, mapa: 3, ac: 0 },
];

const statusColor: Record<string, string> = {
  "En cours": "bg-info/10 text-info border-info/20",
  "Planifié": "bg-muted text-muted-foreground border-border",
  "Alerte": "bg-destructive/10 text-destructive border-destructive/20",
};

const prioriteColor: Record<string, string> = {
  "normale": "bg-secondary text-secondary-foreground",
  "haute": "bg-warning/10 text-warning",
  "critique": "bg-destructive/10 text-destructive",
};

export default function Planification() {
  const [view, setView] = useState<"tableau" | "calendrier">("tableau");
  const [selectedMarche, setSelectedMarche] = useState<string | null>(null);
  const selected = marches.find((m) => m.id === selectedMarche);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planification des passations</h1>
          <p className="text-sm text-muted-foreground mt-1">Pilotage stratégique des marchés — 147 marchés planifiés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" /> Filtres
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" /> Nouveau marché
          </Button>
        </div>
      </div>

      {/* Timeline Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarRange className="w-4 h-4" />
            Planning annuel des passations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ganttData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 89%)" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "hsl(215, 12%, 50%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(215, 12%, 50%)" }} />
                <Tooltip />
                <Bar dataKey="ao" name="Appel d'offres" stackId="a" fill="hsl(215, 55%, 22%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="mapa" name="MAPA" stackId="a" fill="hsl(205, 85%, 50%)" />
                <Bar dataKey="ac" name="Accord-cadre" stackId="a" fill="hsl(168, 40%, 42%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-3 justify-center">
            {[
              { label: "Appel d'offres", color: "hsl(215, 55%, 22%)" },
              { label: "MAPA", color: "hsl(205, 85%, 50%)" },
              { label: "Accord-cadre", color: "hsl(168, 40%, 42%)" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un marché…" className="pl-9 text-sm" />
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="ml-auto">
          <TabsList className="h-8">
            <TabsTrigger value="tableau" className="text-xs gap-1.5 px-3"><LayoutList className="w-3.5 h-3.5" />Tableau</TabsTrigger>
            <TabsTrigger value="calendrier" className="text-xs gap-1.5 px-3"><Calendar className="w-3.5 h-3.5" />Calendrier</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table + Detail Panel */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="bg-card border rounded-md overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Objet du marché</th>
                  <th>Service</th>
                  <th>Montant</th>
                  <th>Procédure</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {marches.map((m) => (
                  <tr
                    key={m.id}
                    className={`cursor-pointer transition-colors ${selectedMarche === m.id ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedMarche(m.id)}
                  >
                    <td className="font-mono text-xs text-muted-foreground">{m.id}</td>
                    <td className="font-medium max-w-[240px] truncate">{m.objet}</td>
                    <td className="text-muted-foreground text-xs">{m.service}</td>
                    <td className="font-medium">{m.montant}</td>
                    <td><span className="text-xs">{m.procedure}</span></td>
                    <td className="text-xs text-muted-foreground">{m.echeance}</td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${statusColor[m.statut]}`}>
                        {m.statut}
                      </span>
                    </td>
                    <td><ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-card border rounded-md p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${statusColor[selected.statut]}`}>
                {selected.statut}
              </span>
            </div>
            <h3 className="font-semibold text-sm leading-snug">{selected.objet}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{selected.service}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Montant</span><span className="font-medium">{selected.montant}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Procédure</span><span>{selected.procedure}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Échéance</span><span>{selected.echeance}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priorité</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${prioriteColor[selected.priorite]}`}>{selected.priorite}</span>
              </div>
            </div>
            <div className="pt-3 border-t space-y-2">
              <Button size="sm" variant="outline" className="w-full gap-2 text-xs justify-start">
                <FileText className="w-3.5 h-3.5" /> Créer un scénario de passation
              </Button>
              <Button size="sm" variant="outline" className="w-full gap-2 text-xs justify-start">
                <Clock className="w-3.5 h-3.5" /> Simuler les délais
              </Button>
            </div>
            {selected.statut === "Alerte" && (
              <div className="p-3 rounded bg-destructive/5 border border-destructive/20 text-xs flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-destructive">Ce marché dépasse le seuil MAPA. Procédure formalisée requise.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
