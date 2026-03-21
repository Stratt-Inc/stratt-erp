/**
 * Stratt brand color palette — single source of truth.
 *
 * C        — hex values for recharts / chart libraries (needs raw hex)
 * CSS      — CSS variable references for UI inline styles
 * MODULE   — per-module color (CSS var string), consistent across sidebar + pages
 * CHART_PALETTE — 4-color categorical order for charts
 */

// Hex values — for chart libraries only (recharts, etc.)
export const C = {
  PRIMARY:  "#5C93FF",
  TEAL:     "#24DDB8",
  AMBER:    "#F59E0B",
  RED:      "#EF4444",
  GREEN:    "#10B981",
  VIOLET:   "#8B5CF6",
  NEUTRAL:  "#8DA2B5",
} as const;

/** 4-color categorical palette for charts (use in order) */
export const CHART_PALETTE = [C.PRIMARY, C.TEAL, C.AMBER, C.VIOLET] as const;

// CSS variable references — for UI elements (inline styles, icon colors, borders…)
export const CSS = {
  primary:     "hsl(var(--primary))",
  accent:      "hsl(var(--accent))",
  warning:     "hsl(var(--warning))",
  success:     "hsl(var(--success))",
  destructive: "hsl(var(--destructive))",
  violet:      "hsl(var(--violet))",
  foreground:  "hsl(var(--foreground))",
  muted:       "hsl(var(--muted-foreground))",
  border:      "hsl(var(--border))",
  card:        "hsl(var(--card))",
  background:  "hsl(var(--background))",
} as const;

/**
 * Module color system — one color per module/route, consistent across:
 * - Sidebar active state (left border + icon)
 * - Page header icon / section dot
 * - Stat tile accent bar (--tile-color)
 * - Chart series for that module's data
 */
export const MODULE = {
  // Pilotage
  dashboard:     CSS.primary,
  planification: CSS.warning,
  cartographie:  CSS.accent,
  alertes:       CSS.destructive,
  nomenclature:  CSS.violet,
  chatbot:       CSS.violet,   // IA = violet
  exports:       CSS.primary,

  // ERP modules
  crm:           CSS.primary,
  accounting:    CSS.success,
  billing:       CSS.success,
  inventory:     CSS.violet,
  hr:            CSS.warning,
  procurement:   CSS.accent,
  analytics:     CSS.primary,

  // Système
  organizations: CSS.primary,
  settings:      CSS.muted,
  administration:CSS.destructive,
  glossaire:     CSS.accent,
  support:       CSS.success,
  help:          CSS.muted,

  // Données publiques
  boamp:         CSS.warning,
  sirene:        CSS.primary,
  decp:          CSS.accent,
} as const;

export type ModuleKey = keyof typeof MODULE;
