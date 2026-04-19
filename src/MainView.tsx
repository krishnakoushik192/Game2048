import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useMainViewModel } from './MianViewModel';

const GRID_SIZE = 4;
const BOARD_PADDING = 10;
const TILE_MARGIN = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 380);
const TILE_SIZE =
    (BOARD_WIDTH - BOARD_PADDING * 2 - TILE_MARGIN * 2 * GRID_SIZE) / GRID_SIZE;

const T = {
    bg: '#080c18',
    boardBg: 'rgba(15,20,45,0.9)',
    emptyCell: 'rgba(255,255,255,0.04)',
    emptyCellBorder: 'rgba(255,255,255,0.07)',
    cyan: '#00e5ff',
    green: '#39ff14',
    pink: '#ff2d78',
    magenta: '#e040fb',
    gold: '#ffd740',
    lime: '#76ff03',
    amber: '#ffab00',
    white: '#ffffff',
    dim: 'rgba(255,255,255,0.5)',
    cardBg: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.10)',
    btnBg: 'rgba(255,255,255,0.07)',
    btnBorder: 'rgba(255,255,255,0.14)',
};

const TILE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
    0:    { bg: T.emptyCell, text: 'transparent', border: T.emptyCellBorder },
    2:    { bg: 'rgba(0,229,255,0.10)', text: '#00e5ff', border: 'rgba(0,229,255,0.45)' },
    4:    { bg: 'rgba(57,255,20,0.10)', text: '#39ff14', border: 'rgba(57,255,20,0.45)' },
    8:    { bg: 'rgba(255,171,0,0.10)', text: '#ffab00', border: 'rgba(255,171,0,0.45)' },
    16:   { bg: 'rgba(224,64,251,0.10)', text: '#e040fb', border: 'rgba(224,64,251,0.45)' },
    32:   { bg: 'rgba(24,255,255,0.10)', text: '#18ffff', border: 'rgba(24,255,255,0.45)' },
    64:   { bg: 'rgba(118,255,3,0.10)', text: '#76ff03', border: 'rgba(118,255,3,0.45)' },
    128:  { bg: 'rgba(255,215,64,0.12)', text: '#ffd740', border: 'rgba(255,215,64,0.50)' },
    256:  { bg: 'rgba(255,64,129,0.12)', text: '#ff4081', border: 'rgba(255,64,129,0.50)' },
    512:  { bg: 'rgba(105,240,174,0.10)', text: '#69f0ae', border: 'rgba(105,240,174,0.45)' },
    1024: { bg: 'rgba(176,190,197,0.08)', text: '#b0bec5', border: 'rgba(176,190,197,0.35)' },
    2048: { bg: 'rgba(255,23,68,0.15)', text: '#ff1744', border: 'rgba(255,23,68,0.55)' },
    4096: { bg: 'rgba(255,255,255,0.10)', text: '#ffffff', border: 'rgba(255,255,255,0.35)' },
    8192: { bg: 'rgba(255,255,255,0.10)', text: '#ffffff', border: 'rgba(255,255,255,0.35)' },
};

function getTileStyle(value: number) {
    return TILE_COLORS[value] ?? { bg: 'rgba(255,255,255,0.10)', text: '#ffffff', border: 'rgba(255,255,255,0.35)' };
}

function getTileFontSize(value: number) {
    if (value < 100) { return TILE_SIZE * 0.45; }
    if (value < 1000) { return TILE_SIZE * 0.36; }
    if (value < 10000) { return TILE_SIZE * 0.28; }
    if (value < 100000) { return TILE_SIZE * 0.22; }
    return TILE_SIZE * 0.18;
}

const PRO_TIPS = [
    'Keep your highest number in a corner and try not to move it. This makes it easier to chain combos together.',
    'Try to keep your tiles organized in a snake pattern for better control of the board.',
    'Focus on building one big tile rather than spreading values across the board.',
    'Think two moves ahead. Consider where new tiles might appear after your swipe.',
];

/* ─── Tile ─── */
function Tile({
    value,
    isMerged,
    isNew,
    mergeAnimationTick,
    spawnAnimationTick,
}: {
    value: number;
    isMerged: boolean;
    isNew: boolean;
    mergeAnimationTick: number;
    spawnAnimationTick: number;
}) {
    const colors = getTileStyle(value);
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isMerged || value === 0) { return; }
        scale.setValue(1);
        Animated.sequence([
            Animated.timing(scale, {
                toValue: 1.18,
                duration: 80,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 100,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    }, [isMerged, mergeAnimationTick, scale, value]);

    return (
        <Animated.View
            style={[
                styles.tile,
                {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    borderWidth: value > 0 ? 1.5 : 1,
                    transform: [{ scale: isMerged && value > 0 ? scale : 1 }],
                },
            ]}>
            {value > 0 && (
                <Text
                    style={[
                        styles.tileText,
                        { color: colors.text, fontSize: getTileFontSize(value) },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {value}
                </Text>
            )}
        </Animated.View>
    );
}

/* ─── High Score Banner ─── */
function HighScoreBanner({ visible }: { visible: boolean }) {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            setShow(true);
            scale.setValue(0.3);
            opacity.setValue(0);
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 4,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else if (show) {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(() => setShow(false));
        }
    }, [visible, opacity, scale, show]);

    if (!show) { return null; }

    return (
        <View style={styles.highScoreOverlay} pointerEvents="none">
            <Animated.View
                style={[
                    styles.highScoreBanner,
                    { transform: [{ scale }], opacity },
                ]}>
                <Text style={styles.highScoreIcon}>🏆</Text>
                <Text style={styles.highScoreTitle}>New High Score!</Text>
            </Animated.View>
        </View>
    );
}

/* ─── Score Box ─── */
function ScoreBox({
    label,
    score,
    scoreAdded,
    scoreBumpTick,
}: {
    label: string;
    score: number;
    scoreAdded?: number;
    scoreBumpTick?: number;
}) {
    const bumpScale = useRef(new Animated.Value(1)).current;
    const addedOpacity = useRef(new Animated.Value(0)).current;
    const addedTranslateY = useRef(new Animated.Value(0)).current;
    const [showAdded, setShowAdded] = useState(false);
    const labelColor = label === 'SCORE' ? T.pink : T.cyan;

    useEffect(() => {
        if (!scoreBumpTick || !scoreAdded || scoreAdded <= 0) { return; }
        bumpScale.setValue(1.25);
        Animated.timing(bumpScale, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();

        setShowAdded(true);
        addedOpacity.setValue(1);
        addedTranslateY.setValue(0);
        Animated.parallel([
            Animated.timing(addedOpacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(addedTranslateY, {
                toValue: -28,
                duration: 800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start(() => setShowAdded(false));
    }, [scoreBumpTick, scoreAdded, bumpScale, addedOpacity, addedTranslateY]);

    return (
        <View style={styles.scoreBox}>
            <Text style={[styles.scoreLabel, { color: labelColor }]}>{label}</Text>
            <Animated.Text
                style={[
                    styles.scoreValue,
                    { transform: [{ scale: bumpScale }] },
                ]}>
                {score}
            </Animated.Text>
            {showAdded && scoreAdded != null && scoreAdded > 0 && (
                <Animated.Text
                    style={[
                        styles.scoreAdded,
                        {
                            opacity: addedOpacity,
                            transform: [{ translateY: addedTranslateY }],
                        },
                    ]}>
                    +{scoreAdded}
                </Animated.Text>
            )}
        </View>
    );
}

/* ─── Grid Icon (top-left header) ─── */
function GridIcon() {
    const sq = {
        width: 9,
        height: 9,
        borderRadius: 2,
        backgroundColor: T.white,
    };
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 22, gap: 3 }}>
            <View style={sq} />
            <View style={sq} />
            <View style={sq} />
            <View style={sq} />
        </View>
    );
}

/* ─── Mini Tile (tutorial / onboarding) ─── */
function MiniTile({ value, size = 44 }: { value: number; size?: number }) {
    const colors = getTileStyle(value);
    const fontSize = value >= 1000 ? size * 0.26 : value >= 100 ? size * 0.32 : size * 0.4;
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: 8,
                backgroundColor: colors.bg,
                borderWidth: value > 0 ? 1.5 : 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                margin: 2,
            }}>
            {value > 0 && (
                <Text style={{ color: colors.text, fontSize, fontWeight: '800' }}>
                    {value}
                </Text>
            )}
        </View>
    );
}

/* ─── Merge Example (tutorial) ─── */
function MergeExample({
    from1,
    from2,
    result,
    scoreGain,
}: {
    from1: number;
    from2: number;
    result: number;
    scoreGain: number;
}) {
    return (
        <View style={{ alignItems: 'center', marginVertical: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MiniTile value={from1} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: T.dim, marginHorizontal: 4 }}>+</Text>
                <MiniTile value={from2} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: T.dim, marginHorizontal: 4 }}>=</Text>
                <MiniTile value={result} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: T.gold, marginTop: 4 }}>
                +{scoreGain} points!
            </Text>
        </View>
    );
}

/* ─── Pro Tip Card ─── */
function ProTipCard() {
    const [tipIndex, setTipIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setTipIndex(prev => (prev + 1) % PRO_TIPS.length);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            });
        }, 8000);
        return () => clearInterval(interval);
    }, [fadeAnim]);

    return (
        <View style={styles.proTipCard}>
            <View style={styles.proTipHeader}>
                <Text style={styles.proTipTitle}>Pro Tip</Text>
                <View style={styles.proTipIndicator} />
            </View>
            <Animated.Text style={[styles.proTipText, { opacity: fadeAnim }]}>
                {PRO_TIPS[tipIndex]}
            </Animated.Text>
        </View>
    );
}

/* ─── Tutorial / Onboarding Overlay ─── */
function TutorialOverlay({
    visible,
    onDismiss,
}: {
    visible: boolean;
    onDismiss: () => void;
}) {
    const [step, setStep] = useState(0);
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        if (visible) {
            setStep(0);
            backdropOpacity.setValue(0);
            contentOpacity.setValue(0);
            contentSlide.setValue(30);
            Animated.sequence([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.parallel([
                    Animated.timing(contentOpacity, {
                        toValue: 1,
                        duration: 350,
                        useNativeDriver: true,
                    }),
                    Animated.timing(contentSlide, {
                        toValue: 0,
                        duration: 350,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        }
    }, [visible, backdropOpacity, contentOpacity, contentSlide]);

    const animateToNextStep = (next: number) => {
        Animated.parallel([
            Animated.timing(contentOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(contentSlide, { toValue: -20, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            setStep(next);
            contentSlide.setValue(30);
            Animated.parallel([
                Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(contentSlide, { toValue: 0, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]).start();
        });
    };

    const slides = [
        {
            title: 'Swipe in any direction to move all tiles.',
            body: 'Tiles with the same number merge into one when they touch.',
            visual: (
                <View style={tutStyles.boardPreview}>
                    <View style={tutStyles.boardGrid}>
                        {[
                            [0, 2, 0, 0],
                            [4, 0, 2, 0],
                            [0, 0, 0, 0],
                            [0, 4, 0, 0],
                        ].map((row, ri) => (
                            <View key={ri} style={tutStyles.boardRow}>
                                {row.map((v, ci) => (
                                    <MiniTile key={ci} value={v} size={52} />
                                ))}
                            </View>
                        ))}
                    </View>
                    <View style={tutStyles.handOverlay}>
                        <Text style={{ fontSize: 40 }}>👋</Text>
                        <View style={tutStyles.swipeLine} />
                    </View>
                </View>
            ),
        },
        {
            title: 'Same numbers merge together!',
            body: 'Every merge adds the new tile\'s value to your score. Bigger merges = more points!',
            visual: (
                <View style={{ marginTop: 8 }}>
                    <MergeExample from1={2} from2={2} result={4} scoreGain={4} />
                    <MergeExample from1={4} from2={4} result={8} scoreGain={8} />
                    <MergeExample from1={128} from2={128} result={256} scoreGain={256} />
                </View>
            ),
        },
        {
            title: 'Reach 2048 to win!',
            body: 'Build up to the 2048 tile. You can keep playing afterwards for an even higher score.',
            visual: (
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 12 }}>
                    <MiniTile value={128} size={50} />
                    <MiniTile value={256} size={50} />
                    <MiniTile value={512} size={50} />
                    <MiniTile value={1024} size={50} />
                    <MiniTile value={2048} size={50} />
                </View>
            ),
        },
    ];

    if (!visible) { return null; }

    const isLast = step === slides.length - 1;
    const slide = slides[step];

    return (
        <Modal visible transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[tutStyles.backdrop, { opacity: backdropOpacity }]}>
                {/* Header */}
                <View style={tutStyles.header}>
                    <Text style={tutStyles.logo}>2048</Text>
                    <Pressable onPress={onDismiss} hitSlop={16}>
                        <Text style={tutStyles.skip}>SKIP</Text>
                    </Pressable>
                </View>

                {/* Step indicator */}
                <View style={tutStyles.stepBar}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                tutStyles.stepDot,
                                i === step && tutStyles.stepDotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Content */}
                <Animated.View
                    style={[
                        tutStyles.content,
                        { opacity: contentOpacity, transform: [{ translateY: contentSlide }] },
                    ]}>
                    {slide.visual}

                    <Text style={tutStyles.title}>{slide.title}</Text>
                    <Text style={tutStyles.body}>{slide.body}</Text>
                </Animated.View>

                {/* Next / Let's Go button */}
                <Pressable
                    onPress={() => {
                        if (isLast) { onDismiss(); }
                        else { animateToNextStep(step + 1); }
                    }}
                    style={({ pressed }) => [
                        tutStyles.nextBtn,
                        pressed && { opacity: 0.85 },
                    ]}>
                    <Text style={tutStyles.nextText}>
                        {isLast ? "LET'S GO!" : 'NEXT'}
                    </Text>
                </Pressable>
            </Animated.View>
        </Modal>
    );
}

/* ─── Main View ─── */
const MainView = () => {
    const {
        board,
        score,
        bestScore,
        scoreAdded,
        scoreBumpTick,
        showHighScoreAnimation,
        showGameOverModal,
        showWinModal,
        mergedCells,
        newTileCells,
        mergeAnimationTick,
        spawnAnimationTick,
        gesture,
        canUndo,
        showTutorial,
        retryGame,
        undoMove,
        keepPlaying,
        dismissTutorial,
        openTutorial,
    } = useMainViewModel();

    const mergedCellSet = useMemo(() => new Set(mergedCells), [mergedCells]);
    const newTileCellSet = useMemo(() => new Set(newTileCells), [newTileCells]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View style={styles.headerIconBtn}>
                        <GridIcon />
                    </View>
                    <Text style={styles.title}>2048</Text>
                    <Pressable onPress={openTutorial} hitSlop={12} style={styles.profileIcon}>
                        <Text style={{ color: T.cyan, fontSize: 18, fontWeight: '800' }}>?</Text>
                    </Pressable>
                </View>

                <View style={styles.scoresRow}>
                    <ScoreBox
                        label="SCORE"
                        score={score}
                        scoreAdded={scoreAdded}
                        scoreBumpTick={scoreBumpTick}
                    />
                    <ScoreBox label="BEST" score={bestScore} />
                </View>
            </View>

            {/* Game Board */}
            <GestureDetector gesture={gesture}>
                <View style={styles.board}>
                    {board.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            {row.map((cell, colIndex) => {
                                const key = `${rowIndex}-${colIndex}`;
                                return (
                                    <Tile
                                        key={key}
                                        value={cell}
                                        isMerged={mergedCellSet.has(key)}
                                        isNew={newTileCellSet.has(key)}
                                        mergeAnimationTick={mergeAnimationTick}
                                        spawnAnimationTick={spawnAnimationTick}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>
            </GestureDetector>

            {/* Action Buttons */}
            <View style={styles.buttonsRow}>
                <Pressable
                    onPress={undoMove}
                    disabled={!canUndo}
                    style={({ pressed }) => [
                        styles.undoButton,
                        pressed && styles.buttonPressed,
                        !canUndo && styles.buttonDisabled,
                    ]}
                    accessibilityLabel="Undo"
                    accessibilityRole="button">
                    <Text style={[styles.undoIcon, !canUndo && styles.iconDisabled]}>↩</Text>
                </Pressable>

                <Pressable
                    onPress={retryGame}
                    style={({ pressed }) => [
                        styles.newGameButton,
                        pressed && styles.buttonPressed,
                    ]}
                    accessibilityLabel="New Game"
                    accessibilityRole="button">
                    <Text style={styles.newGameIcon}>↻</Text>
                    <Text style={styles.newGameText}>New Game</Text>
                </Pressable>
            </View>

            {/* Pro Tip */}
            <ProTipCard />

            {/* High Score Banner */}
            <HighScoreBanner visible={showHighScoreAnimation} />

            {/* Win Modal */}
            <Modal
                visible={showWinModal}
                animationType="fade"
                transparent
                statusBarTranslucent
                onRequestClose={keepPlaying}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalEmoji}>🎉</Text>
                        <Text style={styles.modalTitle}>You Win!</Text>
                        <Text style={styles.modalSubtitle}>
                            You reached the 2048 tile!
                        </Text>
                        <Text style={styles.modalScore}>Score: {score}</Text>
                        <View style={styles.modalButtonRow}>
                            <Pressable
                                style={styles.modalBtnSecondary}
                                onPress={keepPlaying}>
                                <Text style={styles.modalBtnSecondaryText}>Keep Playing</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalBtnPrimary}
                                onPress={retryGame}>
                                <Text style={styles.modalBtnPrimaryText}>New Game</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Game Over Modal */}
            <Modal
                visible={showGameOverModal}
                animationType="fade"
                transparent
                statusBarTranslucent
                onRequestClose={() => { }}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalEmoji}>😔</Text>
                        <Text style={styles.modalTitle}>Game Over</Text>
                        <Text style={styles.modalScore}>Score: {score}</Text>
                        {score === bestScore && score > 0 && (
                            <Text style={styles.modalBestLabel}>
                                That's your best score!
                            </Text>
                        )}
                        <Pressable
                            style={styles.modalBtnPrimary}
                            onPress={retryGame}>
                            <Text style={styles.modalBtnPrimaryText}>Try Again</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Tutorial Overlay */}
            <TutorialOverlay
                visible={showTutorial}
                onDismiss={dismissTutorial}
            />
        </View>
    );
};

/* ═══ Tutorial Styles ═══ */
const tutStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(8,12,24,0.96)',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        fontSize: 36,
        fontWeight: '900',
        color: T.green,
    },
    skip: {
        fontSize: 15,
        fontWeight: '600',
        color: T.white,
        letterSpacing: 1,
    },
    stepBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 20,
    },
    stepDot: {
        width: 28,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    stepDotActive: {
        backgroundColor: T.pink,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boardPreview: {
        position: 'relative',
        marginBottom: 24,
    },
    boardGrid: {
        backgroundColor: T.boardBg,
        borderRadius: 12,
        padding: 6,
    },
    boardRow: {
        flexDirection: 'row',
    },
    handOverlay: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    swipeLine: {
        width: 80,
        height: 3,
        borderRadius: 2,
        backgroundColor: T.pink,
        marginLeft: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: T.white,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 32,
    },
    body: {
        fontSize: 14,
        color: T.dim,
        textAlign: 'center',
        lineHeight: 21,
        paddingHorizontal: 12,
    },
    nextBtn: {
        backgroundColor: T.pink,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    nextText: {
        fontSize: 16,
        fontWeight: '800',
        color: T.white,
        letterSpacing: 1.5,
    },
});

/* ═══ Main Styles ═══ */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: T.bg,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        justifyContent: 'space-between',
        paddingBottom: 12,
    },

    /* Header */
    header: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 8,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: T.cardBg,
        borderWidth: 1,
        borderColor: T.cardBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: T.cyan,
        letterSpacing: 2,
    },
    profileIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: T.cyan,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,229,255,0.08)',
    },

    /* Scores */
    scoresRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    scoreBox: {
        flex: 1,
        alignItems: 'flex-start',
        position: 'relative',
        paddingVertical: 4,
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: '800',
        color: T.white,
        marginTop: 0,
    },
    scoreAdded: {
        position: 'absolute',
        right: 4,
        top: 8,
        fontSize: 14,
        fontWeight: '700',
        color: T.pink,
    },

    /* Board */
    board: {
        width: BOARD_WIDTH,
        backgroundColor: T.boardBg,
        borderRadius: 14,
        padding: BOARD_PADDING,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        margin: TILE_MARGIN,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileText: {
        fontWeight: '800',
    },

    /* Buttons */
    buttonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 16,
    },
    undoButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: T.btnBg,
        borderWidth: 1,
        borderColor: T.btnBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    undoIcon: {
        fontSize: 22,
        fontWeight: '700',
        color: T.white,
    },
    newGameButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: T.btnBg,
        borderWidth: 1,
        borderColor: T.btnBorder,
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    newGameIcon: {
        fontSize: 18,
        fontWeight: '700',
        color: T.cyan,
    },
    newGameText: {
        fontSize: 15,
        fontWeight: '700',
        color: T.white,
    },
    buttonPressed: {
        opacity: 0.7,
    },
    buttonDisabled: {
        opacity: 0.35,
    },
    iconDisabled: {
        color: 'rgba(255,255,255,0.3)',
    },

    /* Pro Tip Card */
    proTipCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: T.cardBg,
        borderWidth: 1,
        borderColor: T.cardBorder,
        borderRadius: 14,
        padding: 16,
        marginTop: 14,
    },
    proTipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    proTipTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: T.pink,
        fontStyle: 'italic',
    },
    proTipIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    proTipText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 19,
    },

    /* High Score Banner */
    highScoreOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    highScoreBanner: {
        backgroundColor: 'rgba(255,215,64,0.18)',
        borderWidth: 2,
        borderColor: 'rgba(255,215,64,0.5)',
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 40,
        alignItems: 'center',
        elevation: 12,
        shadowColor: T.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    highScoreIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    highScoreTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: T.gold,
    },

    /* Modals */
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(8,12,24,0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: 'rgba(20,25,50,0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 28,
        alignItems: 'center',
        elevation: 12,
        shadowColor: T.cyan,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    modalEmoji: {
        fontSize: 52,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: T.white,
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 15,
        color: T.dim,
        marginBottom: 4,
    },
    modalScore: {
        fontSize: 20,
        fontWeight: '700',
        color: T.cyan,
        marginBottom: 4,
    },
    modalBestLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: T.gold,
        marginBottom: 8,
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    modalBtnSecondary: {
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: T.btnBorder,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    modalBtnSecondaryText: {
        color: T.white,
        fontSize: 15,
        fontWeight: '700',
    },
    modalBtnPrimary: {
        backgroundColor: T.pink,
        borderRadius: 12,
        minWidth: 120,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 12,
    },
    modalBtnPrimaryText: {
        color: T.white,
        fontSize: 15,
        fontWeight: '700',
    },
});

export default MainView;
