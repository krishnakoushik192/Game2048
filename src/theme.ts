/**
 * Premium visual language shared across the app — "Royal Luxury" direction:
 * a near-black base, a refined gold hero accent, and sparing jewel-tone
 * highlights (ruby / sapphire / emerald) on glass surfaces.
 */
import type { ViewStyle } from 'react-native';

export const PALETTE = {
    // Base surfaces
    bg: '#050505',
    bgElevated: '#0B0F19',
    surface: '#121212',
    surfaceAlt: '#161B22',
    border: '#2D333B',

    white: '#F8FAFC',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    dim: 'rgba(248,250,252,0.55)',
    faint: 'rgba(248,250,252,0.32)',

    // Gold — the hero accent
    gold: '#D4AF37',
    goldBright: '#FFD700',
    goldDeep: '#B8860B',
    goldSoft: 'rgba(212,175,55,0.16)',

    // Jewel accents, used sparingly for meaning (score / best / powers)
    ruby: '#E11D48',
    rubyDeep: '#9F1239',
    sapphire: '#3B82F6',
    sapphireDeep: '#1D4ED8',
    emerald: '#10B981',
    emeraldDeep: '#065F46',
    amethyst: '#8B5CF6',
    amethystDeep: '#5B21B6',

    danger: '#EF4444',
    success: '#10B981',

    glassBg: 'rgba(255,255,255,0.08)',
    glassBorder: 'rgba(255,255,255,0.12)',
    glassBgStrong: 'rgba(15,16,20,0.94)',
};

/** Consistent, generous corner radii for a high-end feel (20-28px on big surfaces). */
export const RADIUS = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 28,
    pill: 999,
};

/**
 * NOTE: React Native's `experimental_backgroundImage` gradient style renders
 * as a fully blank/black screen on some real devices (it's explicitly
 * labelled experimental/unstable by RN). To keep the app reliable everywhere
 * we use plain, rich solid tones instead of true gradients. The names are
 * kept as "GRADIENTS" / "gradientBg" so the rest of the app doesn't need to
 * change, but these now resolve to solid `backgroundColor` values.
 */
export const GRADIENTS = {
    appBg: PALETTE.bg,
    boardBg: 'rgba(18,18,18,0.95)',

    gold: PALETTE.gold,
    goldSoft: PALETTE.goldSoft,

    ruby: PALETTE.ruby,
    sapphire: PALETTE.sapphire,
    emerald: PALETTE.emerald,
    amethyst: PALETTE.amethyst,

    // Tile ladder: cool graphite -> bronze -> gold as value climbs, so
    // reaching 2048 visually reads as "reaching pure gold status".
    tile2: '#232B3A',
    tile4: '#2D3748',
    tile8: '#3B4A63',
    tile16: '#4A5D7A',
    tile32: '#6B5B45',
    tile64: '#8C6A2F',
    tile128: '#B8860B',
    tile256: '#C79A1A',
    tile512: '#D4AF37',
    tile1024: '#E8C547',
    tile2048: '#FFD700',
    tileHigh: '#FFF3C4',
};

type GradientStyle = Pick<ViewStyle, 'backgroundColor'>;

export const gradientBg = (color: string): GradientStyle => ({
    backgroundColor: color,
});

export const cardShadow = (color: string, opacity = 0.28, radius = 18) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 10,
});

export const glowShadow = (color: string, opacity = 0.5, radius = 14) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 8,
});
