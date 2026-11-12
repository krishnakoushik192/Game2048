import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { chunky, colors, gameColors, outlined, fonts } from '../../theme';
import { GameShell, useBoardSize } from '../../shared/GameShell';
import { Banner, ChunkyButton, StatChip } from '../../shared/ui';
import { ResultModal } from '../../shared/ResultModal';
import type { ResultInfo } from '../../shared/ResultModal';
import { usePlaybox } from '../../shared/playbox';
import { useGameStats } from '../../shared/stats';
import { useTapSound } from '../../shared/input';
import { checkInput, extendSequence, stepTiming } from './logic';

type Phase = 'ready' | 'showing' | 'input' | 'over';

const COLOR = gameColors.colorRecall;
const COINS_PER_ROUND = 2;
const REPLAY_COST = 30;
// Lit and dim colours differ in lightness, and each pad has a fixed corner,
// so the game works without telling hues apart.
const PADS = [
    { name: 'Teal', on: '#22B8B0', dim: '#8ED9D4', corner: 'borderTopLeftRadius' },
    { name: 'Yellow', on: '#FFC93C', dim: '#FFE39A', corner: 'borderTopRightRadius' },
    { name: 'Pink', on: '#FF6FA8', dim: '#FFB3D0', corner: 'borderBottomLeftRadius' },
    { name: 'Blue', on: '#3D8BFF', dim: '#9EC3FF', corner: 'borderBottomRightRadius' },
] as const;

export default function ColorRecallScreen() {
    const size = useBoardSize(360);
    const { addCoins, spendCoins, coins } = usePlaybox();
    const { stats, recordResult } = useGameStats('colorRecall');
    const tap = useTapSound();
    const [sequence, setSequence] = useState<number[]>([]);
    const [phase, setPhase] = useState<Phase>('ready');
    const [lit, setLit] = useState<number | null>(null);
    const [position, setPosition] = useState(0);
    const [result, setResult] = useState<ResultInfo | null>(null);
    const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

    const clearTimers = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };
    useEffect(() => clearTimers, []);

    const show = useCallback((seq: number[]) => {
        clearTimers();
        setPhase('showing');
        setPosition(0);
        const { on, off } = stepTiming(seq.length);
        let t = 500;
        seq.forEach(pad => {
            timers.current.push(setTimeout(() => { setLit(pad); tap(); }, t));
            t += on;
            timers.current.push(setTimeout(() => setLit(null), t));
            t += off;
        });
        timers.current.push(setTimeout(() => setPhase('input'), t));
    }, [tap]);

    const start = () => {
        const first = extendSequence([]);
        setResult(null);
        setSequence(first);
        show(first);
    };

    const flash = (pad: number) => {
        setLit(pad);
        timers.current.push(setTimeout(() => setLit(null), 180));
    };

    const onPadPress = (pad: number) => {
        if (phase !== 'input') { return; }
        tap();
        flash(pad);
        const outcome = checkInput(sequence, position, pad);
        if (outcome === 'correct') {
            setPosition(position + 1);
            return;
        }
        if (outcome === 'roundComplete') {
            const next = extendSequence(sequence);
            setSequence(next);
            setPhase('showing');
            timers.current.push(setTimeout(() => show(next), 600));
            return;
        }
        const rounds = sequence.length - 1;
        const earned = rounds * COINS_PER_ROUND;
        const { isNewBest } = recordResult({ score: rounds });
        if (earned) { addCoins(earned); }
        setPhase('over');
        setResult({
            title: rounds > 0 ? 'Nice memory!' : 'Oops!',
            subtitle: 'Color Recall · wrong pad',
            scoreLabel: 'ROUNDS COMPLETED',
            score: String(rounds),
            isNewBest,
            won: rounds >= 5,
            coins: earned,
            stats: [
                { label: 'Best', value: String(Math.max(stats.best ?? 0, rounds)) },
                { label: 'Pattern', value: `${sequence.length} long` },
            ],
        });
    };

    const replay = async () => {
        if (phase !== 'input' || !(await spendCoins(REPLAY_COST))) { return; }
        show(sequence);
    };

    const round = Math.max(sequence.length, 1);
    const padSize = (size - 12) / 2;
    const label = {
        ready: 'Press start, then watch closely',
        showing: 'Watch…',
        input: 'Your turn!',
        over: 'Game over',
    }[phase];

    return (
        <GameShell
            title="Color Recall"
            background={COLOR.tint}
            footer={
                phase === 'ready' || phase === 'over' ? (
                    <ChunkyButton label="Start" size="lg" color={colors.ink} textColor={colors.white} onPress={start} />
                ) : (
                    <ChunkyButton
                        label={`Replay pattern · ${REPLAY_COST} coins`}
                        icon="repeat"
                        disabled={phase !== 'input' || coins < REPLAY_COST}
                        onPress={replay}
                    />
                )
            }>
            <View style={styles.row}>
                <StatChip label="ROUND" value={phase === 'ready' ? '–' : round} highlight={COLOR.main} />
                <StatChip label="BEST" value={stats.best ?? 0} />
            </View>

            <View style={styles.center}>
                <Text style={styles.phase} accessibilityLiveRegion="polite">{label}</Text>
                {phase === 'input' && (
                    <View style={styles.dots} accessibilityLabel={`${position} of ${sequence.length} taps done`}>
                        {sequence.map((_, i) => (
                            <View key={i} style={[styles.dot, i < position && { backgroundColor: COLOR.main }]} />
                        ))}
                    </View>
                )}
            </View>

            <View style={[styles.pads, { width: size, height: size }]}>
                {PADS.map((pad, index) => {
                    const on = lit === index;
                    return (
                        <Pressable
                            key={pad.name}
                            onPress={() => onPadPress(index)}
                            accessibilityRole="button"
                            accessibilityLabel={`${pad.name} pad`}
                            style={[
                                styles.pad,
                                { width: padSize, height: padSize, backgroundColor: on ? pad.on : pad.dim, [pad.corner]: padSize / 2 },
                                chunky(5),
                                // Scale (not margin) so the other pads never shift.
                                on && { transform: [{ scale: 0.94 }] },
                            ]}
                        />
                    );
                })}
                <View pointerEvents="none" style={[styles.hub, { left: size / 2 - 50, top: size / 2 - 50 }]}>
                    <Text style={styles.hubValue}>{phase === 'input' ? `${position}/${sequence.length}` : round}</Text>
                    <Text style={styles.hubLabel}>{phase === 'input' ? 'TAPS' : 'ROUND'}</Text>
                </View>
            </View>

            <Banner>
                <Text style={styles.help}>Watch the pads light up, then tap them back in the same order. Each round adds one more.</Text>
            </Banner>

            <ResultModal result={result} onPlayAgain={start} />
        </GameShell>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    center: { alignItems: 'center', gap: 8, minHeight: 56 },
    phase: { fontSize: 22, fontFamily: fonts.display, color: colors.ink },
    dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
    dot: { width: 14, height: 14, borderRadius: 7, ...outlined, backgroundColor: colors.card },
    pads: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    pad: { borderRadius: 24 },
    hub: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.cream,
        ...outlined,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hubValue: { fontSize: 30, fontFamily: fonts.display, color: colors.ink },
    hubLabel: { fontSize: 11, fontFamily: fonts.heavy, color: colors.muted },
    help: { flex: 1, fontSize: 14, fontFamily: fonts.bold, color: colors.ink },
});
