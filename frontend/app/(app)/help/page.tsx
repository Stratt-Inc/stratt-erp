"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen, HelpCircle, FileText, Zap, ChevronRight, ExternalLink } from "lucide-react";
import { restartTour } from "@/components/onboarding/OnboardingTour";

interface HelpArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  legifrance?: string;
}

const ARTICLES: HelpArticle[] = [
  {
    id: "decp-obligation",
    category: "Réglementation",
    title: "Obligation de publication des DECP",
    summary: "Tout ce que vous devez savoir sur le décret n°2016-360 et les données essentielles.",
    content: "Depuis le 1er octobre 2018, tout acheteur public doit publier sur data.gouv.fr les données essentielles des marchés supérieurs à 25 000 € HT. Ces données incluent l'identité des acheteurs et titulaires, l'objet, le montant et la durée du marché.",
    tags: ["DECP", "data.gouv.fr", "obligation", "transparence"],
    legifrance: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000032295952",
  },
  {
    id: "seuils-procedures",
    category: "Procédures",
    title: "Seuils des procédures d'achat (2024)",
    summary: "MAPA, appel d'offres, procédure adaptée — quels seuils pour quelles procédures ?",
    content: "En dessous de 40 000 € HT : procédure allégée sans publicité obligatoire. De 40 000 € à 143 000 € (fournitures/services État) ou 221 000 € (collectivités) : MAPA avec publicité adaptée. Au-delà : appel d'offres ouvert ou restreint obligatoire.",
    tags: ["MAPA", "appel d'offres", "seuils", "AO", "procédure adaptée"],
    legifrance: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038358651",
  },
  {
    id: "boamp-veille",
    category: "BOAMP",
    title: "Configurer une veille BOAMP",
    summary: "Surveillez automatiquement les appels d'offres correspondant à vos besoins.",
    content: "Rendez-vous dans le module BOAMP > onglet Veille. Créez une alerte en renseignant des codes CPV, un département et des mots-clés. La veille s'exécute à la demande via le bouton 'Lancer' ou peut être planifiée.",
    tags: ["BOAMP", "veille", "CPV", "alerte", "appel d'offres"],
  },
  {
    id: "sirene-enrichissement",
    category: "Fournisseurs",
    title: "Enrichissement SIRENE des fournisseurs",
    summary: "Qualifiez automatiquement vos fournisseurs via l'API INSEE.",
    content: "Dans le CRM, ouvrez la fiche d'un contact fournisseur et cliquez 'Enrichir via SIRENE'. Renseignez le SIRET (14 chiffres). Les données légales (dénomination, adresse, NAF, effectifs, statut actif/cessé) sont récupérées et mises en cache 7 jours.",
    tags: ["SIRENE", "INSEE", "fournisseur", "enrichissement", "SIRET"],
  },
  {
    id: "roles-permissions",
    category: "Administration",
    title: "Gérer les rôles et permissions",
    summary: "Assignez des rôles à vos utilisateurs pour contrôler les accès.",
    content: "Dans Administration > Rôles, créez des rôles personnalisés (ex: Acheteur, Contrôleur). Chaque rôle se voit attribuer des permissions granulaires (crm.read, billing.write, admin.manage...). Assignez ensuite ces rôles à chaque membre de l'organisation.",
    tags: ["RBAC", "rôles", "permissions", "administration", "sécurité"],
  },
  {
    id: "marche-procedure",
    category: "Marchés",
    title: "Créer un marché public",
    summary: "Étapes pour saisir une procédure d'achat dans STRATT.",
    content: "Module Marchés > Nouveau marché. Renseignez l'objet, le code CPV, la procédure retenue, les dates clés (publication, remise offres, notification) et le montant estimé. Le module calcule automatiquement les délais légaux.",
    tags: ["marché", "CPV", "procédure", "calendrier", "AAPC"],
  },
  {
    id: "export-seda",
    category: "Archivage",
    title: "Export et archivage SEDA",
    summary: "Exportez un dossier marché complet conforme au standard SEDA pour archivage.",
    content: "SEDA (Standard d'Échange de Données pour l'Archivage) est obligatoire pour les versements aux Archives. L'export STRATT génère un bordereau XML conforme SEDA 2.1 incluant tous les documents du marché, les métadonnées et la table de gestion.",
    tags: ["SEDA", "archivage", "export", "dossier marché"],
  },
  {
    id: "glossaire-ao",
    category: "Glossaire",
    title: "AAPC — Avis d'Appel Public à la Concurrence",
    summary: "Publication obligatoire marquant le lancement d'une procédure formalisée.",
    content: "L'AAPC est l'avis de publicité qui informe les opérateurs économiques du lancement d'une procédure. Publié au BOAMP et/ou JOUE selon les seuils, il contient les informations essentielles : objet, acheteur, CPV, valeur estimée, délai de remise des offres.",
    tags: ["AAPC", "publicité", "BOAMP", "JOUE", "glossaire"],
    legifrance: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000038358497",
  },
  {
    id: "glossaire-cctp",
    category: "Glossaire",
    title: "CCTP — Cahier des Clauses Techniques Particulières",
    summary: "Document définissant les spécifications techniques du marché.",
    content: "Le CCTP définit les prestations attendues du titulaire d'un point de vue technique. Il précise les caractéristiques techniques, les normes applicables, les modalités de livraison/exécution et les critères de performance. Il fait partie du DCE.",
    tags: ["CCTP", "DCE", "spécifications techniques", "glossaire"],
  },
  {
    id: "glossaire-mapa",
    category: "Glossaire",
    title: "MAPA — Marché à Procédure Adaptée",
    summary: "Procédure souple pour les marchés sous les seuils européens.",
    content: "Le MAPA permet à l'acheteur d'adapter librement les modalités de mise en concurrence aux caractéristiques du besoin. Il fixe lui-même les règles de publicité et de mise en concurrence, dans le respect des principes fondamentaux : égalité de traitement, transparence, libre accès.",
    tags: ["MAPA", "procédure adaptée", "seuils", "mise en concurrence", "glossaire"],
  },
];

const CATEGORIES = ["Tous", ...Array.from(new Set(ARTICLES.map((a) => a.category)))];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ARTICLES.filter((a) => {
      const matchCat = category === "Tous" || a.category === category;
      const matchQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [query, category]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <HelpCircle size={24} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centre d&apos;aide</h1>
          <p className="text-sm text-gray-500">Documentation, glossaire et guides réglementaires</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => restartTour()}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }}>
            <Zap size={16} className="text-white fill-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Tour guidé</p>
            <p className="text-xs text-gray-400">Relancer la visite</p>
          </div>
        </button>

        <a
          href="https://www.legifrance.gouv.fr/codes/id/LEGITEXT000037701019"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <FileText size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Code Commande Publique</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">Legifrance <ExternalLink size={10} /></p>
          </div>
        </a>

        <a
          href="https://www.data.gouv.fr/fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">DECP data.gouv.fr</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">Schéma officiel <ExternalLink size={10} /></p>
          </div>
        </a>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher : MAPA, CCTP, seuils, DECP..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === cat
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={category === cat ? { background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Search size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun article trouvé pour &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {filtered.map((article) => (
          <div
            key={article.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === article.id ? null : article.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full shrink-0">
                  {article.category}
                </span>
                <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
              </div>
              <ChevronRight
                size={15}
                className={`text-gray-400 transition-transform shrink-0 ml-2 ${expanded === article.id ? "rotate-90" : ""}`}
              />
            </button>

            {expanded === article.id && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                <p className="text-sm text-gray-500 italic">{article.summary}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{article.content}</p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {article.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => { setQuery(tag); setExpanded(null); }}
                        className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full hover:bg-gray-200"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {article.legifrance && (
                    <a
                      href={article.legifrance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink size={11} />
                      Legifrance
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        {ARTICLES.length} articles disponibles · Mis à jour selon les évolutions du Code de la Commande Publique
      </p>
    </div>
  );
}
