# PRODUCT VISION — Axiora

---

## 1. Analyse du produit

### Modules fonctionnels identifiés

L'analyse de la maquette révèle **6 modules fonctionnels** :

| Module | Description | Valeur métier |
|--------|-------------|---------------|
| **Dashboard** | KPIs stratégiques, maturité achats, alertes réglementaires | Vision consolidée temps réel |
| **Nomenclature** | Arborescence hiérarchique codes achats (CECPA/CartoAP) | Fondation de toute la conformité |
| **Cartographie** | Analyse de la dépense par famille homogène, treemap, seuils | Détection fractionnement, AO requis |
| **Planification** | Gestion des passations, calendrier, charge prévisionnelle | Anticiper, éviter les urgences |
| **Exports** | Génération PDF/XLSX institutionnel, format progiciel financier | Livrable réglementaire clé |
| **Administration** | Gestion utilisateurs, organisation, paramètres | Multi-tenant SaaS |

### Problèmes résolus

1. **Fractionnement non détecté** : cumul de MAPA dépassant les seuils sans procédure formalisée → risque juridique majeur
2. **Nomenclature absente ou incohérente** : classifications approximatives ne respectant pas la règle d'exhaustivité/exclusivité
3. **Planification réactive** : marchés gérés dans des tableurs, surcharge en fin d'exercice
4. **Documents manuels** : le Livre Blanc CartoAP représente des semaines de travail manuel
5. **Visibilité nulle** : aucune vision consolidée de la dépense publique par direction/famille

---

## 2. User Personas

### Persona 1 — Marie, Responsable des Marchés Publics

**Collectivité** : Métropole de Lyon (400 agents, 84 M€ d'achats/an)
**Âge** : 42 ans | **Expérience** : 12 ans en marchés publics

**Missions** :
- Piloter la stratégie achats de la collectivité
- Garantir la conformité CCP
- Produire le rapport annuel de cartographie (= 3 semaines de travail)
- Former les services opérationnels

**Douleurs** :
- Le rapport de cartographie prend 3 semaines chaque année (Excel, Word)
- Les alertes de fractionnement arrivent trop tard (après le contrôle de légalité)
- Aucune visibilité sur ce que font les directions sans passer par des réunions
- La nomenclature est copiée-collée chaque année et jamais vraiment mise à jour

**Gains attendus avec Axiora** :
- Rapport généré en 1 clic (gain : ~60 heures de travail)
- Alertes en temps réel avant tout engagement
- Tableau de bord consolidé sans réunion

**Fréquence d'usage** : Quotidien

---

### Persona 2 — Thomas, Acheteur opérationnel

**Collectivité** : Département de la Haute-Savoie
**Âge** : 34 ans | **Expérience** : 5 ans

**Missions** :
- Rédiger et passer les marchés pour sa direction (DGA Bâtiments)
- Respecter les seuils de procédure
- Planifier ses consultations sur l'exercice

**Douleurs** :
- Ne sait pas exactement quel seuil s'applique à son achat
- Ses MAPA s'accumulent sans vision du cumul annuel par code
- Doit demander à Marie pour chaque dépense "dans quel code ça va ?"
- La planification se fait dans un fichier Excel partagé qui crée des conflits

**Gains attendus avec Axiora** :
- Saisir une dépense → code nomenclature suggéré automatiquement
- Voir immédiatement si la procédure choisie est conforme
- Planifier ses marchés dans un calendrier partagé

**Fréquence d'usage** : 3-4 fois/semaine

---

### Persona 3 — Isabelle, DSI / Directrice Générale des Services

**Collectivité** : Commune de 50 000 habitants
**Âge** : 52 ans | **Expérience** : 20 ans en collectivités

**Missions** :
- Valider la stratégie achats
- Présenter les résultats au Conseil Municipal
- Piloter la transformation numérique

**Douleurs** :
- Reçoit des rapports PDF trop techniques, pas de vision synthétique
- Ne peut pas comparer avec d'autres collectivités
- Difficile de prioriser les investissements sans données fiables

**Gains attendus avec Axiora** :
- Dashboard exécutif en 1 page
- Indicateurs de maturité comparables
- Export PowerPoint pour le Conseil

**Fréquence d'usage** : Hebdomadaire (dashboard uniquement)

---

## 3. Use Cases clés (MVP)

### UC-01 — Importer et classifier les dépenses mandatées
**Acteur** : Thomas (acheteur)
**Flux** :
1. Thomas télécharge l'export CSV de son progiciel financier
2. Axiora parse et normalise les données
3. L'agent IA classifie chaque ligne dans la nomenclature
4. Thomas valide/corrige les classifications < 90% de confiance
5. Le système calcule le cumul par code et vérifie les seuils
6. Les alertes de fractionnement s'affichent immédiatement

**Résultat** : 100% des dépenses classifiées en < 10 min (vs 3 semaines manuelles)

---

### UC-02 — Créer et gérer la nomenclature sur-mesure
**Acteur** : Marie (responsable marchés)
**Flux** :
1. Marie crée une nouvelle famille d'achats
2. Elle ajoute des sous-familles et des codes avec seuils
3. L'agent IA suggère des codes manquants basés sur les dépenses
4. Elle valide, versionne et publie la nomenclature (v3.2)
5. Les acheteurs voient la nouvelle version immédiatement

**Résultat** : Nomenclature vivante, versionnable, co-construite

---

### UC-03 — Planifier les passations de l'exercice
**Acteur** : Thomas (acheteur)
**Flux** :
1. Thomas crée un marché avec objet, montant, procédure, échéance
2. Axiora vérifie automatiquement la procédure vs le montant
3. Le système alerte si la charge prévisionnelle dépasse la capacité
4. Marie visualise le planning consolidé de toutes les directions
5. Les alertes d'accords-cadres arrivant à échéance apparaissent à J-90

**Résultat** : Anticipation accrue de +18 jours en moyenne

---

### UC-04 — Générer le Livre Blanc CartoAP
**Acteur** : Marie (responsable marchés)
**Flux** :
1. Marie sélectionne les sections à inclure (parmi 13 disponibles)
2. Elle configure les métadonnées (collectivité, exercice, version)
3. L'agent IA rédige les sections narratives + analyse
4. La génération PDF institutionnel se lance en arrière-plan (~2 min)
5. Marie télécharge le PDF, l'XLSX récapitulatif et le format progiciel

**Résultat** : 3 semaines de travail manuel → 2 minutes

---

### UC-05 — Surveiller la conformité en temps réel
**Acteur** : Marie (responsable marchés)
**Flux** :
1. Le dashboard affiche les alertes réglementaires par sévérité
2. Marie clique sur une alerte "Fractionnement" → détail du cumul MAPA
3. Elle marque l'alerte comme traitée avec une note de justification
4. L'audit log enregistre la décision pour le contrôle de légalité

**Résultat** : Sécurité juridique +3 pts, risques réduits de 62%

---

## 4. Product Scope — MVP (8 semaines)

### Dans le scope

- [x] Authentification multi-tenant (organisation = collectivité)
- [x] Gestion des utilisateurs avec RBAC (admin / acheteur / lecteur)
- [x] Module Nomenclature complet (CRUD arborescence, versions, journal)
- [x] Import CSV/XLSX dépenses mandatées
- [x] Classification IA automatique (agent Claude)
- [x] Module Cartographie (treemap, seuils, anomalies)
- [x] Module Planification (tableau + calendrier, alertes charge)
- [x] Détection automatique du fractionnement
- [x] Dashboard KPIs stratégiques
- [x] Génération PDF institutionnel + XLSX récapitulatif
- [x] API REST documentée (Swagger)
- [x] Infrastructure Docker + CI/CD

### Hors scope MVP (post-launch)

- [ ] SSO SAML (intégration AD collectivité)
- [ ] Module benchmarking inter-collectivités
- [ ] Intégration directe progiciels financiers (Ciril, Chorus Pro, Astre)
- [ ] Application mobile
- [ ] Module de signature électronique intégrée
- [ ] Tableau de bord exécutif PowerPoint
- [ ] Notifications email/SMS avancées
