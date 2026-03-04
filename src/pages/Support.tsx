import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Video,
  Download,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsGrid } from "@/components/StatsGrid";

const faqCategories = [
  {
    title: "Prise en main",
    icon: Zap,
    questions: [
      {
        q: "Comment démarrer avec Axiora ?",
        a: "Axiora s'organise autour de 5 modules principaux : Dashboard (vision globale), Planification (échéanciers), Cartographie (analyse dépenses), Nomenclature (structuration codes) et Exports (documents réglementaires). Nous recommandons de commencer par importer votre nomenclature existante via le module dédié.",
      },
      {
        q: "Comment importer mes données achats ?",
        a: "Rendez-vous dans le module Cartographie > 'Importer base achats'. Formats acceptés : XLSX, CSV. Les colonnes requises : code nomenclature, objet, montant, date, service. Un modèle type est disponible en téléchargement.",
      },
      {
        q: "Quelle est la différence entre nomenclature et cartographie ?",
        a: "La nomenclature structure vos codes achats en arborescence (familles/sous-familles). La cartographie analyse vos dépenses réelles mandatées et les rattache à ces codes pour détecter fractionnements et dépassements de seuils.",
      },
    ],
  },
  {
    title: "Conformité réglementaire",
    icon: Shield,
    questions: [
      {
        q: "Comment Axiora calcule-t-il les seuils de procédure ?",
        a: "Axiora consolide automatiquement toutes les dépenses par code nomenclature sur 12 mois glissants. Si le cumul dépasse les seuils CCP (40k€, 90k€, 215k€ selon la nature), une alerte fractionnement est déclenchée avec détail des MAPA concernés.",
      },
      {
        q: "Axiora est-il conforme RGPD ?",
        a: "Oui. Hébergement France (SecNumCloud), chiffrement de bout en bout, journalisation exhaustive, droit à l'oubli intégré. Certification ISO 27001 + conformité RGAA 4.1 niveau AA. DPO disponible : dpo@axiora.fr",
      },
      {
        q: "Les exports sont-ils opposables juridiquement ?",
        a: "Oui. Tous les documents générés (cartographies, plannings, justificatifs de seuils) comportent métadonnées horodatées, hash SHA-256 et signature numérique. Recevabilité confirmée devant les juridictions administratives.",
      },
    ],
  },
  {
    title: "Utilisation avancée",
    icon: Users,
    questions: [
      {
        q: "Comment créer une nomenclature mutualisée multi-directions ?",
        a: "Module Nomenclature > 'Nouvelle famille' > Cocher 'Mutualisation activée'. Définissez ensuite les directions contributrices. Le système consolidera automatiquement leurs dépenses respectives et alertera en cas de dépassement du seuil global.",
      },
      {
        q: "Peut-on simuler plusieurs scénarios de planification ?",
        a: "Oui. Module Planification > Sélectionner un marché > 'Créer un scénario'. Vous pouvez tester différentes dates de passation, lots, groupements et visualiser l'impact sur la charge prévisionnelle et les chevauchements.",
      },
      {
        q: "Comment partager un export avec un élu ou la direction ?",
        a: "Tous les exports disposent d'un lien sécurisé généré automatiquement (validité 30 jours). Alternativement, utilisez l'envoi direct par email avec PDF joint + synthèse exécutive en corps de message.",
      },
    ],
  },
];

const ressources = [
  {
    titre: "Guide de démarrage rapide",
    description: "Prise en main en 15 minutes · Import données · Première cartographie",
    type: "PDF",
    size: "2,4 Mo",
    icon: BookOpen,
  },
  {
    titre: "Manuel utilisateur complet",
    description: "Documentation exhaustive · Tous modules · Cas d'usage métier",
    type: "PDF",
    size: "12,8 Mo",
    icon: FileText,
  },
  {
    titre: "Vidéo : Détecter les fractionnements",
    description: "Tutoriel 8 min · Consolidation MAPA · Alertes seuils",
    type: "MP4",
    size: "45 Mo",
    icon: Video,
  },
  {
    titre: "Modèle import base achats",
    description: "Template XLSX · Colonnes requises · Exemples",
    type: "XLSX",
    size: "156 Ko",
    icon: Download,
  },
  {
    titre: "Référentiel seuils CCP 2024",
    description: "Grille officielle · Évolutions réglementaires · Jurisprudence",
    type: "PDF",
    size: "890 Ko",
    icon: Shield,
  },
  {
    titre: "Webinaire : Axiora en collectivité",
    description: "Replay 45 min · Retour d'expérience Métropole de Lyon",
    type: "Vidéo",
    size: "380 Mo",
    icon: Video,
  },
];

const tickets = [
  { id: "#2457", objet: "Import XLSX bloqué > 5000 lignes", statut: "En cours", date: "04/03/2026", priorite: "Haute" },
  { id: "#2441", objet: "Ajout logo personnalisé exports PDF", statut: "Résolu", date: "28/02/2026", priorite: "Normale" },
  { id: "#2398", objet: "Formation équipe achats — date à définir", statut: "Planifié", date: "15/02/2026", priorite: "Normale" },
];

const statusStyles: Record<string, string> = {
  "En cours": "bg-info/8 text-info border-info/15",
  "Résolu": "bg-success/8 text-success border-success/15",
  "Planifié": "bg-muted text-muted-foreground border-border",
};

const prioriteStyles: Record<string, string> = {
  Haute: "text-warning",
  Normale: "text-muted-foreground",
};

export default function Support() {
  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <p className="section-label mb-2">Centre d'aide</p>
          <h1 className="mb-2">Support & Assistance</h1>
          <p className="text-[14px] text-muted-foreground">
            Documentation, FAQ, contact équipe Axiora
          </p>
        </div>
        <Button size="sm" className="gap-2 text-[13px] h-9 rounded-lg">
          <MessageSquare className="w-4 h-4" /> Nouveau ticket
        </Button>
      </div>

      {/* Stats Support */}
      <StatsGrid
        stats={[
          { label: "Tickets ouverts", value: "1", icon: MessageSquare },
          { label: "Temps de réponse", value: "2h15", icon: Clock, trend: { value: "-15min", positive: true } },
          { label: "Ressources disponibles", value: "24", icon: BookOpen, trend: { value: "+6", positive: true } },
          { label: "Satisfaction", value: "4.8/5", icon: CheckCircle2 },
        ]}
        columns="4"
      />

      {/* Barre de recherche */}
      <Card className="border-2">
        <CardContent className="py-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans la documentation, FAQ, tutoriels..."
                className="pl-14 h-14 text-[15px] rounded-xl border-2"
              />
            </div>
            <div className="flex gap-2.5 mt-4 justify-center flex-wrap">
              {["Import données", "Seuils CCP", "Nomenclature", "Fractionnement", "Exports PDF"].map((tag) => (
                <button
                  key={tag}
                  className="px-3.5 py-1.5 text-[12px] font-medium rounded-lg border-2 hover:bg-muted transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="ressources" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Ressources
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <FileText className="w-4 h-4" />
            Mes tickets
          </TabsTrigger>
        </TabsList>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-3">
          {faqCategories.map((cat) => (
            <Card key={cat.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <cat.icon className="w-4 h-4 text-primary" />
                  {cat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cat.questions.map((item, i) => (
                  <div key={i} className="border-l-2 border-primary/20 pl-4 py-2">
                    <p className="text-[13px] font-semibold text-foreground mb-1.5">{item.q}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground mb-1">
                  Vous ne trouvez pas la réponse à votre question ?
                </p>
                <p className="text-[12px] text-muted-foreground mb-3">
                  Notre équipe support est disponible du lundi au vendredi, 9h–18h.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1.5">
                    <Mail className="w-3 h-3" /> support@axiora.fr
                  </Button>
                  <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1.5">
                    <Phone className="w-3 h-3" /> 01 XX XX XX XX
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ressources */}
        <TabsContent value="ressources" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ressources.map((res, i) => (
              <Card key={i} className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <res.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground mb-0.5 truncate">
                      {res.titre}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mb-2">
                      {res.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="font-medium">{res.type}</span>
                      <span>·</span>
                      <span>{res.size}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                    <Download className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                Liens utiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Base de connaissance Axiora", url: "docs.axiora.fr" },
                { label: "Code de la commande publique (Légifrance)", url: "legifrance.gouv.fr" },
                { label: "Observatoire économique de la commande publique", url: "economie.gouv.fr/cecp" },
                { label: "Guide pratique de l'achat public (DAE)", url: "economie.gouv.fr/dae" },
              ].map((link, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex items-center justify-between p-2.5 rounded border hover:bg-muted transition-colors group"
                >
                  <span className="text-[12px] text-foreground group-hover:text-primary transition-colors">
                    {link.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{link.url}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Support technique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Email</p>
                  <p className="text-[13px] font-medium">support@axiora.fr</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Horaires</p>
                  <p className="text-[13px] font-medium">Lundi – Vendredi, 9h – 18h</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Délai de réponse</p>
                  <p className="text-[13px] font-medium">2h en moyenne</p>
                </div>
                <Button className="w-full gap-2 text-[12px]">
                  <Mail className="w-3.5 h-3.5" /> Envoyer un email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Assistance téléphonique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Standard</p>
                  <p className="text-[13px] font-medium">01 XX XX XX XX</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Urgences (hors horaires)</p>
                  <p className="text-[13px] font-medium">06 XX XX XX XX</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Disponibilité</p>
                  <p className="text-[13px] font-medium">Lundi – Vendredi, 9h – 18h</p>
                </div>
                <Button className="w-full gap-2 text-[12px]">
                  <Phone className="w-3.5 h-3.5" /> Demander un rappel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Formation & accompagnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Contact formation</p>
                  <p className="text-[13px] font-medium">formation@axiora.fr</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Sessions</p>
                  <p className="text-[13px] font-medium">Sur site ou distanciel</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Durée</p>
                  <p className="text-[13px] font-medium">½ journée à 2 jours</p>
                </div>
                <Button variant="outline" className="w-full gap-2 text-[12px]">
                  <BookOpen className="w-3.5 h-3.5" /> Demander un devis
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Sécurité & DPO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">DPO (RGPD)</p>
                  <p className="text-[13px] font-medium">dpo@axiora.fr</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Incident de sécurité</p>
                  <p className="text-[13px] font-medium">security@axiora.fr</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Certifications</p>
                  <p className="text-[13px] font-medium">ISO 27001 · SecNumCloud</p>
                </div>
                <Button variant="outline" className="w-full gap-2 text-[12px]">
                  <Shield className="w-3.5 h-3.5" /> Politique de sécurité
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mes tickets */}
        <TabsContent value="tickets" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px]">Tickets récents</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N° Ticket</th>
                    <th>Objet</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Priorité</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="cursor-pointer hover:bg-muted/50">
                      <td className="font-mono text-[11px] text-primary">{t.id}</td>
                      <td className="font-medium text-[12px]">{t.objet}</td>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${statusStyles[t.statut]}`}>
                          {t.statut}
                        </span>
                      </td>
                      <td className="text-[11px] text-muted-foreground tabular-nums">{t.date}</td>
                      <td className={`text-[11px] font-medium ${prioriteStyles[t.priorite]}`}>
                        {t.priorite}
                      </td>
                      <td>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-[13px] font-medium text-foreground mb-1">Besoin d'aide ?</p>
              <p className="text-[11px] text-muted-foreground mb-4">
                Créez un nouveau ticket et notre équipe vous répondra sous 2h.
              </p>
              <Button size="sm" className="gap-2">
                <MessageSquare className="w-3.5 h-3.5" /> Ouvrir un ticket
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

