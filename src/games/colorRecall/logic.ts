export const PAD_COUNT = 4;

export function extendSequence(sequence: number[], rng: () => number = Math.random): number[] {
    return [...sequence, Math.floor(rng() * PAD_COUNT)];
}

/** Time a pad stays lit; a little faster every 5 rounds, never below 250ms. */
export function stepTiming(round: number) {
    const speedUps = Math.floor((round - 1) / 5);
    const on = Math.max(250, 600 - speedUps * 70);
    return { on, off: Math.max(120, Math.round(on / 3)) };
}

export type InputResult = 'correct' | 'roundComplete' | 'wrong';

/** Checks a tap against the sequence at the given position. */
export function checkInput(sequence: number[], position: number, pad: number): InputResult {
    if (sequence[position] !== pad) {
        return 'wrong';
    }
    return position === sequence.length - 1 ? 'roundComplete' : 'correct';
}
