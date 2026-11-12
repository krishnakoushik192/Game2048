import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameId } from '../theme';

export type GameStats = {
    plays: number;
    wins: number;
    best: number | null;
    /** Local date (YYYY-MM-DD) of the most recent win; used by the daily challenge. */
    lastWinDate: string | null;
};

export type GameResult = {
    /** Score to compare against the best; omit for games without a score. */
    score?: number;
    won?: boolean;
};

const EMPTY: GameStats = { plays: 0, wins: 0, best: null, lastWinDate: null };

const keyFor = (id: GameId) => `@playbox_stats_${id}`;

export const todayKey = (date = new Date()) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
};

export async function loadStats(id: GameId): Promise<GameStats> {
    try {
        const raw = await AsyncStorage.getItem(keyFor(id));
        return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
    } catch {
        return EMPTY;
    }
}

/** Pure merge so it can be unit-tested. */
export function applyResult(
    stats: GameStats,
    result: GameResult,
    lowerIsBetter: boolean,
    today = todayKey(),
): { stats: GameStats; isNewBest: boolean } {
    let isNewBest = false;
    let best = stats.best;
    if (result.score != null && (result.won !== false || !lowerIsBetter)) {
        const better = best == null
            || (lowerIsBetter ? result.score < best : result.score > best);
        if (better) {
            best = result.score;
            // A first-ever result is not celebrated as a "new best".
            isNewBest = stats.best != null;
        }
    }
    return {
        isNewBest,
        stats: {
            plays: stats.plays + 1,
            wins: stats.wins + (result.won ? 1 : 0),
            best,
            lastWinDate: result.won ? today : stats.lastWinDate,
        },
    };
}

/**
 * Per-game stats saved under one AsyncStorage key each.
 * `lowerIsBetter` is for move/time based games (Memory, Slide, Mines); for
 * those, only winning runs can set a best.
 */
export function useGameStats(id: GameId, { lowerIsBetter = false } = {}) {
    const [stats, setStats] = useState<GameStats>(EMPTY);
    const statsRef = useRef(stats);

    useEffect(() => {
        let alive = true;
        loadStats(id).then(loaded => {
            if (alive) {
                statsRef.current = loaded;
                setStats(loaded);
            }
        });
        return () => { alive = false; };
    }, [id]);

    const recordResult = useCallback((result: GameResult) => {
        const { stats: next, isNewBest } = applyResult(statsRef.current, result, lowerIsBetter);
        statsRef.current = next;
        setStats(next);
        AsyncStorage.setItem(keyFor(id), JSON.stringify(next)).catch(error => {
            console.warn('Failed to save stats', error);
        });
        return { isNewBest };
    }, [id, lowerIsBetter]);

    return { stats, recordResult };
}
