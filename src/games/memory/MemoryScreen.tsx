import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, gameColors, outlined, chunky } from '../../theme';
import { GameShell, useBoardSize } from '../../shared/GameShell';
import { ChunkyButton, Segmented, StatChip } from '../../shared/ui';
import { ResultModal } from '../../shared/ResultModal';
import type { ResultInfo } from '../../shared/ResultModal';
import { usePlaybox } from '../../shared/playbox';
import { useGameStats } from '../../shared/stats';
import { useTapSound } from '../../shared/input';
import { Card, LEVELS, Level, createDeck, flip, isComplete, openCards, parMoves, resolve } from './logic';

const COLOR = gameColors.memory;
const SYMBOLS = ['★', '●', '▲', '◆', '■', '♥', '✿', '☾', '♣', '♠', '✚', '⬟', '☀', '✦', '⬢', '♪', '☂', '⚑'];
const SYMBOL_COLORS = ['#FFA94D', '#3D8BFF', '#3DBE6B', '#8B6CFF', '#FF5A5A', '#FF6FA8', '#E0A800', '#22B8B0'];
const MISMATCH_MS = 700;
const PEEK_MS = 2000;
const CLEAR_COINS = 15;
const PAR_BONUS = 5;

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function MemoryScreen() {
    const width = useBoardSize(400);
    const { addCoins } = usePlaybox();
    const { stats, recordResult } = useGameStats('memory', { lowerIsBetter: true });
    const tap = useTapSound();
    const [level, setLevel] = useState<Level>('easy');
    const { rows, cols } = LEVELS[level];
    const pairs = (rows * cols) / 2;
    const [deck, setDeck] = useState<Card[]>(() => createDeck(pairs));
    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [started, setStarted] = useState(false);
    const [peeking, setPeeking] = useState(false);
    const [peeksLeft, setPeeksLeft] = useState(1);
    const [result, setResult] = useState<ResultInfo | null>(null);
    const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

    const done = isComplete(deck);
    const matchedPairs = deck.filter(c => c.state === 'matched').length / 2;

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    useEffect(() => {
        if (!started || done) { return; }
        const id = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, [done, started]);

    const later = (fn: () => void, ms: number) => {
        timers.current.push(setTimeout(fn, ms));
    };

    const reset = useCallback((nextLevel: Level = level) => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        const { rows: r, cols: c } = LEVELS[nextLevel];
        setDeck(createDeck((r * c) / 2));
        setMoves(0);
        setSeconds(0);
        setStarted(false);
        setPeeking(false);
        setPeeksLeft(1);
        setResult(null);
    }, [level]);

    const win = (finalMoves: number) => {
        const underPar = finalMoves <= parMoves(pairs);
        const coins = CLEAR_COINS + (underPar ? PAR_BONUS : 0);
        const { isNewBest } = recordResult({ score: finalMoves, won: true });
        addCoins(coins);
        later(() => setResult({
            won: true,
            title: 'All pairs found!',
            subtitle: `Memory Match · ${rows}×${cols}`,
            scoreLabel: 'MOVES',
            score: String(finalMoves),
            isNewBest,
            coins,
            stats: [
                { label: 'Time', value: formatTime(seconds) },
                { label: 'Par', value: String(parMoves(pairs)) },
                { label: 'Best', value: String(Math.min(stats.best ?? finalMoves, finalMoves)) },
            ],
        }), 500);
    };

    const onCardPress = (id: number) => {
        if (peeking) { return; }
        const flipped = flip(deck, id);
        if (!flipped) { return; }
        tap();
        setStarted(true);
        setDeck(flipped);
        if (openCards(flipped).length < 2) { return; }
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        const settled = resolve(flipped);
        if (settled.matched) {
            setDeck(settled.deck);
            if (isComplete(settled.deck)) { win(nextMoves); }
        } else {
            later(() => setDeck(settled.deck), MISMATCH_MS);
        }
    };

    const peek = () => {
        if (peeksLeft <= 0 || peeking || done) { return; }
        setPeeksLeft(p => p - 1);
        setPeeking(true);
        later(() => setPeeking(false), PEEK_MS);
    };

    const gap = 8;
    const cardWidth = (width - gap * (cols - 1)) / cols;
    const cardHeight = Math.min(cardWidth * 1.2, 96);

    return (
        <GameShell
            title="Memory Match"
            background={COLOR.tint}
            action={{ icon: 'rotate-ccw', label: 'New game', onPress: () => reset() }}
            footer={
                <ChunkyButton
                    label={`Peek · ${peeksLeft} left`}
                    icon="eye"
                    size="lg"
                    color={gameColors.colorRecall.main}
                    disabled={peeksLeft <= 0 || done}
                    onPress={peek}
                />
            }>
            <Segmented
                label="Board size"
                value={level}
                onChange={next => { setLevel(next); reset(next); }}
                options={[
                    { value: 'easy', label: '4×4' },
                    { value: 'medium', label: '4×5' },
                    { value: 'hard', label: '6×6' },
                ]}
            />
            <View style={styles.row}>
                <StatChip label="PAIRS" value={`${matchedPairs} / ${pairs}`} highlight={COLOR.main} />
                <StatChip label="MOVES" value={moves} />
                <StatChip label="TIME" value={formatTime(seconds)} />
            </View>

            <View style={[styles.grid, { width, gap }]}>
                {deck.map(card => {
                    const faceUp = card.state !== 'hidden' || peeking;
                    const matched = card.state === 'matched';
                    return (
                        <Pressable
                            key={card.id}
                            onPress={() => onCardPress(card.id)}
                            accessibilityRole="button"
                            accessibilityLabel={faceUp ? `Card ${card.id + 1}, ${SYMBOLS[card.symbol]}${matched ? ', matched' : ''}` : `Card ${card.id + 1}, face down`}
                            style={[
                                styles.card,
                                { width: cardWidth, height: cardHeight },
                                faceUp ? { backgroundColor: matched ? '#F4ECF0' : colors.card } : { backgroundColor: COLOR.main },
                                matched ? { ...outlined, marginTop: 4, opacity: 0.55 } : chunky(4),
                            ]}>
                            <Text style={[
                                styles.face,
                                { fontSize: cardWidth * 0.42, color: faceUp ? SYMBOL_COLORS[card.symbol % SYMBOL_COLORS.length] : colors.white },
                            ]}>
                                {faceUp ? SYMBOLS[card.symbol] : '?'}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Text style={styles.hint}>
                Find all {pairs} pairs. Under {parMoves(pairs)} moves earns a bonus.
                {stats.best != null ? ` Best: ${stats.best} moves.` : ''}
            </Text>

            <ResultModal result={result} onPlayAgain={() => reset()} />
        </GameShell>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    grid: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' },
    card: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    face: { fontWeight: '800' },
    hint: { fontSize: 14, fontWeight: '700', color: colors.muted, textAlign: 'center' },
});
