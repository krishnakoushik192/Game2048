import type { Direction } from '../../shared/input';

export type Point = { r: number; c: number };
export type SnakeState = {
    size: number;
    /** Tail first, head last. */
    body: Point[];
    direction: Direction;
    food: Point;
    alive: boolean;
    eaten: number;
};

const DELTA: Record<Direction, Point> = {
    up: { r: -1, c: 0 },
    down: { r: 1, c: 0 },
    left: { r: 0, c: -1 },
    right: { r: 0, c: 1 },
};

const OPPOSITE: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const isOpposite = (a: Direction, b: Direction) => OPPOSITE[a] === b;

export const samePoint = (a: Point, b: Point) => a.r === b.r && a.c === b.c;

export function placeFood(size: number, body: Point[], rng: () => number = Math.random): Point {
    const free: Point[] = [];
    for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
            if (!body.some(p => p.r === r && p.c === c)) {
                free.push({ r, c });
            }
        }
    }
    return free[Math.floor(rng() * free.length)] ?? { r: -1, c: -1 };
}

export function createSnake(size = 15, rng: () => number = Math.random): SnakeState {
    const row = Math.floor(size / 2);
    const body = [{ r: row, c: 2 }, { r: row, c: 3 }, { r: row, c: 4 }];
    return { size, body, direction: 'right', food: placeFood(size, body, rng), alive: true, eaten: 0 };
}

/** A turn straight back into the body is ignored. */
export function turn(state: SnakeState, direction: Direction): Direction {
    return isOpposite(state.direction, direction) ? state.direction : direction;
}

/** Advances one tick. `wrap` lets the snake pass through walls. */
export function step(
    state: SnakeState,
    direction: Direction = state.direction,
    { wrap = false, rng = Math.random }: { wrap?: boolean; rng?: () => number } = {},
): SnakeState {
    if (!state.alive) {
        return state;
    }
    const heading = turn(state, direction);
    const head = state.body[state.body.length - 1];
    let next = { r: head.r + DELTA[heading].r, c: head.c + DELTA[heading].c };
    if (wrap) {
        next = { r: (next.r + state.size) % state.size, c: (next.c + state.size) % state.size };
    }
    const eating = samePoint(next, state.food);
    // The tail moves away this tick unless we are eating, so it is not a collision.
    const bodyAfter = eating ? state.body : state.body.slice(1);
    const hitWall = next.r < 0 || next.c < 0 || next.r >= state.size || next.c >= state.size;
    const hitSelf = bodyAfter.some(p => samePoint(p, next));
    if (hitWall || hitSelf) {
        return { ...state, direction: heading, alive: false };
    }
    const body = [...bodyAfter, next];
    return {
        ...state,
        body,
        direction: heading,
        food: eating ? placeFood(state.size, body, rng) : state.food,
        eaten: state.eaten + (eating ? 1 : 0),
    };
}

/** Tick length: 150ms, 5% faster every 5 berries, never below 70ms. */
export const tickMs = (eaten: number) => Math.max(70, Math.round(150 * 0.95 ** Math.floor(eaten / 5)));
