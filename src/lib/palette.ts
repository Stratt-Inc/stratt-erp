/**
 * AXIORA COLOR PALETTE
 *
 * Pour changer les couleurs de l'application, modifiez uniquement les valeurs HEX ci-dessous.
 * Les noms (primary, secondary, etc.) restent constants.
 */
export const PALETTE = {
    // Couleur principale (utilisée pour les éléments clés, sidebar, liens)
    primary: "#5F7470",      // deepTeal

    // Couleur secondaire (charts, éléments d'accentuation)
    secondary: "#889696",    // coolSteel

    // Couleur tertiaire (nuances, backgrounds subtils)
    tertiary: "#B8BDB5",     // ashGrey

    // Couleur d'accent (highlights, états actifs)
    accent: "#D2D4C8",       // dustGrey

    // Couleur d'accent soft (backgrounds clairs, badges)
    accentSoft: "#E0E2DB",   // softLinen
} as const;

export const UI_COLORS = {
    lightStroke: PALETTE.accent,
    mutedText: PALETTE.secondary,
    white: "#FFFFFF",
    cardBg: PALETTE.accentSoft,
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

