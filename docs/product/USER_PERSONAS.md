# USER PERSONAS — Axiora

Voir [PRODUCT_VISION.md](PRODUCT_VISION.md) pour la description détaillée des personas.

## Résumé des personas

| Persona | Rôle | Fréquence | Besoins clés |
|---------|------|-----------|--------------|
| **Marie** (42 ans) | Responsable Marchés Publics | Quotidien | Rapport automatique, alertes réglementaires, vision consolidée |
| **Thomas** (34 ans) | Acheteur opérationnel | 3-4x/semaine | Classification automatique, vérification seuils, calendrier partagé |
| **Isabelle** (52 ans) | DSI / DGS | Hebdomadaire | Dashboard exécutif, KPIs comparables, exports PowerPoint |

## Jobs-to-be-done

### Marie — "Quand je dois produire le rapport annuel de cartographie..."
- Je veux pouvoir le générer en 1 clic avec toutes les données à jour
- Afin d'économiser 3 semaines de travail manuel et me concentrer sur l'analyse

### Thomas — "Quand je m'apprête à passer un marché..."
- Je veux vérifier instantanément si ma procédure est conforme au montant
- Afin d'éviter tout risque juridique et le contrôle de légalité

### Isabelle — "Quand je prépare la réunion du Conseil Municipal..."
- Je veux un dashboard synthétique compréhensible sans formation
- Afin de présenter la performance achats en 5 minutes

## Parcours utilisateurs clés (E2E)

```
Parcours 1 : Onboarding
  Signup → Créer organisation → Importer nomenclature → Dashboard

Parcours 2 : Import & Classification
  Upload CSV → Validation automatique → Révision classifications → Cartographie mise à jour

Parcours 3 : Planification
  Créer marché → Vérification procédure → Vue calendrier → Alerte charge

Parcours 4 : Génération document
  Sélectionner sections → Configurer métadonnées → Génération IA → Télécharger PDF

Parcours 5 : Traitement alerte
  Alerte fractionnement → Voir détail cumul → Résoudre + note justification → Audit log
```
