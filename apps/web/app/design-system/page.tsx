"use client";

/**
 * AXIORA DESIGN SYSTEM — Exemples d'utilisation
 *
 * Fichier de référence pour l'implémentation des composants institutionnels
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Shield,
  TrendingUp,
  Scale
} from "lucide-react";

/**
 * ═══════════════════════════════════════════════════════════════
 * 1. BOUTONS INSTITUTIONNELS
 * ═══════════════════════════════════════════════════════════════
 */

export const ExemplesBoutons = () => (
  <div className="space-y-4">
    <h3 className="font-semibold">Boutons stratégiques</h3>

    {/* Action principale */}
    <Button variant="default">
      <Target className="w-4 h-4" />
      Générer cartographie
    </Button>

    {/* Validation conformité */}
    <Button variant="success">
      <CheckCircle2 className="w-4 h-4" />
      Valider conformité
    </Button>

    {/* Alerte seuil */}
    <Button variant="alert">
      <AlertTriangle className="w-4 h-4" />
      Corriger fractionnement
    </Button>

    {/* Action secondaire */}
    <Button variant="outline" size="sm">
      Exporter données
    </Button>
  </div>
);

/**
 * ═══════════════════════════════════════════════════════════════
 * 2. BADGES STATUTS RÉGLEMENTAIRES
 * ═══════════════════════════════════════════════════════════════
 */

export const ExemplesBadges = () => (
  <div className="flex flex-wrap gap-2">
    <Badge variant="conforme">Conforme</Badge>
    <Badge variant="surveille">À surveiller</Badge>
    <Badge variant="risque">Risque</Badge>
    <Badge variant="fractionnement">Fractionnement</Badge>
    <Badge variant="info">Info</Badge>
  </div>
);

/**
 * ═══════════════════════════════════════════════════════════════
 * 3. CARDS KPI INSTITUTIONNELLES
 * ═══════════════════════════════════════════════════════════════
 */

export const ExemplesCardsKPI = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* KPI standard */}
    <Card className="kpi-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          Marchés planifiés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="metric-block">
          <span className="metric-value">147</span>
          <span className="metric-sub text-success">+12 vs N-1</span>
        </div>
      </CardContent>
    </Card>

    {/* Alerte critique */}
    <Card className="alert-card critique">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <p className="font-semibold text-sm">Fractionnement détecté</p>
            <p className="text-xs text-muted-foreground">
              12 MAPA « Fournitures informatiques » totalisent 380k€
            </p>
            <Badge variant="fractionnement">Action requise</Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Conformité */}
    <Card className="border-l-4 border-l-success">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Sécurité juridique</p>
            <div className="mt-2">
              <span className="metric-value text-2xl">94%</span>
              <span className="metric-sub block">Contrats conformes CCP</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * ═══════════════════════════════════════════════════════════════
 * 4. TABLES INSTITUTIONNELLES AVEC SEUILS
 * ═══════════════════════════════════════════════════════════════
 */

const donneesTableau = [
  {
    code: "02.01",
    famille: "Fournitures informatiques",
    depense: 380000,
    seuil: 90000,
    ratio: 4.2,
    statut: "fractionnement" as const
  },
  {
    code: "03.02",
    famille: "Services nettoyage",
    depense: 245000,
    seuil: 215000,
    ratio: 1.1,
    statut: "surveille" as const
  },
  {
    code: "01.03",
    famille: "Travaux rénovation",
    depense: 35000,
    seuil: 40000,
    ratio: 0.87,
    statut: "conforme" as const
  },
];

export const ExempleTableInstitutionnelle = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <Scale className="w-4 h-4" />
        Analyse seuils réglementaires
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Famille d'achats</TableHead>
            <TableHead className="text-right">Dépense</TableHead>
            <TableHead className="text-right">Seuil</TableHead>
            <TableHead className="text-right">Ratio</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donneesTableau.map((row) => (
            <TableRow key={row.code}>
              <TableCell className="text-code font-mono">{row.code}</TableCell>
              <TableCell className="font-medium">{row.famille}</TableCell>
              <TableCell className="text-right text-amount font-mono">
                {row.depense.toLocaleString('fr-FR')} €
              </TableCell>
              <TableCell className="text-right text-amount font-mono text-muted-foreground">
                {row.seuil.toLocaleString('fr-FR')} €
              </TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {row.ratio.toFixed(1)}×
              </TableCell>
              <TableCell>
                <Badge variant={row.statut}>
                  {row.statut === "fractionnement" && "Fractionnement"}
                  {row.statut === "surveille" && "À surveiller"}
                  {row.statut === "conforme" && "Conforme"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

/**
 * ═══════════════════════════════════════════════════════════════
 * 5. LAYOUT MODULE DASHBOARD
 * ═══════════════════════════════════════════════════════════════
 */

export const ExempleLayoutModule = () => (
  <div className="p-6 space-y-5">
    {/* Header module */}
    <div className="flex items-start justify-between">
      <div>
        <p className="section-label mb-1">Module cartographie</p>
        <h1>Cartographie stratégique des achats</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Photographie fine de la dépense publique · 84,2 M€ consolidés
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Exporter
        </Button>
        <Button size="sm">
          <Target className="w-4 h-4" />
          Générer
        </Button>
      </div>
    </div>

    {/* KPIs compacts */}
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {[
        { label: "Familles", value: "14", icon: TrendingUp },
        { label: "Codes actifs", value: "86", icon: Target },
        { label: "Classifiés", value: "96%", icon: CheckCircle2 },
        { label: "Fractionnements", value: "5", icon: AlertTriangle, alert: true },
        { label: "Écart moyen", value: "4,2%", icon: Scale },
      ].map((kpi, idx) => (
        <div key={idx} className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <kpi.icon className={`w-3.5 h-3.5 ${kpi.alert ? 'text-destructive' : 'text-primary'}`} />
            <span className="metric-label">{kpi.label}</span>
          </div>
          <span className={`text-xl font-bold ${kpi.alert ? 'text-destructive' : 'text-foreground'}`}>
            {kpi.value}
          </span>
        </div>
      ))}
    </div>

    {/* Contenu principal */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8">
        <ExempleTableInstitutionnelle />
      </div>
      <div className="lg:col-span-4 space-y-4">
        <ExemplesCardsKPI />
      </div>
    </div>
  </div>
);

/**
 * ═══════════════════════════════════════════════════════════════
 * 6. CLASSES UTILITAIRES
 * ═══════════════════════════════════════════════════════════════
 */

export const ExemplesClassesUtilitaires = () => (
  <div className="space-y-6">
    {/* Labels sections */}
    <div>
      <p className="section-label">Module planification</p>
      <h2 className="mt-2">Programmation des marchés 2026</h2>
    </div>

    {/* Blocs métriques */}
    <div className="metric-block">
      <span className="metric-label">Montant prévisionnel</span>
      <span className="metric-value">84,2 M€</span>
      <span className="metric-sub">+8,3% vs N-1</span>
    </div>

    {/* Montants financiers */}
    <div>
      <span className="text-amount">84 200 000 €</span>
      <span className="text-muted-foreground text-sm ml-2">(montant HT)</span>
    </div>

    {/* Codes nomenclature */}
    <div className="flex items-center gap-2">
      <span className="text-code">02.01.05</span>
      <span className="text-sm">Matériel informatique professionnel</span>
    </div>

    {/* Indicateurs seuils */}
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2">
        <span className="seuil-indicator seuil-conforme"></span>
        <span className="text-sm">Conforme</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="seuil-indicator seuil-surveille"></span>
        <span className="text-sm">À surveiller</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="seuil-indicator seuil-attention"></span>
        <span className="text-sm">Attention</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="seuil-indicator seuil-critique"></span>
        <span className="text-sm">Critique</span>
      </span>
    </div>
  </div>
);

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORT PAGE DE DÉMONSTRATION
 * ═══════════════════════════════════════════════════════════════
 */

export default function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2 pb-8 border-b">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold">Axiora Design System</h1>
              <p className="text-sm text-muted-foreground">
                Plateforme institutionnelle des achats publics
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2>1. Boutons institutionnels</h2>
          <ExemplesBoutons />
        </section>

        <section className="space-y-4">
          <h2>2. Badges statuts réglementaires</h2>
          <ExemplesBadges />
        </section>

        <section className="space-y-4">
          <h2>3. Cards KPI</h2>
          <ExemplesCardsKPI />
        </section>

        <section className="space-y-4">
          <h2>4. Table institutionnelle</h2>
          <ExempleTableInstitutionnelle />
        </section>

        <section className="space-y-4">
          <h2>5. Classes utilitaires</h2>
          <ExemplesClassesUtilitaires />
        </section>
      </div>
    </div>
  );
}

