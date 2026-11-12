export type Mark = 'X' | 'O';
export type Cell = Mark | null;
export type Board = Cell[];

export const WIN_LINES: ReadonlyArray<readonly [number, number, number]> = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

export const emptyBoard = (): Board => Array(9).fill(null);

export const other = (mark: Mark): Mark => (mark === 'X' ? 'O' : 'X');

export function getWinner(board: Board): { winner: Mark; line: readonly number[] } | null {
    for (const line of WIN_LINES) {
        const [a, b, c] = line;
        const mark = board[a];
        if (mark && mark === board[b] && mark === board[c]) {
            return { winner: mark, line };
        }
    }
    return null;
}

export const isFull = (board: Board) => board.every(cell => cell !== null);

export const isDraw = (board: Board) => isFull(board) && !getWinner(board);

export const emptyCells = (board: Board) =>
    board.reduce<number[]>((acc, cell, index) => (cell === null ? [...acc, index] : acc), []);

export function play(board: Board, index: number, mark: Mark): Board | null {
    if (board[index] !== null || getWinner(board)) {
        return null;
    }
    const next = [...board];
    next[index] = mark;
    return next;
}

export function randomMove(board: Board, rng: () => number = Math.random): number {
    const cells = emptyCells(board);
    return cells[Math.floor(rng() * cells.length)];
}

// There are only a few thousand reachable positions, so caching them makes
// the AI instant even on an empty board.
const cache = new Map<string, number>();

/** Minimax with depth so the AI wins fast and loses slow. Never loses. */
function minimax(board: Board, turn: Mark, ai: Mark, depth: number): number {
    const key = `${board.map(c => c ?? '-').join('')}${turn}${ai}${depth}`;
    const cached = cache.get(key);
    if (cached !== undefined) {
        return cached;
    }
    let value: number;
    const result = getWinner(board);
    if (result) {
        value = result.winner === ai ? 10 - depth : depth - 10;
    } else if (isFull(board)) {
        value = 0;
    } else {
        const scores = emptyCells(board).map(index => {
            const next = [...board];
            next[index] = turn;
            return minimax(next, other(turn), ai, depth + 1);
        });
        value = turn === ai ? Math.max(...scores) : Math.min(...scores);
    }
    cache.set(key, value);
    return value;
}

export function bestMove(board: Board, ai: Mark): number {
    let best = -Infinity;
    let move = -1;
    for (const index of emptyCells(board)) {
        const next = [...board];
        next[index] = ai;
        const score = minimax(next, other(ai), ai, 1);
        // Prefer the centre on ties, it looks more natural.
        if (score > best || (score === best && index === 4)) {
            best = score;
            move = index;
        }
    }
    return move;
}
