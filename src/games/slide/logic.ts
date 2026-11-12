import type { Direction } from '../../shared/input';

/** Board is a flat array, 0 is the empty space. */
export type SlideBoard = number[];

export const solvedBoard = (size: number): SlideBoard =>
    Array.from({ length: size * size }, (_, i) => (i === size * size - 1 ? 0 : i + 1));

export const isSolved = (board: SlideBoard) =>
    board.every((value, i) => (i === board.length - 1 ? value === 0 : value === i + 1));

export const inPlaceCount = (board: SlideBoard) =>
    board.filter((value, i) => value !== 0 && value === i + 1).length;

export function neighbors(index: number, size: number): number[] {
    const row = Math.floor(index / size);
    const col = index % size;
    const result: number[] = [];
    if (row > 0) { result.push(index - size); }
    if (row < size - 1) { result.push(index + size); }
    if (col > 0) { result.push(index - 1); }
    if (col < size - 1) { result.push(index + 1); }
    return result;
}

/** Slides the tile at `index` into the gap if they touch. */
export function moveTile(board: SlideBoard, size: number, index: number): SlideBoard | null {
    const gap = board.indexOf(0);
    if (!neighbors(gap, size).includes(index)) {
        return null;
    }
    const next = [...board];
    [next[gap], next[index]] = [next[index], next[gap]];
    return next;
}

/** A swipe moves the tile on the opposite side of the gap toward it. */
export function moveByDirection(board: SlideBoard, size: number, direction: Direction): SlideBoard | null {
    const gap = board.indexOf(0);
    const row = Math.floor(gap / size);
    const col = gap % size;
    const source = {
        up: row < size - 1 ? gap + size : -1,
        down: row > 0 ? gap - size : -1,
        left: col < size - 1 ? gap + 1 : -1,
        right: col > 0 ? gap - 1 : -1,
    }[direction];
    return source >= 0 ? moveTile(board, size, source) : null;
}

/**
 * Shuffles with random legal moves from the solved board, so every puzzle
 * is solvable (a random permutation is unsolvable half the time).
 */
export function shuffleBoard(size: number, moves = 200, rng: () => number = Math.random): SlideBoard {
    let board = solvedBoard(size);
    let previousGap = -1;
    for (let i = 0; i < moves; i += 1) {
        const gap = board.indexOf(0);
        const options = neighbors(gap, size).filter(n => n !== previousGap);
        const pick = options[Math.floor(rng() * options.length)];
        board = moveTile(board, size, pick) ?? board;
        previousGap = gap;
    }
    return isSolved(board) ? shuffleBoard(size, moves, rng) : board;
}
