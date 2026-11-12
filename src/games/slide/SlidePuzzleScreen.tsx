import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { chunky, colors, gameColors, outlined, fonts } from '../../theme';
import { GameShell, useBoardSize } from '../../shared/GameShell';
import { Segmented, StatChip } from '../../shared/ui';
import { ResultModal } from '../../shared/ResultModal';
import type { ResultInfo } from '../../shared/ResultModal';
import { usePlaybox } from '../../shared/playbox';
import { useGameStats } from '../../shared/stats';
import { Direction, useSwipe, useTapSound } from '../../shared/input';
import { SlideBoard, inPlaceCount, isSolved, moveByDirection, moveTile, shuffleBoard } from './logic';

const COLOR = gameColors.slide;
const SOLVE_COINS = 20;
type Size = '3' | '4' | '5';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function SlidePuzzleScreen() {
    const boardSize = useBoardSize(360);
    const { addCoins } = usePlaybox();
    const { stats, recordResult } = useGameStats('slide', { lowerIsBetter: true });
    const tap = useTapSound();
    const [sizeKey, setSizeKey] = useState<Size>('4');
    const size = Number(sizeKey);
    const [board, setBoard] = useState<SlideBoard>(() => shuffleBoard(4));
    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [started, setStarted] = useState(false);
    const [result, setResult] = useState<ResultInfo | null>(null);
    const solved = isSolved(board);

    useEffect(() => {
        if (!started || solved) { return; }
        const id = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, [solved, started]);

    const reset = useCallback((nextSize = size) => {
        setBoard(shuffleBoard(nextSize));
        setMoves(0);
        setSeconds(0);
        setStarted(false);
        setResult(null);
    }, [size]);

    const apply = useCallback((next: SlideBoard | null) => {
        if (!next || solved) { return; }
        tap();
        setStarted(true);
        setBoard(next);
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        if (isSolved(next)) {
            const { isNewBest } = recordResult({ score: nextMoves, won: true });
            addCoins(SOLVE_COINS);
            setTimeout(() => setResult({
                won: true,
                title: 'Puzzle solved!',
                subtitle: `Slide Puzzle · ${size}×${size}`,
                scoreLabel: 'MOVES',
                score: String(nextMoves),
                isNewBest,
                coins: SOLVE_COINS,
                stats: [
                    { label: 'Time', value: formatTime(seconds) },
                    { label: 'Best', value: String(Math.min(stats.best ?? nextMoves, nextMoves)) },
                ],
            }), 400);
        }
    }, [addCoins, moves, recordResult, seconds, size, solved, stats.best, tap]);

    const onSwipe = useCallback((direction: Direction) => apply(moveByDirection(board, size, direction)), [apply, board, size]);
    const swipe = useSwipe(onSwipe);

    const gap = 8;
    const inner = boardSize - 24;
    const tile = (inner - gap * (size - 1)) / size;

    return (
        <GameShell
            title="Slide Puzzle"
            background={COLOR.tint}
            scroll={false}
            action={{ icon: 'shuffle', label: 'Shuffle', onPress: () => reset() }}
            footer={
                <Segmented
                    label="Puzzle size"
                    value={sizeKey}
                    onChange={next => { setSizeKey(next); reset(Number(next)); }}
                    options={[{ value: '3', label: '3×3' }, { value: '4', label: '4×4' }, { value: '5', label: '5×5' }]}
                />
            }>
            <View style={styles.row}>
                <StatChip label="MOVES" value={moves} highlight={COLOR.main} />
                <StatChip label="TIME" value={formatTime(seconds)} />
                <StatChip label="BEST" value={stats.best ?? '–'} />
            </View>

            <GestureDetector gesture={swipe}>
                <View style={[styles.board, { width: boardSize, height: boardSize + 5, gap }]}>
                    {board.map((value, index) => {
                        if (value === 0) {
                            return <View key="gap" style={[styles.gap, { width: tile, height: tile }]} />;
                        }
                        const ok = value === index + 1;
                        return (
                            <Pressable
                                key={value}
                                onPress={() => apply(moveTile(board, size, index))}
                                accessibilityRole="button"
                                accessibilityLabel={`Tile ${value}${ok ? ', in place' : ''}`}
                                style={[styles.tile, chunky(3), { width: tile, height: tile, backgroundColor: ok ? COLOR.main : colors.card }]}>
                                <Text style={[styles.tileText, { fontSize: tile * 0.4 }]}>{value}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </GestureDetector>

            <View style={styles.legend}>
                <View style={styles.legendItem}><View style={[styles.swatch, { backgroundColor: COLOR.main }]} /><Text style={styles.legendText}>In place</Text></View>
                <View style={styles.legendItem}><View style={styles.swatch} /><Text style={styles.legendText}>Wrong spot</Text></View>
                <Text style={[styles.legendText, styles.count]}>{inPlaceCount(board)} / {size * size - 1} done</Text>
            </View>
            <Text style={styles.hint}>Tap a tile next to the gap, or swipe toward the gap.</Text>

            <ResultModal result={result} onPlayAgain={() => reset()} />
        </GameShell>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    board: {
        alignSelf: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: colors.sand,
        borderRadius: 24,
        ...chunky(5),
        padding: 10,
    },
    tile: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    tileText: { fontFamily: fonts.display, color: colors.ink },
    gap: { borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(43,33,64,0.3)' },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    swatch: { width: 18, height: 18, borderRadius: 6, ...outlined, backgroundColor: colors.card },
    legendText: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink },
    count: { marginLeft: 'auto' },
    hint: { fontSize: 14, fontFamily: fonts.bold, color: colors.muted, textAlign: 'center' },
});
