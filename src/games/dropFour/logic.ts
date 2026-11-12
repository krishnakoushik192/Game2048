export const ROWS = 6;
export const COLS = 7;
export type Disc = 1 | 2;
export type Slot = Disc | 0;
/** grid[row][col], row 0 is the top. */
export type Grid = Slot[][];

export const emptyGrid = (): Grid => Array.from({ length: ROWS }, () => Array<Slot>(COLS).fill(0));

export const opponent = (disc: Disc): Disc => (disc === 1 ? 2 : 1);

/** Lowest empty row in a column, or -1 if the column is full. */
export function landingRow(grid: Grid, col: number): number {
    for (let row = ROWS - 1; row >= 0; row -= 1) {
        if (grid[row][col] === 0) {
            return row;
        }
    }
    return -1;
}

export const validColumns = (grid: Grid) =>
    Array.from({ length: COLS }, (_, c) => c).filter(c => landingRow(grid, c) >= 0);

export function drop(grid: Grid, col: number, disc: Disc): { grid: Grid; row: number } | null {
    const row = landingRow(grid, col);
    if (row < 0) {
        return null;
    }
    const next = grid.map(r => [...r]);
    next[row][col] = disc;
    return { grid: next, row };
}

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [[0, 1], [1, 0], [1, 1], [1, -1]];

/** Checks only lines through the disc just played. Returns the winning cells. */
export function findWin(grid: Grid, row: number, col: number): Array<[number, number]> | null {
    const disc = grid[row][col];
    if (!disc) {
        return null;
    }
    for (const [dr, dc] of DIRECTIONS) {
        const cells: Array<[number, number]> = [[row, col]];
        for (const sign of [1, -1]) {
            let r = row + dr * sign;
            let c = col + dc * sign;
            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c] === disc) {
                cells.push([r, c]);
                r += dr * sign;
                c += dc * sign;
            }
        }
        if (cells.length >= 4) {
            return cells;
        }
    }
    return null;
}

export const isFull = (grid: Grid) => grid[0].every(slot => slot !== 0);

const CENTER_ORDER = [3, 2, 4, 1, 5, 0, 6];

function winningColumn(grid: Grid, disc: Disc): number {
    for (const col of validColumns(grid)) {
        const result = drop(grid, col, disc);
        if (result && findWin(result.grid, result.row, col)) {
            return col;
        }
    }
    return -1;
}

/** Scores every 4-slot window for the heuristic. */
function evaluate(grid: Grid, disc: Disc): number {
    const opp = opponent(disc);
    let score = 0;
    for (let r = 0; r < ROWS; r += 1) {
        if (grid[r][3] === disc) { score += 3; }
    }
    for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
            for (const [dr, dc] of DIRECTIONS) {
                const endR = r + dr * 3;
                const endC = c + dc * 3;
                if (endR < 0 || endR >= ROWS || endC < 0 || endC >= COLS) { continue; }
                let mine = 0;
                let theirs = 0;
                for (let k = 0; k < 4; k += 1) {
                    const slot = grid[r + dr * k][c + dc * k];
                    if (slot === disc) { mine += 1; } else if (slot === opp) { theirs += 1; }
                }
                if (mine === 3 && theirs === 0) { score += 5; }
                if (mine === 2 && theirs === 0) { score += 2; }
                if (theirs === 3 && mine === 0) { score -= 4; }
            }
        }
    }
    return score;
}

function minimax(grid: Grid, depth: number, alpha: number, beta: number, turn: Disc, ai: Disc): number {
    const cols = validColumns(grid);
    if (depth === 0 || cols.length === 0) {
        return evaluate(grid, ai);
    }
    if (turn === ai) {
        let value = -Infinity;
        for (const col of CENTER_ORDER.filter(c => cols.includes(c))) {
            const result = drop(grid, col, turn)!;
            const score = findWin(result.grid, result.row, col)
                ? 1000 + depth
                : minimax(result.grid, depth - 1, alpha, beta, opponent(turn), ai);
            value = Math.max(value, score);
            alpha = Math.max(alpha, value);
            if (alpha >= beta) { break; }
        }
        return value;
    }
    let value = Infinity;
    for (const col of CENTER_ORDER.filter(c => cols.includes(c))) {
        const result = drop(grid, col, turn)!;
        const score = findWin(result.grid, result.row, col)
            ? -1000 - depth
            : minimax(result.grid, depth - 1, alpha, beta, opponent(turn), ai);
        value = Math.min(value, score);
        beta = Math.min(beta, value);
        if (alpha >= beta) { break; }
    }
    return value;
}

export type AiLevel = 'easy' | 'medium' | 'hard';

export function aiMove(grid: Grid, ai: Disc, level: AiLevel, rng: () => number = Math.random): number {
    const cols = validColumns(grid);
    if (cols.length === 0) {
        return -1;
    }
    if (level === 'easy') {
        // Still takes an obvious win so it is not completely random.
        const win = winningColumn(grid, ai);
        return win >= 0 && rng() < 0.5 ? win : cols[Math.floor(rng() * cols.length)];
    }
    const win = winningColumn(grid, ai);
    if (win >= 0) { return win; }
    const block = winningColumn(grid, opponent(ai));
    if (block >= 0) { return block; }
    if (level === 'medium') {
        // Avoid handing the opponent a win on top of our disc.
        const safe = CENTER_ORDER.filter(col => {
            if (!cols.includes(col)) { return false; }
            const after = drop(grid, col, ai)!;
            return winningColumn(after.grid, opponent(ai)) < 0;
        });
        return safe[0] ?? CENTER_ORDER.find(c => cols.includes(c))!;
    }
    let bestCol = cols[0];
    let bestScore = -Infinity;
    for (const col of CENTER_ORDER.filter(c => cols.includes(c))) {
        const result = drop(grid, col, ai)!;
        const score = minimax(result.grid, 4, -Infinity, Infinity, opponent(ai), ai);
        if (score > bestScore) {
            bestScore = score;
            bestCol = col;
        }
    }
    return bestCol;
}
