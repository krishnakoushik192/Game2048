import * as ttt from '../../src/games/tictactoe/logic';
import * as memory from '../../src/games/memory/logic';
import * as recall from '../../src/games/colorRecall/logic';
import * as slide from '../../src/games/slide/logic';
import * as four from '../../src/games/dropFour/logic';
import * as snake from '../../src/games/snake/logic';
import * as mines from '../../src/games/mines/logic';
import { applyResult } from '../../src/shared/stats';
import { directionFromDrag } from '../../src/shared/input';

/** Deterministic random numbers for repeatable tests. */
const seeded = (seed = 42) => {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
};

describe('Tic-Tac-Toe', () => {
    test('finds row, column and diagonal winners', () => {
        expect(ttt.getWinner(['X', 'X', 'X', null, 'O', 'O', null, null, null])?.winner).toBe('X');
        expect(ttt.getWinner(['O', 'X', null, 'O', 'X', null, 'O', null, null])?.line).toEqual([0, 3, 6]);
        expect(ttt.getWinner(['X', 'O', null, 'O', 'X', null, null, null, 'X'])?.line).toEqual([0, 4, 8]);
        expect(ttt.getWinner(ttt.emptyBoard())).toBeNull();
    });

    test('detects a draw', () => {
        const board: ttt.Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
        expect(ttt.isDraw(board)).toBe(true);
    });

    test('play rejects taken squares and finished games', () => {
        expect(ttt.play(['X', null, null, null, null, null, null, null, null], 0, 'O')).toBeNull();
        expect(ttt.play(['X', 'X', 'X', null, null, null, null, null, null], 4, 'O')).toBeNull();
    });

    test('smart AI takes a win and blocks a loss', () => {
        expect(ttt.bestMove(['O', 'O', null, 'X', 'X', null, null, null, null], 'O')).toBe(2);
        expect(ttt.bestMove(['X', 'X', null, null, 'O', null, null, null, null], 'O')).toBe(2);
    });

    test('smart AI never loses against random play', () => {
        const rng = seeded(7);
        for (let game = 0; game < 40; game += 1) {
            let board = ttt.emptyBoard();
            let turn: ttt.Mark = game % 2 ? 'X' : 'O';
            while (!ttt.getWinner(board) && !ttt.isFull(board)) {
                const index = turn === 'O' ? ttt.bestMove(board, 'O') : ttt.randomMove(board, rng);
                board = ttt.play(board, index, turn)!;
                turn = ttt.other(turn);
            }
            expect(ttt.getWinner(board)?.winner).not.toBe('X');
        }
    });
});

describe('Memory Match', () => {
    test('deck has every symbol exactly twice', () => {
        const deck = memory.createDeck(8, seeded());
        expect(deck).toHaveLength(16);
        for (let s = 0; s < 8; s += 1) {
            expect(deck.filter(card => card.symbol === s)).toHaveLength(2);
        }
    });

    test('match stays open, mismatch flips back, third flip is blocked', () => {
        const deck: memory.Card[] = [
            { id: 0, symbol: 0, state: 'hidden' },
            { id: 1, symbol: 1, state: 'hidden' },
            { id: 2, symbol: 0, state: 'hidden' },
            { id: 3, symbol: 1, state: 'hidden' },
        ];
        let next = memory.flip(memory.flip(deck, 0)!, 2)!;
        expect(memory.flip(next, 1)).toBeNull();
        const matched = memory.resolve(next);
        expect(matched.matched).toBe(true);
        expect(matched.deck[0].state).toBe('matched');

        next = memory.flip(memory.flip(matched.deck, 1)!, 3)!;
        expect(memory.isComplete(memory.resolve(next).deck)).toBe(true);

        const miss = memory.resolve(memory.flip(memory.flip(deck, 0)!, 1)!);
        expect(miss.matched).toBe(false);
        expect(miss.deck.every(card => card.state === 'hidden')).toBe(true);
    });

    test('cannot flip an already matched card', () => {
        const deck: memory.Card[] = [{ id: 0, symbol: 0, state: 'matched' }];
        expect(memory.flip(deck, 0)).toBeNull();
    });
});

describe('Color Recall', () => {
    test('sequence grows by one valid pad', () => {
        const seq = recall.extendSequence(recall.extendSequence([], seeded()), seeded(3));
        expect(seq).toHaveLength(2);
        seq.forEach(pad => expect(pad).toBeGreaterThanOrEqual(0));
        seq.forEach(pad => expect(pad).toBeLessThan(recall.PAD_COUNT));
    });

    test('checks input positions', () => {
        expect(recall.checkInput([1, 2, 3], 0, 1)).toBe('correct');
        expect(recall.checkInput([1, 2, 3], 2, 3)).toBe('roundComplete');
        expect(recall.checkInput([1, 2, 3], 1, 0)).toBe('wrong');
    });

    test('gets faster but has a floor', () => {
        expect(recall.stepTiming(1).on).toBe(600);
        expect(recall.stepTiming(6).on).toBeLessThan(600);
        expect(recall.stepTiming(200).on).toBe(250);
    });
});

describe('Slide Puzzle', () => {
    test('solved board is detected', () => {
        expect(slide.isSolved(slide.solvedBoard(4))).toBe(true);
        expect(slide.inPlaceCount(slide.solvedBoard(3))).toBe(8);
    });

    test('only tiles next to the gap can move', () => {
        const board = slide.solvedBoard(3); // gap at 8
        expect(slide.moveTile(board, 3, 0)).toBeNull();
        expect(slide.moveTile(board, 3, 7)?.[8]).toBe(8);
    });

    test('swipe moves the tile toward the gap', () => {
        const board = slide.solvedBoard(3);
        expect(slide.moveByDirection(board, 3, 'right')?.[8]).toBe(8);
        expect(slide.moveByDirection(board, 3, 'down')?.[8]).toBe(6);
        expect(slide.moveByDirection(board, 3, 'left')).toBeNull();
    });

    test('shuffle is unsolved, keeps every tile, and is solvable', () => {
        for (const size of [3, 4, 5]) {
            const board = slide.shuffleBoard(size, 200, seeded(size));
            expect(slide.isSolved(board)).toBe(false);
            expect([...board].sort((a, b) => a - b)).toEqual([...slide.solvedBoard(size)].sort((a, b) => a - b));
            // Solvability check (inversions + gap row parity).
            const tiles = board.filter(v => v !== 0);
            let inversions = 0;
            tiles.forEach((v, i) => tiles.slice(i + 1).forEach(w => { if (w < v) { inversions += 1; } }));
            if (size % 2 === 1) {
                expect(inversions % 2).toBe(0);
            } else {
                const gapRowFromBottom = size - Math.floor(board.indexOf(0) / size);
                expect((inversions + gapRowFromBottom) % 2).toBe(1);
            }
        }
    });
});

describe('Drop Four', () => {
    const playAll = (moves: number[]) => {
        let grid = four.emptyGrid();
        let disc: four.Disc = 1;
        let last = { row: 0, col: 0 };
        for (const col of moves) {
            const result = four.drop(grid, col, disc)!;
            grid = result.grid;
            last = { row: result.row, col };
            disc = four.opponent(disc);
        }
        return { grid, last };
    };

    test('discs land on the lowest empty row', () => {
        const { grid } = playAll([3, 3]);
        expect(grid[5][3]).toBe(1);
        expect(grid[4][3]).toBe(2);
    });

    test('full column rejects a drop', () => {
        const { grid } = playAll([0, 0, 0, 0, 0, 0]);
        expect(four.drop(grid, 0, 1)).toBeNull();
    });

    test('detects horizontal, vertical and diagonal wins', () => {
        let { grid, last } = playAll([0, 0, 1, 1, 2, 2, 3]);
        expect(four.findWin(grid, last.row, last.col)).toHaveLength(4);
        ({ grid, last } = playAll([0, 1, 0, 1, 0, 1, 0]));
        expect(four.findWin(grid, last.row, last.col)).not.toBeNull();
        ({ grid, last } = playAll([0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]));
        expect(four.findWin(grid, last.row, last.col)).not.toBeNull();
        ({ grid, last } = playAll([0, 1, 2]));
        expect(four.findWin(grid, last.row, last.col)).toBeNull();
    });

    test('medium and hard AI win when they can and block when they must', () => {
        const { grid } = playAll([0, 6, 1, 6, 2]); // player 1 threatens column 3
        expect(four.aiMove(grid, 2, 'medium')).toBe(3);
        expect(four.aiMove(grid, 2, 'hard')).toBe(3);
        const winning = playAll([0, 6, 1, 6, 5, 6]).grid; // player 2 has three in column 6
        expect(four.aiMove(winning, 2, 'medium')).toBe(6);
    });

    test('AI always returns a playable column', () => {
        const rng = seeded(11);
        let grid = four.emptyGrid();
        let disc: four.Disc = 1;
        for (let i = 0; i < 20; i += 1) {
            const col = four.aiMove(grid, disc, 'easy', rng);
            expect(four.validColumns(grid)).toContain(col);
            grid = four.drop(grid, col, disc)!.grid;
            disc = four.opponent(disc);
        }
    });
});

describe('Snake', () => {
    test('moves forward and ignores reversing', () => {
        const start = snake.createSnake(15, seeded());
        const moved = snake.step(start, 'left');
        expect(moved.direction).toBe('right');
        expect(moved.body[moved.body.length - 1]).toEqual({ r: 7, c: 5 });
        expect(moved.body).toHaveLength(3);
    });

    test('grows when eating and places new food off the body', () => {
        const start: snake.SnakeState = { ...snake.createSnake(15, seeded()), food: { r: 7, c: 5 } };
        const ate = snake.step(start, 'right', { rng: seeded(2) });
        expect(ate.body).toHaveLength(4);
        expect(ate.eaten).toBe(1);
        expect(ate.body.some(p => snake.samePoint(p, ate.food))).toBe(false);
    });

    test('dies on walls unless wrapping', () => {
        let state: snake.SnakeState = { ...snake.createSnake(5, seeded()), food: { r: 0, c: 0 } };
        state = { ...state, body: [{ r: 2, c: 3 }, { r: 2, c: 4 }] };
        expect(snake.step(state).alive).toBe(false);
        expect(snake.step(state, 'right', { wrap: true }).body[1]).toEqual({ r: 2, c: 0 });
    });

    test('dies when hitting itself but may follow its own tail', () => {
        const body = [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 2 }, { r: 2, c: 1 }];
        const state: snake.SnakeState = { size: 6, body, direction: 'left', food: { r: 5, c: 5 }, alive: true, eaten: 0 };
        expect(snake.step(state, 'up').alive).toBe(true); // tail at (1,1) moves away
        const longer = { ...state, body: [{ r: 0, c: 1 }, ...body] };
        expect(snake.step(longer, 'up').alive).toBe(false);
    });

    test('speeds up with a floor', () => {
        expect(snake.tickMs(0)).toBe(150);
        expect(snake.tickMs(5)).toBeLessThan(150);
        expect(snake.tickMs(1000)).toBe(70);
    });
});

describe('Mine Finder', () => {
    test('first tap is always safe and opens an area', () => {
        for (let seed = 1; seed < 20; seed += 1) {
            const field = mines.createField(9, 9, 10);
            const { field: after, hitMine } = mines.reveal(field, 40, seeded(seed));
            expect(hitMine).toBe(false);
            expect(after.cells.filter(c => c.mine)).toHaveLength(10);
            expect(after.cells[40].near).toBe(0);
            expect(after.cells.filter(c => c.open).length).toBeGreaterThan(1);
        }
    });

    test('numbers count neighbouring mines', () => {
        const field = mines.reveal(mines.createField(9, 9, 10), 0, seeded(5)).field;
        field.cells.forEach((cell, i) => {
            const count = mines.around(field, i).filter(n => field.cells[n].mine).length;
            expect(cell.near).toBe(count);
        });
    });

    test('hitting a mine reveals all mines; flags block digging', () => {
        let field = mines.reveal(mines.createField(9, 9, 10), 40, seeded(3)).field;
        const mineIndex = field.cells.findIndex(c => c.mine);
        field = mines.toggleFlag(field, mineIndex);
        expect(mines.flagsLeft(field)).toBe(9);
        expect(mines.reveal(field, mineIndex).hitMine).toBe(false);
        field = mines.toggleFlag(field, mineIndex);
        const boom = mines.reveal(field, mineIndex);
        expect(boom.hitMine).toBe(true);
        expect(boom.field.cells.filter(c => c.mine).every(c => c.open)).toBe(true);
    });

    test('clearing every safe square wins', () => {
        let field = mines.reveal(mines.createField(9, 9, 10), 40, seeded(9)).field;
        field.cells.forEach((cell, i) => {
            if (!cell.mine) { field = mines.reveal(field, i).field; }
        });
        expect(mines.isCleared(field)).toBe(true);
    });
});

describe('Shared helpers', () => {
    test('stats keep the best score in the right direction', () => {
        const empty = { plays: 0, wins: 0, best: null, lastWinDate: null };
        const first = applyResult(empty, { score: 30, won: true }, true, '2026-11-12');
        expect(first.stats.best).toBe(30);
        expect(first.isNewBest).toBe(false);
        expect(first.stats.lastWinDate).toBe('2026-11-12');
        expect(applyResult(first.stats, { score: 20, won: true }, true).isNewBest).toBe(true);
        expect(applyResult(first.stats, { score: 10, won: false }, true).stats.best).toBe(30);
        expect(applyResult(first.stats, { score: 50 }, false).stats.best).toBe(50);
    });

    test('swipe direction uses the dominant axis', () => {
        expect(directionFromDrag(40, 10)).toBe('right');
        expect(directionFromDrag(-5, -60)).toBe('up');
        expect(directionFromDrag(5, 5)).toBeNull();
    });
});
