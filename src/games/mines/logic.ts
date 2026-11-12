export type MineCell = { mine: boolean; near: number; open: boolean; flag: boolean };
export type Field = { rows: number; cols: number; mines: number; cells: MineCell[]; placed: boolean };

export const LEVELS = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 24 },
} as const;
export type Level = keyof typeof LEVELS;

export function createField(rows: number, cols: number, mines: number): Field {
    return {
        rows,
        cols,
        mines,
        placed: false,
        cells: Array.from({ length: rows * cols }, () => ({ mine: false, near: 0, open: false, flag: false })),
    };
}

export function around(field: Pick<Field, 'rows' | 'cols'>, index: number): number[] {
    const row = Math.floor(index / field.cols);
    const col = index % field.cols;
    const result: number[] = [];
    for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
            const r = row + dr;
            const c = col + dc;
            if ((dr || dc) && r >= 0 && c >= 0 && r < field.rows && c < field.cols) {
                result.push(r * field.cols + c);
            }
        }
    }
    return result;
}

/**
 * Places mines after the first tap so the tapped square and its neighbours
 * are always safe (the first tap then always opens an area).
 */
export function placeMines(field: Field, safeIndex: number, rng: () => number = Math.random): Field {
    const banned = new Set([safeIndex, ...around(field, safeIndex)]);
    let candidates = field.cells.map((_, i) => i).filter(i => !banned.has(i));
    if (candidates.length < field.mines) {
        candidates = field.cells.map((_, i) => i).filter(i => i !== safeIndex);
    }
    const mineSet = new Set<number>();
    while (mineSet.size < Math.min(field.mines, candidates.length)) {
        mineSet.add(candidates[Math.floor(rng() * candidates.length)]);
    }
    const cells = field.cells.map((cell, i) => ({ ...cell, mine: mineSet.has(i) }));
    const withCounts = cells.map((cell, i) => ({
        ...cell,
        near: around(field, i).filter(n => cells[n].mine).length,
    }));
    return { ...field, cells: withCounts, placed: true };
}

export type RevealResult = { field: Field; hitMine: boolean };

/** Opens a square; empty squares open their neighbours with a flood fill. */
export function reveal(field: Field, index: number, rng: () => number = Math.random): RevealResult {
    let current = field.placed ? field : placeMines(field, index, rng);
    const target = current.cells[index];
    if (!target || target.open || target.flag) {
        return { field: current, hitMine: false };
    }
    const cells = current.cells.map(cell => ({ ...cell }));
    if (cells[index].mine) {
        cells.forEach(cell => { if (cell.mine) { cell.open = true; } });
        return { field: { ...current, cells }, hitMine: true };
    }
    const stack = [index];
    while (stack.length) {
        const i = stack.pop()!;
        const cell = cells[i];
        if (cell.open || cell.flag || cell.mine) { continue; }
        cell.open = true;
        if (cell.near === 0) {
            stack.push(...around(current, i));
        }
    }
    current = { ...current, cells };
    return { field: current, hitMine: false };
}

export function toggleFlag(field: Field, index: number): Field {
    const cell = field.cells[index];
    if (!cell || cell.open) {
        return field;
    }
    const cells = field.cells.map((c, i) => (i === index ? { ...c, flag: !c.flag } : c));
    return { ...field, cells };
}

export const isCleared = (field: Field) =>
    field.placed && field.cells.every(cell => cell.mine || cell.open);

export const flagsLeft = (field: Field) =>
    field.mines - field.cells.filter(cell => cell.flag).length;

/** Opens one random safe, unopened square (the "Safe hint" power-up). */
export function safeHint(field: Field, rng: () => number = Math.random): number {
    const options = field.cells
        .map((cell, i) => ({ cell, i }))
        .filter(({ cell }) => !cell.mine && !cell.open && !cell.flag)
        .map(({ i }) => i);
    return options.length ? options[Math.floor(rng() * options.length)] : -1;
}
