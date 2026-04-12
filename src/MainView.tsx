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
const BOARD_PADDING = 8;
const TILE_MARGIN = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);
const TILE_SIZE =
    (BOARD_WIDTH - BOARD_PADDING * 2 - TILE_MARGIN * 2 * GRID_SIZE) / GRID_SIZE;

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
    0: { bg: '#cdc1b4', text: 'transparent' },
    2: { bg: '#eee4da', text: '#776e65' },
    4: { bg: '#ede0c8', text: '#776e65' },
    8: { bg: '#f2b179', text: '#f9f6f2' },
    16: { bg: '#f59563', text: '#f9f6f2' },
    32: { bg: '#f67c5f', text: '#f9f6f2' },
    64: { bg: '#f65e3b', text: '#f9f6f2' },
    128: { bg: '#edcf72', text: '#f9f6f2' },
    256: { bg: '#edcc61', text: '#f9f6f2' },
    512: { bg: '#edc850', text: '#f9f6f2' },
    1024: { bg: '#edc53f', text: '#f9f6f2' },
    2048: { bg: '#edc22e', text: '#f9f6f2' },
    4096: { bg: '#3c3a32', text: '#f9f6f2' },
    8192: { bg: '#3c3a32', text: '#f9f6f2' },
};

function getTileStyle(value: number) {
    return TILE_COLORS[value] ?? { bg: '#3c3a32', text: '#f9f6f2' };
}

function getTileFontSize(value: number) {
    if (value < 100) { return TILE_SIZE * 0.45; }
    if (value < 1000) { return TILE_SIZE * 0.36; }
    if (value < 10000) { return TILE_SIZE * 0.28; }
    if (value < 100000) { return TILE_SIZE * 0.22; }
    return TILE_SIZE * 0.18;
}

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
            <Text style={styles.scoreLabel}>{label}</Text>
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

function IconButton({
    onPress,
    label,
    icon,
    disabled,
}: {
    onPress: () => void;
    label: string;
    icon: string;
    disabled?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
                disabled && styles.iconButtonDisabled,
            ]}
            accessibilityLabel={label}
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(119,110,101,0.3)', borderless: false }}>
            <Text style={[styles.iconButtonText, disabled && styles.iconButtonTextDisabled]}>
                {icon}
            </Text>
        </Pressable>
    );
}

function TutorialOverlay({
    visible,
    onDismiss,
}: {
    visible: boolean;
    onDismiss: () => void;
}) {
    const [step, setStep] = useState(0);
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            opacity.setValue(0);
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, opacity]);

    const slides = [
        {
            title: 'Welcome to 2048!',
            icon: '👆',
            text: 'Swipe in any direction to move all tiles on the board.',
        },
        {
            title: 'Merge Tiles',
            icon: '🔢',
            text: 'When two tiles with the same number touch, they merge into one with double the value!',
        },
        {
            title: 'Reach 2048!',
            icon: '🎯',
            text: 'Your score and best score are shown at the top. Aim for the 2048 tile to win!',
        },
    ];

    if (!visible) { return null; }

    const isLast = step === slides.length - 1;
    const slide = slides[step];

    return (
        <Modal visible transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[styles.tutorialBackdrop, { opacity }]}>
                <View style={styles.tutorialCard}>
                    <Text style={styles.tutorialIcon}>{slide.icon}</Text>
                    <Text style={styles.tutorialTitle}>{slide.title}</Text>
                    <Text style={styles.tutorialText}>{slide.text}</Text>

                    <View style={styles.tutorialDots}>
                        {slides.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.tutorialDot,
                                    i === step && styles.tutorialDotActive,
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.tutorialButtons}>
                        <Pressable
                            onPress={onDismiss}
                            style={styles.tutorialSkipButton}>
                            <Text style={styles.tutorialSkipText}>Skip</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                if (isLast) {
                                    onDismiss();
                                } else {
                                    setStep(s => s + 1);
                                }
                            }}
                            style={styles.tutorialNextButton}
                            android_ripple={{ color: '#5a3e28' }}>
                            <Text style={styles.tutorialNextText}>
                                {isLast ? 'Start Playing' : 'Next'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
}

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
    } = useMainViewModel();

    const mergedCellSet = useMemo(() => new Set(mergedCells), [mergedCells]);
    const newTileCellSet = useMemo(() => new Set(newTileCells), [newTileCells]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>2048</Text>
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

                <View style={styles.controlsRow}>
                    <Text style={styles.tagline}>
                        Join the numbers and get to the{' '}
                        <Text style={styles.taglineBold}>2048 tile!</Text>
                    </Text>
                    <View style={styles.controlButtons}>
                        <IconButton
                            onPress={undoMove}
                            label="Undo"
                            icon="↩"
                            disabled={!canUndo}
                        />
                        <IconButton
                            onPress={retryGame}
                            label="New Game"
                            icon="↻"
                        />
                    </View>
                </View>
            </View>

            {/* Game Grid */}
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

            {/* Instructions */}
            <Text style={styles.instructions}>
                Swipe to move the tiles. When two tiles with the same number
                touch, they merge into one!
            </Text>

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
                        <Text style={styles.winIcon}>🎉</Text>
                        <Text style={styles.modalTitle}>You Win!</Text>
                        <Text style={styles.modalSubtitle}>
                            You reached the 2048 tile!
                        </Text>
                        <Text style={styles.modalScore}>Score: {score}</Text>
                        <View style={styles.modalButtonRow}>
                            <Pressable
                                style={styles.keepPlayingButton}
                                onPress={keepPlaying}
                                android_ripple={{ color: '#5a3e28' }}>
                                <Text style={styles.keepPlayingText}>Keep Playing</Text>
                            </Pressable>
                            <Pressable
                                style={styles.retryButton}
                                onPress={retryGame}
                                android_ripple={{ color: '#5a3e28' }}>
                                <Text style={styles.retryButtonText}>New Game</Text>
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
                        <Text style={styles.gameOverIcon}>😔</Text>
                        <Text style={styles.modalTitle}>Game Over</Text>
                        <Text style={styles.modalScore}>Score: {score}</Text>
                        {score === bestScore && score > 0 && (
                            <Text style={styles.modalBestLabel}>
                                That's your best score!
                            </Text>
                        )}
                        <Pressable
                            style={styles.retryButton}
                            onPress={retryGame}
                            android_ripple={{ color: '#5a3e28' }}>
                            <Text style={styles.retryButtonText}>Try Again</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#faf8ef',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 48,
        justifyContent: 'space-between',
    },

    // Header
    header: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 56,
        fontWeight: '800',
        color: '#776e65',
        lineHeight: 64,
    },
    scoresRow: {
        flexDirection: 'row',
        gap: 6,
    },
    scoreBox: {
        backgroundColor: '#bbada0',
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 72,
        position: 'relative',
    },
    scoreLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#eee4da',
        letterSpacing: 1,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 1,
    },
    scoreAdded: {
        position: 'absolute',
        bottom: -2,
        fontSize: 14,
        fontWeight: '700',
        color: '#776e65',
    },

    // Controls
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tagline: {
        fontSize: 14,
        color: '#776e65',
        flex: 1,
        marginRight: 12,
        lineHeight: 20,
    },
    taglineBold: {
        fontWeight: '700',
    },
    controlButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        backgroundColor: '#8f7a66',
        borderRadius: 6,
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButtonPressed: {
        backgroundColor: '#7a6658',
    },
    iconButtonDisabled: {
        backgroundColor: '#c4b8ad',
    },
    iconButtonText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#f9f6f2',
    },
    iconButtonTextDisabled: {
        color: '#e8e0d8',
    },

    // Board
    board: {
        width: BOARD_WIDTH,
        backgroundColor: '#bbada0',
        borderRadius: 8,
        padding: BOARD_PADDING,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        margin: TILE_MARGIN,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileText: {
        fontWeight: '800',
    },

    // Instructions
    instructions: {
        marginTop: 16,
        fontSize: 14,
        color: '#776e65',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
        maxWidth: 400,
    },

    // High Score Banner
    highScoreOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    highScoreBanner: {
        backgroundColor: '#edc22e',
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: 36,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    highScoreIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    highScoreTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#776e65',
    },

    // Modals
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(238,228,218,0.73)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#faf8ef',
        borderRadius: 12,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    winIcon: {
        fontSize: 52,
        marginBottom: 8,
    },
    gameOverIcon: {
        fontSize: 52,
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#776e65',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#8f7a66',
        marginBottom: 4,
    },
    modalScore: {
        fontSize: 20,
        fontWeight: '700',
        color: '#bbada0',
        marginBottom: 4,
    },
    modalBestLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#edc22e',
        marginBottom: 8,
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    keepPlayingButton: {
        backgroundColor: '#bbada0',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    keepPlayingText: {
        color: '#f9f6f2',
        fontSize: 16,
        fontWeight: '700',
    },
    retryButton: {
        backgroundColor: '#8f7a66',
        borderRadius: 8,
        minWidth: 120,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 12,
    },
    retryButtonText: {
        color: '#f9f6f2',
        fontSize: 16,
        fontWeight: '700',
    },

    // Tutorial
    tutorialBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(58,43,30,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    tutorialCard: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#faf8ef',
        borderRadius: 16,
        paddingVertical: 32,
        paddingHorizontal: 28,
        alignItems: 'center',
    },
    tutorialIcon: {
        fontSize: 56,
        marginBottom: 12,
    },
    tutorialTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#776e65',
        marginBottom: 8,
        textAlign: 'center',
    },
    tutorialText: {
        fontSize: 16,
        color: '#8f7a66',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    tutorialDots: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    tutorialDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#cdc1b4',
    },
    tutorialDotActive: {
        backgroundColor: '#8f7a66',
        width: 20,
    },
    tutorialButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    tutorialSkipButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#bbada0',
    },
    tutorialSkipText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8f7a66',
    },
    tutorialNextButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#8f7a66',
        borderRadius: 8,
    },
    tutorialNextText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f9f6f2',
    },
});

export default MainView;
