/**
 * AXIORA PREMIUM COLOR PALETTE — 2026
 *
 * Electric Indigo · Violet · Cyan
 * Inspired by Linear, Vercel, Stripe, Raycast
 *
 * To change the app colors, update these hex values.
 * Names remain constant and reference CSS variables.
 */
export const PALETTE = {
  primary: "#5B6BF5",      // electric indigo
  secondary: "#9B6FE8",    // violet
  tertiary: "#06B6D4",     // cyan
  accent: "#3B82F6",       // blue
  accentSoft: "#A78BFA",   // soft violet
} as const;

export const UI_COLORS = {
  lightStroke: "#E4E8F5",
  mutedText: "#7B7C94",
  white: "#FFFFFF",
  cardBg: "#F0F2FA",
} as const;

export const CHART_COLORS = {
  primary: PALETTE.primary,
  secondary: PALETTE.secondary,
  tertiary: PALETTE.tertiary,
  accent: PALETTE.accent,
  accentSoft: PALETTE.accentSoft,
} as const;

export function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}
