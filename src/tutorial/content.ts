import type { Direction } from '../shared/input';
import { colors, gameColors } from '../theme';
import type { GameId } from '../theme';

/** One square in a tutorial picture. */
export type PictureCell = {
    text?: string;
    bg: string;
    fg?: string;
    border?: 'solid' | 'dashed' | 'none';
    round?: boolean;
    radius?: number;
    /** Ring around the cell (lit pad, winning line). */
    glow?: boolean;
    faded?: boolean;
    /** Chunky bottom edge, like a real tile or card. */
    lift?: boolean;
    /** Text size as a share of the cell size. */
    scale?: number;
};

export type PracticeAction = { type: 'tap'; row: number; col: number } | { type: 'swipe'; dir: Direction };
export type Gesture = 'tap' | `swipe-${Direction}`;

export type TutorialStep = {
    /** Six words or fewer, words a 6-year-old knows. */
    title: string;
    body: string;
    /** Rows of space-separated tokens, turned into cells by the palette. */
    grid: string[];
    /** What the hand shows. */
    gesture?: Gesture;
    target?: [number, number];
    /** Present on the "Your turn" step: the board waits for the right move. */
    practice?: {
        accepts: (action: PracticeAction) => boolean;
        /** Picture after the right move. */
        after?: string[];
        success: string;
    };
};

export type Tutorial = {
    id: GameId;
    name: string;
    tint: string;
    boardBg: string;
    /** Colour of the tap ripple; white on dark boards. */
    ring: string;
    palette: (token: string) => PictureCell;
    steps: TutorialStep[];
};

export const parseGrid = (grid: string[]) => grid.map(row => row.trim().split(/\s+/));

const tap = (row: number, col: number) => (a: PracticeAction) => a.type === 'tap' && a.row === row && a.col === col;
const swipe = (dir: Direction) => (a: PracticeAction) => a.type === 'swipe' && a.dir === dir;

/* ─── 2048 ─── */
const TILE: Record<string, [string, string]> = {
    '2': ['#FFF1D6', colors.ink], '4': ['#FFE2B0', colors.ink], '8': ['#FFC93C', colors.ink],
    '16': ['#FFA94D', colors.ink], '1024': ['#3D8BFF', colors.white], '2048': [colors.ink, colors.coin],
};
const tiles2048 = (token: string): PictureCell => {
    if (token === '.') { return { bg: colors.sandLight, border: 'dashed' }; }
    const [bg, fg] = TILE[token] ?? [colors.ink, colors.white];
    return { text: token, bg, fg, lift: true };
};

/* ─── Tic-Tac-Toe ─── */
const ticTacToe = (token: string): PictureCell => {
    const win = token.endsWith('!');
    const mark = win ? token.slice(0, -1) : token;
    if (mark === '.') { return { bg: colors.card, border: 'none' }; }
    return { text: mark, bg: win ? colors.coin : colors.card, fg: mark === 'X' ? colors.ink : '#E0443F', border: 'none', scale: 0.62 };
};

/* ─── Memory ─── */
const PICTURES: Record<string, [string, string]> = {
    S: ['★', '#F08A1C'], C: ['●', '#3D8BFF'], T: ['▲', '#2FA35B'],
    D: ['◆', '#8B6CFF'], H: ['♥', '#E0447A'], M: ['☾', '#169C95'],
};
const memory = (token: string): PictureCell => {
    if (token === '?') { return { text: '?', bg: gameColors.memory.main, fg: colors.white, lift: true, scale: 0.5 }; }
    const matched = token === token.toLowerCase();
    const [text, fg] = PICTURES[token.toUpperCase()];
    return { text, fg, bg: matched ? '#F4ECF0' : colors.card, faded: matched, lift: !matched, scale: 0.55 };
};

/* ─── Color Recall ─── */
const PADS: Record<string, [string, string]> = {
    T: ['#22B8B0', '#8ED9D4'], Y: ['#FFC93C', '#FFE39A'], P: ['#FF6FA8', '#FFB3D0'], B: ['#3D8BFF', '#9EC3FF'],
};
const pads = (token: string): PictureCell => {
    const lit = token.endsWith('!');
    const [on, dim] = PADS[lit ? token.slice(0, -1) : token];
    return { bg: lit ? on : dim, glow: lit, radius: 32 };
};

/* ─── Slide Puzzle ─── */
const slide = (token: string): PictureCell => {
    if (token === '.') { return { bg: 'transparent', border: 'dashed' }; }
    const inPlace = token.endsWith('*');
    return { text: inPlace ? token.slice(0, -1) : token, bg: inPlace ? colors.coin : colors.card, lift: true, scale: 0.46 };
};

/* ─── Drop Four ─── */
const discs = (token: string): PictureCell => {
    const glow = token.endsWith('!');
    const disc = glow ? token.slice(0, -1) : token;
    const bg = { '.': colors.cream, p: '#FF6FA8', y: colors.coin }[disc] ?? colors.cream;
    return { bg, round: true, glow };
};

/* ─── Snake ─── */
const snake = (token: string): PictureCell => {
    switch (token) {
        case 's': return { bg: gameColors.snake.main, radius: 10 };
        case 'h': return { bg: colors.ink, radius: 16 };
        case 'x': return { bg: colors.ink, radius: 16, glow: true };
        case 'b': return { bg: colors.danger, round: true };
        default: return { bg: '#F1FAF4', border: 'none', radius: 8 };
    }
};

/* ─── Mine Finder ─── */
const NUMBER_INK: Record<string, string> = { '1': '#1F5FD6', '2': '#1E8A47', '3': '#C42B2B' };
const mines = (token: string): PictureCell => {
    if (token === 'h') { return { bg: colors.card, border: 'none', radius: 10 }; }
    if (token === 'o') { return { bg: colors.sand, border: 'none', radius: 10 }; }
    if (token === 'f') { return { text: '⚑', bg: colors.danger, border: 'none', radius: 10, scale: 0.55 }; }
    return { text: token, bg: colors.sand, fg: NUMBER_INK[token], border: 'none', radius: 10, scale: 0.55 };
};

export const TUTORIALS: Record<GameId, Tutorial> = {
    g2048: {
        id: 'g2048', name: '2048', tint: gameColors.g2048.tint, boardBg: colors.sand, ring: colors.ink, palette: tiles2048,
        steps: [
            { title: 'Swipe to move the tiles', body: 'Swipe left, right, up or down. Every tile slides that way.', grid: ['2 . . .', '. . 4 .', '. 2 . .', '. . . .'], gesture: 'swipe-right', target: [2, 3] },
            {
                title: 'Same numbers join!', body: 'Two 2s squish into one 4. Swipe left to join them.', grid: ['2 2 . .', '. . . .', '. . . .', '. . . .'], gesture: 'swipe-left', target: [0, 0],
                practice: { accepts: swipe('left'), after: ['4 . . .', '. . . .', '. . . .', '. . . .'], success: 'Yes! 2 + 2 = 4' },
            },
            { title: 'Make 2048 to win!', body: 'Stuck with no moves? Use a power to smash a tile.', grid: ['1024 1024 . .', '16 8 . .', '4 2 . .', '. . . .'], gesture: 'swipe-left', target: [0, 0] },
        ],
    },
    tictactoe: {
        id: 'tictactoe', name: 'Tic-Tac-Toe', tint: gameColors.tictactoe.tint, boardBg: colors.ink, ring: colors.white, palette: ticTacToe,
        steps: [
            { title: 'Tap a square for your X', body: 'You are X. The computer is O.', grid: ['. . .', '. X .', '. . .'], gesture: 'tap', target: [1, 1] },
            {
                title: 'Take turns', body: 'The computer played O. Now tap the empty corner.', grid: ['O . .', '. X .', '. . .'], gesture: 'tap', target: [2, 2],
                practice: { accepts: tap(2, 2), after: ['O . .', '. X .', '. . X'], success: 'Nice move!' },
            },
            { title: 'Get 3 in a row!', body: 'That’s a win! Across, up and down, or corner to corner.', grid: ['X! O O', '. X! .', '. . X!'] },
        ],
    },
    memory: {
        id: 'memory', name: 'Memory Match', tint: gameColors.memory.tint, boardBg: colors.card, ring: colors.ink, palette: memory,
        steps: [
            { title: 'Tap a card to flip it', body: 'Look at the picture. Try to remember where it is!', grid: ['? ? ? ?', '? S ? ?', '? ? ? ?'], gesture: 'tap', target: [1, 1] },
            {
                title: 'Find two that match', body: 'Where is the other star? Tap that card.', grid: ['? ? ? ?', '? S ? ?', '? ? ? ?'], gesture: 'tap', target: [0, 3],
                practice: { accepts: tap(0, 3), after: ['? ? ? s', '? s ? ?', '? ? ? ?'], success: 'A match! They stay up.' },
            },
            { title: 'Match them all to win!', body: 'Not the same? They flip back. Fewer tries means more coins.', grid: ['s c t d', 'h m s c', 't d h m'] },
        ],
    },
    colorRecall: {
        id: 'colorRecall', name: 'Color Recall', tint: gameColors.colorRecall.tint, boardBg: colors.card, ring: colors.ink, palette: pads,
        steps: [
            { title: 'Watch the lights', body: 'The pads light up one at a time. Watch closely, and listen!', grid: ['T Y!', 'P B'] },
            {
                title: 'Tap the same ones', body: 'The yellow pad lit up. Tap it!', grid: ['T Y', 'P B'], gesture: 'tap', target: [0, 1],
                practice: { accepts: tap(0, 1), after: ['T Y!', 'P B'], success: 'You remembered!' },
            },
            { title: 'One more each round', body: 'Every round adds one more light. How many can you remember?', grid: ['T! Y', 'P B!'] },
        ],
    },
    slide: {
        id: 'slide', name: 'Slide Puzzle', tint: gameColors.slide.tint, boardBg: colors.sand, ring: colors.ink, palette: slide,
        steps: [
            { title: 'Tap the tile by the gap', body: 'Only tiles touching the empty space can move.', grid: ['1* 2* 3*', '4* 5* 6*', '7* . 8'], gesture: 'tap', target: [2, 2] },
            {
                title: 'It slides into the gap', body: 'Tap the 8, or swipe it left into the gap.', grid: ['1* 2* 3*', '4* 5* 6*', '7* . 8'], gesture: 'swipe-left', target: [2, 2],
                practice: { accepts: a => tap(2, 2)(a) || swipe('left')(a), after: ['1* 2* 3*', '4* 5* 6*', '7* 8* .'], success: 'Solved! All in order.' },
            },
            { title: 'Put the numbers in order!', body: '1, 2, 3 and so on, with the gap at the end. Yellow tiles are in the right spot.', grid: ['1* 2* 3*', '4* 5* 6*', '7* 8* .'] },
        ],
    },
    dropFour: {
        id: 'dropFour', name: 'Drop Four', tint: gameColors.dropFour.tint, boardBg: gameColors.dropFour.main, ring: colors.white, palette: discs,
        steps: [
            { title: 'Tap a column', body: 'You play pink. Tap any column to drop a disc in.', grid: ['. . . . .', '. . . . .', '. . . . .', '. . p . .'], gesture: 'tap', target: [0, 2] },
            {
                title: 'It falls to the bottom', body: 'Tap the middle column. Your disc drops to the lowest hole.', grid: ['. . . . .', '. . . . .', '. . . . .', '. y p y .'], gesture: 'tap', target: [0, 2],
                practice: { accepts: a => a.type === 'tap' && a.col === 2, after: ['. . . . .', '. . . . .', '. . p . .', '. y p y .'], success: 'Plop! It landed on top.' },
            },
            { title: 'Get 4 in a row!', body: 'That’s a win! Across, up and down, or slanted. Block yellow so it can’t get 4!', grid: ['. . . . .', '. y . . .', '. y y . .', 'p! p! p! p! y'] },
        ],
    },
    snake: {
        id: 'snake', name: 'Snake', tint: gameColors.snake.tint, boardBg: colors.card, ring: colors.ink, palette: snake,
        steps: [
            { title: 'Swipe to turn', body: 'The snake keeps moving by itself. Swipe to steer it.', grid: ['. . . . . .', '. . . . b .', '. . . . . .', '. s s h . .', '. . . . . .', '. . . . . .'], gesture: 'swipe-up', target: [2, 3] },
            {
                title: 'Eat the berry to grow', body: 'The berry is to the right. Swipe right!', grid: ['. . . . . .', '. . . h b .', '. . . s . .', '. s s s . .', '. . . . . .', '. . . . . .'], gesture: 'swipe-right', target: [1, 4],
                practice: { accepts: swipe('right'), after: ['. . . . . .', '. . . s h .', '. . . s . .', '. s s s . .', '. . . . . .', '. . . . . .'], success: 'Yum! The snake got longer.' },
            },
            { title: 'Don’t bump!', body: 'Hitting the wall or your own tail ends the game. Then try again!', grid: ['. . . s s x', '. . . s . .', '. . . s . .', '. . . . . .', '. . b . . .', '. . . . . .'] },
        ],
    },
    mines: {
        id: 'mines', name: 'Mine Finder', tint: gameColors.mines.tint, boardBg: colors.ink, ring: colors.white, palette: mines,
        steps: [
            { title: 'Tap a square to dig', body: 'Some squares hide mines. Don’t worry, your first tap is always safe!', grid: ['h h h h h', 'h h h h h', 'h h h h h', 'h h h h h', 'h h h h h'], gesture: 'tap', target: [2, 2] },
            {
                title: 'Numbers are clues', body: 'A 1 means one mine is touching it. Tap the 1 in the top corner.', grid: ['h h h h h', 'h 1 1 2 h', 'h 1 o 1 h', 'h 1 o 1 h', 'h h h h h'], gesture: 'tap', target: [1, 1],
                practice: { accepts: tap(1, 1), after: ['f h h h h', 'h 1 1 2 h', 'h 1 o 1 h', 'h 1 o 1 h', 'h h h h h'], success: 'The mine was in the corner!' },
            },
            { title: 'Flag the mines', body: 'Press and hold a square to put a flag on it. Dig every safe square to win!', grid: ['f h h h h', 'h 1 1 2 h', 'h 1 o 1 h', 'h 1 o 1 h', 'h h h h h'], gesture: 'tap', target: [0, 0] },
        ],
    },
};
