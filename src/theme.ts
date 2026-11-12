import type { ViewStyle } from 'react-native';

/** Playbox "bright & playful" theme. See the redesign canvas style guide. */
export const colors = {
    cream: '#FFF6E9',
    card: '#FFFFFF',
    sand: '#E9DCC6',
    sandLight: '#F2EADB',
    ink: '#2B2140',
    muted: '#675F7A',
    coin: '#FFC93C',
    coinLight: '#FFF0C2',
    success: '#3DBE6B',
    danger: '#FF5A5A',
    white: '#FFFFFF',
};

export type GameId =
    | 'g2048'
    | 'tictactoe'
    | 'memory'
    | 'colorRecall'
    | 'slide'
    | 'dropFour'
    | 'snake'
    | 'mines';

export const gameColors: Record<GameId, { main: string; tint: string }> = {
    g2048: { main: '#FF8A3D', tint: '#FFE1CC' },
    tictactoe: { main: '#8B6CFF', tint: '#E6DEFF' },
    memory: { main: '#FF6FA8', tint: '#FFDCEA' },
    colorRecall: { main: '#22B8B0', tint: '#D2F3F1' },
    slide: { main: '#FFC93C', tint: '#FFF0C2' },
    dropFour: { main: '#3D8BFF', tint: '#DCE8FF' },
    snake: { main: '#3DBE6B', tint: '#D6F5E0' },
    mines: { main: '#FF5A5A', tint: '#FFDADA' },
};

export const radius = { chip: 12, button: 16, card: 18, board: 24, pill: 999 };

/**
 * The "toy block" look: a 2px ink outline with a thicker bottom edge that
 * reads as a hard drop shadow on both iOS and Android (elevation cannot draw
 * a solid offset shadow).
 */
export const chunky = (depth = 4): ViewStyle => ({
    borderWidth: 2,
    borderBottomWidth: 2 + depth,
    borderColor: colors.ink,
});

export const outlined: ViewStyle = { borderWidth: 2, borderColor: colors.ink };

/**
 * Bundled font files (assets/fonts, also copied into the Android and iOS
 * projects), so text looks the same offline on every phone. Each weight is
 * its own family: never combine these with fontWeight, or Android may fake
 * a bold on top.
 */
export const fonts = {
    /** Fredoka: titles, scores and numbers on tiles. */
    display: 'Fredoka-Bold',
    displaySemi: 'Fredoka-SemiBold',
    displayMedium: 'Fredoka-Medium',
    /** Nunito: everything people read. */
    heavy: 'Nunito-ExtraBold',
    bold: 'Nunito-Bold',
    semi: 'Nunito-SemiBold',
    regular: 'Nunito-Regular',
};
