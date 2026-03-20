/**
 * Stratt brand color palette — single source of truth.
 *
 * Use these constants for stat tile accent colors, chart fills, and icon colors.
 * Semantic meanings:
 *   PRIMARY  = interactions, links, primary actions
 *   TEAL     = success, positive values, secondary accent
 *   AMBER    = warning, highlights, pending states
 *   RED      = error, negative values, danger
 *   VIOLET   = AI/Claude features only
 *   NEUTRAL  = inactive, disabled, low-emphasis
 */

export const C = {
  PRIMARY: "#5C93FF",
  TEAL:    "#24DDB8",
  AMBER:   "#F59E0B",
  RED:     "#EF4444",
  VIOLET:  "#8B5CF6",
  NEUTRAL: "#8DA2B5",
} as const;

/** 4-color categorical palette for charts (use in order) */
export const CHART_PALETTE = [C.PRIMARY, C.TEAL, C.AMBER, C.VIOLET] as const;
