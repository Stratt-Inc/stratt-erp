# 🎯 Axiora — Plateforme stratégique des achats publics

> Solution institutionnelle de pilotage, cartographie et gouvernance des achats publics pour collectivités territoriales et établissements publics.

[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)](https://vitejs.dev/)

---

## 🚀 Démarrage rapide

```bash
# Installation dépendances
npm install

# Développement (mode watch)
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Tests
npm run test
npm run test:watch
```

## 📋 Fonctionnalités

### Modules stratégiques

| Module              | Description                                               |
|---------------------|-----------------------------------------------------------|
| **Dashboard**       | Vue d'ensemble KPIs, maturité achats, alertes            |
| **Planification**   | Programmation marchés, échéanciers, renouvellements      |
| **Cartographie**    | Treemap dépenses, familles achats, seuils réglementaires |
| **Nomenclature**    | Arborescence codes achats sur-mesure                     |
| **Exports**         | Documents, rapports Excel, exports réglementaires        |
| **Administration**  | Configuration, utilisateurs, paramètres système          |

### Pilotage réglementaire

- ✅ **Conformité Code des Marchés Publics** — Seuils 40k / 90k / 215k€
- ⚠️ **Détection fractionnement** — Consolidation automatique MAPA
- 📊 **Indicateurs juridiques** — Badges conformité temps réel
- 🔍 **Analyse risque** — Alertes dépassement seuils publicité

## 🎨 Design System

**Identité institutionnelle** — Autorité, rigueur juridique, fiabilité.

### Palette modifiable rapidement

**⚡ Changement ultra-simple** : modifiez uniquement les valeurs HEX, les noms restent constants.

- **Source unique** : `src/lib/palette.ts`
- **Tokens CSS globaux** (light/dark) : `src/index.css`
- **Noms génériques** : `primary`, `secondary`, `tertiary`, `accent`, `accentSoft`

#### Pour changer toute la palette :
1. Ouvrir `src/lib/palette.ts`
2. Modifier les 5 valeurs HEX dans `PALETTE`
3. Rebuild (`npm run build`)
4. ✅ Tous les graphiques et composants s'adaptent automatiquement

**Aucun changement de code nécessaire** — les noms génériques (`primary`, `secondary`, etc.) restent constants.

### Refonte v1.1 (Mars 2026)

- ✅ Palette centralisée et réutilisable
- ✅ Mode clair + mode sombre via tokens
- ✅ Graphiques `Dashboard`/`Planification`/`Cartographie` branchés sur la source unique
- ✅ Composants ShadCN cohérents avec les mêmes variables

📖 **Documentation complète** : [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)

## 🏗️ Architecture technique

### Stack

```
React 18.3 + TypeScript 5.6
Vite 5.4 (build ultra-rapide)
TailwindCSS 3.4 + ShadCN UI
React Router 7 (navigation)
TanStack Query (état serveur)
Recharts (data-viz)
Vitest (tests unitaires)
```

### Structure projet

```
src/
├── components/        # Composants réutilisables
│   ├── ui/           # Primitives ShadCN
│   ├── AppLayout.tsx # Layout principal
│   └── AppSidebar.tsx# Navigation institutionnelle
├── pages/            # Modules applicatifs
│   ├── Dashboard.tsx
│   ├── Planification.tsx
│   ├── Cartographie.tsx
│   └── ...
├── hooks/            # Hooks React réutilisables
├── lib/              # Utilitaires
└── index.css         # Design tokens CSS
```

## 🎯 Logo & Identité

**Concept** : Cible stratégique (précision) + cartographie (structuration)

- Cercles concentriques → Focus, performance
- Croix cardinale → Axes d'analyse budgétaire
- Bleu marine → Autorité institutionnelle

**Fichiers** : `public/favicon.svg` — Favicon 32×32 optimisé

## 📊 Conformité & Sécurité

- ✅ **RGPD** — Données hébergées France
- ✅ **SecNumCloud** — Hébergement qualifié ANSSI
- ✅ **Accessibilité** — WCAG 2.1 niveau AA
- ✅ **Code Marchés Publics** — Seuils réglementaires à jour

## 🛠️ Commandes développement

```bash
# Linting
npm run lint

# Build mode développement (source maps)
npm run build:dev
```

## 📝 Changelog

### v1.0.0 — Mars 2026

#### 🎨 Refonte design system institutionnel

- ✅ Palette réglementaire (seuils 40k/90k/215k€)
- ✅ Typographie Inter + IBM Plex Mono
- ✅ Logo Axiora (cible stratégique)
- ✅ Composants ShadCN institutionnels
- ✅ Classes utilitaires badges conformité
- ✅ Tables data avec indicateurs seuils
- ✅ Sidebar élégante avec footer certification

## 📄 Licence

Propriétaire — Tous droits réservés © 2026 Axiora

---

**Axiora** — Gouvernance, conformité et performance des achats publics.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
