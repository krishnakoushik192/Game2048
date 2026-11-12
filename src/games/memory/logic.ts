export type CardState = 'hidden' | 'open' | 'matched';
export type Card = { id: number; symbol: number; state: CardState };

export const LEVELS = {
    easy: { rows: 4, cols: 4 },
    medium: { rows: 5, cols: 4 },
    hard: { rows: 6, cols: 6 },
} as const;
export type Level = keyof typeof LEVELS;

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function createDeck(pairs: number, rng: () => number = Math.random): Card[] {
    const symbols = Array.from({ length: pairs }, (_, i) => [i, i]).flat();
    return shuffle(symbols, rng).map((symbol, id) => ({ id, symbol, state: 'hidden' as const }));
}

export const openCards = (deck: Card[]) => deck.filter(card => card.state === 'open');

/** Flips a card face up. Returns null if the tap should be ignored. */
export function flip(deck: Card[], id: number): Card[] | null {
    const card = deck[id];
    if (!card || card.state !== 'hidden' || openCards(deck).length >= 2) {
        return null;
    }
    return deck.map(c => (c.id === id ? { ...c, state: 'open' } : c));
}

/**
 * Settles two open cards: matched pairs stay up, others flip back.
 * Returns whether they matched.
 */
export function resolve(deck: Card[]): { deck: Card[]; matched: boolean } {
    const open = openCards(deck);
    if (open.length !== 2) {
        return { deck, matched: false };
    }
    const matched = open[0].symbol === open[1].symbol;
    return {
        matched,
        deck: deck.map(c =>
            c.state === 'open' ? { ...c, state: matched ? 'matched' : 'hidden' } : c,
        ),
    };
}

export const isComplete = (deck: Card[]) => deck.every(card => card.state === 'matched');

/** Moves needed for the bonus: 1.5 tries per pair. */
export const parMoves = (pairs: number) => Math.round(pairs * 1.5);
