import { PracticeAction, TUTORIALS, parseGrid } from '../src/tutorial/content';
import { layoutGrid } from '../src/tutorial/HowToPlay';
import type { Direction } from '../src/shared/input';

const all = Object.values(TUTORIALS);

describe('tutorial content', () => {
    test('there is a tutorial for all 8 games', () => {
        expect(all).toHaveLength(8);
    });

    test.each(all.map(t => [t.name, t] as const))('%s: 3 steps, short titles, valid pictures', (_name, tutorial) => {
        expect(tutorial.steps).toHaveLength(3);
        tutorial.steps.forEach(step => {
            // Kid-friendly rule: six words or fewer.
            expect(step.title.split(/\s+/).length).toBeLessThanOrEqual(6);
            for (const grid of [step.grid, step.practice?.after].filter(Boolean) as string[][]) {
                const rows = parseGrid(grid);
                const width = rows[0].length;
                rows.forEach(row => expect(row).toHaveLength(width));
                rows.flat().forEach(token => expect(() => tutorial.palette(token)).not.toThrow());
                rows.flat().forEach(token => expect(tutorial.palette(token).bg).toBeTruthy());
            }
            if (step.target) {
                const rows = parseGrid(step.grid);
                expect(step.target[0]).toBeLessThan(rows.length);
                expect(step.target[1]).toBeLessThan(rows[0].length);
            }
            if (step.practice?.after) {
                const before = parseGrid(step.grid);
                const after = parseGrid(step.practice.after);
                expect(after.length).toBe(before.length);
                expect(after[0].length).toBe(before[0].length);
            }
        });
    });

    test.each(all.map(t => [t.name, t] as const))('%s: step 2 is the "your turn" step and accepts the move the hand shows', (_name, tutorial) => {
        const practiceSteps = tutorial.steps.filter(step => step.practice);
        expect(practiceSteps).toHaveLength(1);
        expect(tutorial.steps[1].practice).toBeDefined();

        const step = tutorial.steps[1];
        const [row, col] = step.target!;
        const shown: PracticeAction = step.gesture === 'tap'
            ? { type: 'tap', row, col }
            : { type: 'swipe', dir: step.gesture!.slice(6) as Direction };
        expect(step.practice!.accepts(shown)).toBe(true);

        // A different move is rejected (it only wiggles).
        const wrong: PracticeAction = step.gesture === 'tap'
            ? { type: 'swipe', dir: 'up' }
            : { type: 'swipe', dir: step.gesture === 'swipe-up' ? 'down' : 'up' };
        expect(step.practice!.accepts(wrong)).toBe(false);
    });
});

describe('tutorial layout', () => {
    test('grids always fit inside the picture area and are centred', () => {
        for (const [rows, cols] of [[2, 2], [3, 3], [4, 4], [3, 4], [4, 5], [5, 5], [6, 6]]) {
            const { cell, offX, offY } = layoutGrid(rows, cols, 314);
            expect(cols * cell + 8 * (cols - 1) + offX * 2).toBeCloseTo(314);
            expect(rows * cell + 8 * (rows - 1) + offY * 2).toBeCloseTo(314);
            expect(offX).toBeGreaterThanOrEqual(0);
            expect(offY).toBeGreaterThanOrEqual(0);
        }
    });
});
