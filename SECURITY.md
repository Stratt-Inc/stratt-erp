# Politique de sécurité — Axiora

## Versions supportées

| Version | Support sécurité |
|---------|:----------------:|
| 1.x     | Oui              |
| < 1.0   | Non              |

## Signaler une vulnérabilité

**Ne pas créer d'issue publique pour les vulnérabilités.**

Utiliser **GitHub Security Advisories** : [Signaler une vulnérabilité](https://github.com/makcimerrr/axiora/security/advisories/new)

Inclure : description, étapes de reproduction, impact potentiel, version(s) affectée(s).

## Délais de réponse

| Délai    | Action                              |
|----------|-------------------------------------|
| 48h      | Accusé de réception                 |
| 7 jours  | Évaluation et priorité              |
| 30 jours | Correctif ou plan de mitigation     |
| 90 jours | Divulgation publique coordinée      |

## Mesures en place

- Dependabot, CodeQL, Secret scanning
- HTTPS uniquement, JWT avec rotation
- RLS PostgreSQL (isolation multi-tenant)
- Rate limiting, audit log immuable, AES-256