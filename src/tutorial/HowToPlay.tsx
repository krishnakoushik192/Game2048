import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { chunky, colors, fonts, outlined, radius } from '../theme';
import type { GameId } from '../theme';
import { ChunkyButton } from '../shared/ui';
import { Direction, useSwipe, useTapSound } from '../shared/input';
import { PictureCell, PracticeAction, TUTORIALS, Tutorial, TutorialStep, parseGrid } from './content';

const GAP = 8;
const SWIPE_DISTANCE = 100;
const HAND = 44;

type Layout = { cell: number; offX: number; offY: number };

/** Works out cell size and centring for a grid inside a square area. Exported for tests. */
export function layoutGrid(rows: number, cols: number, area: number, maxCell = 150): Layout {
    const cell = Math.min((area - GAP * (cols - 1)) / cols, (area - GAP * (rows - 1)) / rows, maxCell);
    const width = cols * cell + GAP * (cols - 1);
    const height = rows * cell + GAP * (rows - 1);
    return { cell, offX: (area - width) / 2, offY: (area - height) / 2 };
}

const swipeDelta: Record<Direction, [number, number]> = {
    right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1],
};

/** The animated "finger" that shows the move. */
function Hand({ x, y, gesture, ring }: { x: number; y: number; gesture: NonNullable<TutorialStep['gesture']>; ring: string }) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        progress.setValue(0);
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.delay(350),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [gesture, progress, x, y]);

    if (gesture === 'tap') {
        return (
            <>
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.ripple,
                        {
                            borderColor: ring,
                            left: x - 38,
                            top: y - 38,
                            opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.8, 0] }),
                            transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.3] }) }],
                        },
                    ]}
                />
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.hand,
                        {
                            left: x - HAND / 2,
                            top: y - HAND / 2,
                            transform: [{ scale: progress.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [1, 0.78, 1, 1] }) }],
                        },
                    ]}>
                    <View style={styles.handDot} />
                </Animated.View>
            </>
        );
    }

    const [dx, dy] = swipeDelta[gesture.slice(6) as Direction];
    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.hand,
                {
                    left: x - HAND / 2,
                    top: y - HAND / 2,
                    opacity: progress.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                    transform: [
                        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-dx * SWIPE_DISTANCE, 0] }) },
                        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-dy * SWIPE_DISTANCE, 0] }) },
                    ],
                },
            ]}>
            <View style={styles.handDot} />
        </Animated.View>
    );
}

function Cell({ cell, size, onPress }: { cell: PictureCell; size: number; onPress?: () => void }) {
    const content = (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    backgroundColor: cell.bg,
                    borderRadius: cell.round ? size / 2 : cell.radius ?? 14,
                    opacity: cell.faded ? 0.5 : 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                cell.border === 'none' ? null
                    : cell.border === 'dashed' ? styles.dashed
                        : cell.lift ? chunky(3) : outlined,
                cell.glow && styles.glow,
            ]}>
            {cell.text != null && (
                <Text style={[styles.cellText, { color: cell.fg ?? colors.ink, fontSize: size * (cell.scale ?? (cell.text.length >= 4 ? 0.26 : cell.text.length === 3 ? 0.32 : 0.44)) }]}>
                    {cell.text}
                </Text>
            )}
        </View>
    );
    return onPress ? <Pressable onPress={onPress} accessibilityRole="button">{content}</Pressable> : content;
}

function Picture({
    tutorial,
    step,
    grid,
    size,
    showHand,
    onAction,
    shake,
}: {
    tutorial: Tutorial;
    step: TutorialStep;
    grid: string[];
    size: number;
    showHand: boolean;
    onAction?: (action: PracticeAction) => void;
    shake: Animated.Value;
}) {
    const area = size - 36;
    const rows = useMemo(() => parseGrid(grid), [grid]);
    const { cell, offX, offY } = layoutGrid(rows.length, rows[0].length, area);
    const [tr, tc] = step.target ?? [0, 0];
    const cx = offX + tc * (cell + GAP) + cell / 2;
    const cy = offY + tr * (cell + GAP) + cell / 2;
    const swipe = useSwipe(useCallback((dir: Direction) => onAction?.({ type: 'swipe', dir }), [onAction]));

    const board = (
        <Animated.View
            style={[styles.picture, { width: size, backgroundColor: tutorial.boardBg, transform: [{ translateX: shake }] }]}
            accessibilityLabel={step.title}>
            <View style={{ width: area, height: area }}>
                <View style={[styles.grid, { left: offX, top: offY }]}>
                    {rows.map((row, r) => (
                        <View key={r} style={styles.row}>
                            {row.map((token, c) => (
                                <Cell
                                    key={c}
                                    cell={tutorial.palette(token)}
                                    size={cell}
                                    onPress={onAction ? () => onAction({ type: 'tap', row: r, col: c }) : undefined}
                                />
                            ))}
                        </View>
                    ))}
                </View>
                {showHand && step.gesture && <Hand x={cx} y={cy} gesture={step.gesture} ring={tutorial.ring} />}
            </View>
        </Animated.View>
    );

    return onAction ? <GestureDetector gesture={swipe}>{board}</GestureDetector> : board;
}

/**
 * Three-step "How to play" for any game. Same layout everywhere so kids
 * learn it once: picture with a moving hand, a short title, one sentence.
 * Step 2 is live and waits for the right move; a wrong move only wiggles.
 */
export function HowToPlay({ game, visible, onClose }: { game: GameId; visible: boolean; onClose: () => void }) {
    const tutorial = TUTORIALS[game];
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const tap = useTapSound();
    const [index, setIndex] = useState(0);
    const [practiced, setPracticed] = useState(false);
    const shake = useRef(new Animated.Value(0)).current;
    const step = tutorial.steps[index];
    const isLast = index === tutorial.steps.length - 1;
    const waiting = !!step.practice && !practiced;

    useEffect(() => {
        if (visible) {
            setIndex(0);
            setPracticed(false);
        }
    }, [visible]);

    const wiggle = useCallback(() => {
        shake.setValue(0);
        Animated.sequence([10, -10, 6, -6, 0].map(toValue =>
            Animated.timing(shake, { toValue, duration: 60, useNativeDriver: true }),
        )).start();
    }, [shake]);

    const onAction = useCallback((action: PracticeAction) => {
        if (!step.practice || practiced) { return; }
        if (step.practice.accepts(action)) {
            tap();
            setPracticed(true);
        } else {
            wiggle();
        }
    }, [practiced, step.practice, tap, wiggle]);

    const goTo = (next: number) => {
        setIndex(next);
        setPracticed(false);
    };

    const next = () => {
        if (waiting) { return; }
        if (isLast) { onClose(); } else { goTo(index + 1); }
    };

    const size = Math.min(width - 40, 350);
    const grid = practiced && step.practice?.after ? step.practice.after : step.grid;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
            <GestureHandlerRootView style={styles.flex}>
                <View style={[styles.root, { backgroundColor: tutorial.tint, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
                    <StatusBar barStyle="dark-content" />
                    <View style={styles.header}>
                        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={({ pressed }) => [styles.close, pressed ? { ...outlined, marginTop: 3 } : chunky(3)]}>
                            <Lucide name="x" size={20} color={colors.ink} />
                        </Pressable>
                        <View style={styles.dots} accessible accessibilityLabel={`Step ${index + 1} of ${tutorial.steps.length}`}>
                            {tutorial.steps.map((_, i) => (
                                <View key={i} style={[styles.dot, { width: i === index ? 30 : 12, backgroundColor: i <= index ? colors.ink : colors.card }]} />
                            ))}
                        </View>
                        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={10} style={styles.skip}>
                            <Text style={styles.skipText}>Skip</Text>
                        </Pressable>
                    </View>

                    <View style={styles.body}>
                        <Text style={styles.game}>How to play {tutorial.name}</Text>
                        <Picture
                            tutorial={tutorial}
                            step={step}
                            grid={grid}
                            size={size}
                            showHand={!practiced}
                            onAction={step.practice && !practiced ? onAction : undefined}
                            shake={shake}
                        />
                        <View style={styles.copy}>
                            <Text style={styles.stepLabel}>STEP {index + 1} OF {tutorial.steps.length}</Text>
                            <Text style={styles.title} accessibilityRole="header">{step.title}</Text>
                            <Text style={styles.text}>{step.body}</Text>
                        </View>
                        {step.practice && (
                            <View style={[styles.pill, { backgroundColor: practiced ? colors.success : colors.coin }]} accessibilityLiveRegion="polite">
                                <Text style={styles.pillText}>{practiced ? step.practice.success : 'Your turn: try it on the board!'}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        {index > 0 && (
                            <ChunkyButton icon="chevron-left" accessibilityLabel="Previous step" onPress={() => goTo(index - 1)} size="lg" />
                        )}
                        <ChunkyButton
                            label={waiting ? 'Try it first' : isLast ? 'Let’s play!' : 'Next'}
                            size="lg"
                            color={colors.ink}
                            textColor={colors.white}
                            disabled={waiting}
                            onPress={next}
                            style={styles.flex}
                        />
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    root: { flex: 1, paddingHorizontal: 20, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48 },
    close: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    dots: { flexDirection: 'row', gap: 6 },
    dot: { height: 12, borderRadius: 6, ...outlined },
    skip: { paddingHorizontal: 6, height: 44, justifyContent: 'center' },
    skipText: { fontSize: 16, fontFamily: fonts.heavy, color: colors.ink },
    body: { flex: 1, gap: 14, alignItems: 'center' },
    game: { fontSize: 14, fontFamily: fonts.heavy, color: '#4A4260', alignSelf: 'flex-start' },
    picture: { borderRadius: 28, ...chunky(5), padding: 16 },
    grid: { position: 'absolute', gap: GAP },
    row: { flexDirection: 'row', gap: GAP },
    dashed: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(43,33,64,0.35)' },
    // Thick ink ring: reads as "lit" or "winning" on light and dark boards alike.
    glow: { borderWidth: 5, borderColor: colors.ink },
    cellText: { fontFamily: fonts.display },
    hand: {
        position: 'absolute',
        width: HAND,
        height: HAND,
        borderRadius: HAND / 2,
        backgroundColor: colors.card,
        borderWidth: 3,
        borderBottomWidth: 6,
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.ink },
    ripple: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 3 },
    copy: { alignSelf: 'stretch', gap: 4 },
    stepLabel: { fontSize: 14, fontFamily: fonts.heavy, color: '#4A4260' },
    title: { fontSize: 28, fontFamily: fonts.display, color: colors.ink, lineHeight: 32 },
    text: { fontSize: 17, fontFamily: fonts.bold, color: '#4A4260', lineHeight: 24 },
    pill: { alignSelf: 'flex-start', borderRadius: radius.pill, ...outlined, paddingHorizontal: 14, paddingVertical: 8 },
    pillText: { fontSize: 15, fontFamily: fonts.heavy, color: colors.ink },
    footer: { flexDirection: 'row', gap: 10 },
});
