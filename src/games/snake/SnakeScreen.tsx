import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { colors, gameColors, outlined, fonts } from '../../theme';
import { GameShell, useBoardSize } from '../../shared/GameShell';
import { ChunkyButton, StatChip } from '../../shared/ui';
import { ResultModal } from '../../shared/ResultModal';
import type { ResultInfo } from '../../shared/ResultModal';
import { usePlaybox } from '../../shared/playbox';
import { useGameStats } from '../../shared/stats';
import { Direction, useSwipe, useTapSound } from '../../shared/input';
import { SnakeState, createSnake, step, tickMs } from './logic';

const COLOR = gameColors.snake;
const GRID = 15;
const COINS_PER_BERRY = 1;
type Phase = 'ready' | 'running' | 'paused' | 'over';

export default function SnakeScreen() {
    const size = useBoardSize(360);
    const { addCoins } = usePlaybox();
    const { stats, recordResult } = useGameStats('snake');
    const tap = useTapSound();
    const [game, setGame] = useState<SnakeState>(() => createSnake(GRID));
    const [phase, setPhase] = useState<Phase>('ready');
    const [result, setResult] = useState<ResultInfo | null>(null);
    // Queue the next turn so two quick swipes between ticks both count.
    const pendingTurns = useRef<Direction[]>([]);
    const gameRef = useRef(game);
    gameRef.current = game;

    const finish = useCallback((final: SnakeState) => {
        const length = final.body.length;
        const coins = final.eaten * COINS_PER_BERRY;
        const { isNewBest } = recordResult({ score: length });
        if (coins) { addCoins(coins); }
        setPhase('over');
        setResult({
            title: final.eaten >= 10 ? 'Great run!' : 'Crashed!',
            subtitle: 'Snake',
            scoreLabel: 'LENGTH',
            score: String(length),
            isNewBest,
            won: final.eaten >= 10,
            coins,
            stats: [
                { label: 'Berries', value: String(final.eaten) },
                { label: 'Best', value: String(Math.max(stats.best ?? 0, length)) },
            ],
        });
    }, [addCoins, recordResult, stats.best]);

    // Game loop: the interval restarts whenever the speed changes.
    useEffect(() => {
        if (phase !== 'running') { return; }
        const id = setInterval(() => {
            const current = gameRef.current;
            const next = step(current, pendingTurns.current.shift() ?? current.direction);
            if (next.eaten > current.eaten) { tap(); }
            gameRef.current = next;
            setGame(next);
            if (!next.alive) {
                clearInterval(id);
                finish(next);
            }
        }, tickMs(game.eaten));
        return () => clearInterval(id);
    }, [finish, game.eaten, phase, tap]);

    // Pause when the app goes to the background.
    useEffect(() => {
        const sub = AppState.addEventListener('change', state => {
            if (state !== 'active') {
                setPhase(p => (p === 'running' ? 'paused' : p));
            }
        });
        return () => sub.remove();
    }, []);

    const start = () => {
        const fresh = createSnake(GRID);
        pendingTurns.current = [];
        gameRef.current = fresh;
        setGame(fresh);
        setResult(null);
        setPhase('running');
    };

    const steer = useCallback((direction: Direction) => {
        if (phase === 'ready') { setPhase('running'); }
        if (phase !== 'running' && phase !== 'ready') { return; }
        const queue = pendingTurns.current;
        const last = queue[queue.length - 1] ?? gameRef.current.direction;
        if (direction !== last && queue.length < 2) {
            queue.push(direction);
        }
    }, [phase]);

    const swipe = useSwipe(steer);
    const cell = (size - 16) / GRID;
    const head = game.body[game.body.length - 1];

    const pad = (direction: Direction, icon: 'chevron-up' | 'chevron-down' | 'chevron-left' | 'chevron-right') => (
        <ChunkyButton
            icon={icon}
            accessibilityLabel={`Steer ${direction}`}
            onPress={() => steer(direction)}
            color={game.direction === direction && phase === 'running' ? COLOR.main : colors.card}
            style={styles.padButton}
        />
    );

    return (
        <GameShell
            title="Snake"
            background={COLOR.tint}
            scroll={false}
            action={phase === 'running'
                ? { icon: 'pause', label: 'Pause', onPress: () => setPhase('paused') }
                : { icon: 'play', label: 'Play', onPress: () => (phase === 'paused' ? setPhase('running') : start()) }}>
            <View style={styles.row}>
                <StatChip label="LENGTH" value={game.body.length} highlight={COLOR.main} />
                <StatChip label="BEST" value={stats.best ?? 0} />
                <StatChip label="SPEED" value={`×${(150 / tickMs(game.eaten)).toFixed(1)}`} />
            </View>

            <GestureDetector gesture={swipe}>
                <View style={[styles.field, { width: size, height: size }]} accessibilityLabel={`Snake field, length ${game.body.length}`}>
                    {game.body.map((p, i) => {
                        const isHead = p === head;
                        return (
                            <View
                                key={`${p.r}-${p.c}-${i}`}
                                style={[
                                    styles.segment,
                                    {
                                        width: cell - 2,
                                        height: cell - 2,
                                        left: 8 + p.c * cell,
                                        top: 8 + p.r * cell,
                                        backgroundColor: isHead ? colors.ink : COLOR.main,
                                        borderRadius: isHead ? cell / 2.5 : cell / 4,
                                    },
                                ]}
                            />
                        );
                    })}
                    <View style={[styles.segment, styles.food, { width: cell - 2, height: cell - 2, left: 8 + game.food.c * cell, top: 8 + game.food.r * cell }]} />
                    {phase !== 'running' && phase !== 'over' && (
                        <View style={styles.overlay} pointerEvents="none">
                            <Text style={styles.overlayText}>{phase === 'paused' ? 'Paused' : 'Swipe or tap a direction to start'}</Text>
                        </View>
                    )}
                </View>
            </GestureDetector>

            <View style={styles.pad}>
                <View style={styles.padRow}>{pad('up', 'chevron-up')}</View>
                <View style={styles.padRow}>
                    {pad('left', 'chevron-left')}
                    {pad('down', 'chevron-down')}
                    {pad('right', 'chevron-right')}
                </View>
            </View>

            <ResultModal result={result} onPlayAgain={start} />
        </GameShell>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    field: {
        alignSelf: 'center',
        backgroundColor: colors.card,
        borderRadius: 24,
        ...outlined,
        overflow: 'hidden',
    },
    segment: { position: 'absolute', ...outlined, borderWidth: 1.5 },
    food: { backgroundColor: colors.danger, borderRadius: 999 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    overlayText: { fontSize: 18, fontFamily: fonts.heavy, color: colors.ink, textAlign: 'center', paddingHorizontal: 24 },
    pad: { alignItems: 'center', gap: 8 },
    padRow: { flexDirection: 'row', gap: 8 },
    padButton: { width: 72 },
});
