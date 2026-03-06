#!/usr/bin/env bash
# seed.sh — Chargement des données de démonstration Axiora
# Crée une organisation fictive "Métropole de Lyon" avec 147 marchés et 1000 dépenses
set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://axiora:axiora_dev_password@localhost:5432/axiora_dev}"

echo "Seeding données de démonstration..."

psql "$DB_URL" <<'SQL'
-- Organisation de démo
INSERT INTO organisations (id, name, slug, plan, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Métropole de Lyon (Démo)',
  'metropole-lyon-demo',
  'enterprise',
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Familles de nomenclature
INSERT INTO nomenclature_codes (id, org_id, code, label, level, parent_id, seuil_procedure, is_active, version)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '01', 'Travaux', 0, NULL, 215000, true, 1),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '02', 'Fournitures', 0, NULL, 90000, true, 1),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '03', 'Services', 0, NULL, 90000, true, 1),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '04', 'PI / TIC', 0, NULL, 215000, true, 1)
ON CONFLICT DO NOTHING;

-- Sous-familles
INSERT INTO nomenclature_codes (id, org_id, code, label, level, parent_id, seuil_procedure, is_active, version)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '01.01', 'Travaux neufs bâtiments', 1, '10000000-0000-0000-0000-000000000001', 215000, true, 1),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '02.01', 'Fournitures informatiques', 1, '10000000-0000-0000-0000-000000000002', 90000, true, 1),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '03.01', 'Prestations intellectuelles', 1, '10000000-0000-0000-0000-000000000003', 90000, true, 1),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '04.01', 'Logiciels et licences', 1, '10000000-0000-0000-0000-000000000004', 215000, true, 1)
ON CONFLICT DO NOTHING;

SELECT 'Seed terminé. Organisation: Métropole de Lyon (Démo)' AS status;
SQL

echo "✓ Données de démo chargées"
