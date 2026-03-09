# ADR N — Titre de la décision

- Date        : 2026-03-09
- Statut      : Proposé | Accepté | Rejeté | Superseded
- Auteur(s)   : Nom Prénom (@handle)
- Version     : 1.0
- Lié à       : Ticket(s) / Epic(s) / Doc(s) (optionnel)
- Remplace    : ADR M (optionnel)
- Supersédé par : ADR P (optionnel)

---

## Contexte

Décrire clairement le problème ou la question à résoudre :

- Quel est le contexte métier et technique ?
- Quelles contraintes (performance, sécurité, coûts, équipe, délais) ?
- Quelles décisions précédentes influencent celle‑ci ?

## Décision

Décrire la décision prise, de manière affirmative et claire :

- « Nous décidons de … »
- Portée de la décision (quels systèmes / modules / équipes)
- Résumé en 2–3 phrases de ce qui change.

## Options considérées

Lister les options envisagées, avec un court résumé de chacune.

### Option 1 — Nom de l’option

- Description courte
- Avantages principaux
- Inconvénients principaux

### Option 2 — Nom de l’option

- Description courte
- Avantages principaux
- Inconvénients principaux

### Option 3 — Ne rien faire (status quo)

- Description courte
- Avantages principaux
- Inconvénients principaux

## Rationale (Justification)

Expliquer pourquoi cette option a été choisie par rapport aux autres :

- Critères de décision (ex: complexité, time-to-market, coûts d’ops, risques)
- Pourquoi les autres options ont été écartées
- Points de débat importants et arbitrages

## Conséquences

Lister les conséquences de la décision, positives et négatives.

### Conséquences positives

- …

### Conséquences négatives

- …

### Suivi et tâches dérivées

- Tickets / tâches à créer (techniques et fonctionnelles)
- Décisions futures rendues plus simples / plus difficiles

## Détails d’implémentation (optionnel)

Détails techniques si utile :

- Patterns / librairies / composants choisis
- Impacts sur le code existant (refactoring, migrations)
- Diagrammes associés (lien vers `docs/architecture/*.md` ou vers un référentiel)

## Plan de migration / Rollout

- Étapes de migration (par phase ou par release)
- Stratégie de compatibilité (feature flags, dark launch, canary, etc.)
- Rollback plan en cas de problème

## Références

- Liens vers RFC internes, tickets, POC, PR
- Documentation externe (articles, doc framework, standards)
