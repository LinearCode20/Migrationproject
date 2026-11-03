import type { Theme } from "ogier/lite"

/**
 * The site's colors as hex values, for the generated images (Open Graph cards
 * and badges). satori cannot read the OKLCH tokens in `app/styles.css`, so each
 * value is a copy of the token named beside it. Update both together.
 */
const colors = {
  light: {
    background: "#ffffff", // --color-background
    foreground: "#1f1f1f", // --color-foreground
    muted: "#737373", // --color-muted-foreground
    ring: "#d4d4d4", // --color-ring
    primary: "#3a4efd", // --color-primary
  },
  dark: {
    background: "#0d0d0d", // --color-background
    foreground: "#e5e5e5", // --color-foreground
    ring: "#333333", // --color-ring
  },
}

/** The badge themes a site owner can embed. */
export const badgeThemes = ["light", "dark"] as const

export type BadgeThemeName = (typeof badgeThemes)[number]

interface BadgeTheme {
  background: string
  border: string
  text: string
  logo: string
}

export interface BadgeDimension {
  min: number
  max: number
  step: number
  default: number
}

interface ImagesConfig {
  openGraph: {
    /** The colors of the Open Graph cards, in ogier's theme shape. */
    theme: Theme

    /**
     * Part of every card URL's version. Bump it after changing how the cards
     * look, so the CDN and social networks fetch the new design instead of the
     * long-cached one.
     */
    revision: number
  }

  badge: {
    /** The colors of each badge theme. */
    themes: Record<BadgeThemeName, BadgeTheme>

    /**
     * The sizes a badge can be drawn at, in pixels. The embed dialog offers
     * them, and the badge route snaps any other value to them, so each tool
     * has a bounded number of cached badges.
     */
    width: BadgeDimension
    height: BadgeDimension
  }
}

export const imagesConfig: ImagesConfig = {
  openGraph: {
    theme: {
      bg: colors.light.background,
      text: colors.light.foreground,
      muted: colors.light.muted,
      accent: colors.light.primary,
      eyebrow: colors.light.primary,
      pattern: colors.light.ring,
    },

    revision: 1,
  },

  badge: {
    themes: {
      light: {
        background: colors.light.background,
        border: colors.light.ring,
        text: colors.light.foreground,
        logo: colors.light.primary,
      },
      dark: {
        background: colors.dark.background,
        border: colors.dark.ring,
        text: colors.dark.foreground,
        logo: colors.dark.foreground,
      },
    },

    width: { min: 100, max: 600, step: 10, default: 200 },
    height: { min: 30, max: 200, step: 5, default: 50 },
  },
}
