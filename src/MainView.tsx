import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AppState,
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
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { useMainViewModel } from './MianViewModel';
import type { MergeAnimation, PowerMode, PowerPurchaseKind } from './MianViewModel';
import PowerButton from './components/PowerButton';
import { startBackgroundMusic, stopBackgroundMusic } from './audio';
import { usePlaybox } from './shared/playbox';
import { useGameStats } from './shared/stats';
import { GameShell } from './shared/GameShell';
import { Banner, ChunkyButton } from './shared/ui';
import { ResultModal } from './shared/ResultModal';
import type { ResultInfo } from './shared/ResultModal';
import { chunky, colors, gameColors, outlined, radius, fonts } from './theme';

const GRID_SIZE = 4;
const BOARD_BORDER = 2;
const BOARD_PADDING = 10;
const TILE_MARGIN = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 380);
const TILE_SIZE =
    (BOARD_WIDTH - BOARD_BORDER * 2 - BOARD_PADDING * 2 - TILE_MARGIN * 2 * GRID_SIZE) / GRID_SIZE;
const GRACE_SECONDS = 5;
const COLOR = gameColors.g2048;

/** Warm to cool as values grow; 2048 inverts to ink. Matches the style guide. */
const TILE_COLORS: Record<number, { bg: string; text: string }> = {
    2: { bg: '#FFF1D6', text: colors.ink },
    4: { bg: '#FFE2B0', text: colors.ink },
    8: { bg: '#FFC93C', text: colors.ink },
    16: { bg: '#FFA94D', text: colors.ink },
    32: { bg: '#FF8A3D', text: colors.ink },
    64: { bg: '#FF6B6B', text: colors.ink },
    128: { bg: '#FF6FA8', text: colors.ink },
    256: { bg: '#C77DFF', text: colors.ink },
    512: { bg: '#8B6CFF', text: colors.white },
    1024: { bg: '#3D8BFF', text: colors.white },
    2048: { bg: colors.ink, text: colors.coin },
};

function getTileStyle(value: number) {
    if (value === 0) { return { bg: colors.sandLight, text: 'transparent' }; }
    return TILE_COLORS[value] ?? { bg: colors.ink, text: colors.white };
}

function getTileFontSize(value: number) {
    if (value < 100) { return TILE_SIZE * 0.45; }
    if (value < 1000) { return TILE_SIZE * 0.36; }
    if (value < 10000) { return TILE_SIZE * 0.28; }
    return TILE_SIZE * 0.22;
}

function getCellOffset({ row, col }: { row: number; col: number }) {
    return {
        left: BOARD_PADDING + col * (TILE_SIZE + TILE_MARGIN * 2) + TILE_MARGIN,
        top: BOARD_PADDING + row * (TILE_SIZE + TILE_MARGIN * 2) + TILE_MARGIN,
    };
}

const POWER_COLORS = { destroy: '#FF6FA8', blast: colors.coin } as const;

/* ─── Tile ─── */
function Tile({
    value,
    isMerged,
    isSelectable,
    isPowerAction,
    activePowerMode,
    powerAnimationTick,
    mergeAnimationTick,
    onPress,
}: {
    value: number;
    isMerged: boolean;
    isSelectable: boolean;
    isPowerAction: boolean;
    activePowerMode: PowerMode;
    powerAnimationTick: number;
    mergeAnimationTick: number;
    onPress: () => void;
}) {
    const colorsFor = getTileStyle(value);
    const mergeScale = useRef(new Animated.Value(1)).current;
    const powerScale = useRef(new Animated.Value(1)).current;
    const powerOpacity = useRef(new Animated.Value(1)).current;
    const shake = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isMerged || value === 0) { return; }
        mergeScale.stopAnimation();
        mergeScale.setValue(0.92);
        Animated.sequence([
            Animated.delay(130),
            Animated.spring(mergeScale, { toValue: 1.1, friction: 5, tension: 170, useNativeDriver: true }),
            Animated.timing(mergeScale, { toValue: 1, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start();
    }, [isMerged, mergeAnimationTick, mergeScale, value]);

    useEffect(() => {
        if (!isPowerAction || value === 0) { return; }
        powerScale.setValue(1);
        powerOpacity.setValue(1);
        shake.setValue(0);
        const isBlast = activePowerMode === 'blast';
        Animated.parallel([
            Animated.sequence([-4, 4, -3, 3, 0].map(toValue =>
                Animated.timing(shake, { toValue, duration: 35, useNativeDriver: true }),
            )),
            Animated.sequence([
                Animated.timing(powerScale, { toValue: isBlast ? 1.16 : 1.08, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.parallel([
                    Animated.timing(powerScale, { toValue: 0, duration: isBlast ? 220 : 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
                    Animated.timing(powerOpacity, { toValue: 0, duration: isBlast ? 220 : 160, useNativeDriver: true }),
                ]),
            ]),
        ]).start();
    }, [activePowerMode, isPowerAction, powerAnimationTick, powerOpacity, powerScale, shake, value]);

    const tile = (
        <Animated.View
            style={[
                styles.tile,
                {
                    backgroundColor: colorsFor.bg,
                    borderColor: value > 0 ? colors.ink : 'transparent',
                    opacity: isPowerAction ? powerOpacity : 1,
                    transform: [
                        { translateX: isPowerAction ? shake : 0 },
                        { scale: isPowerAction ? powerScale : value > 0 ? mergeScale : 1 },
                    ],
                },
                isSelectable && activePowerMode && {
                    borderColor: colors.ink,
                    borderWidth: 3,
                    borderStyle: 'dashed',
                },
            ]}>
            {value > 0 && (
                <Text
                    style={[styles.tileText, { color: colorsFor.text, fontSize: getTileFontSize(value) }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {value}
                </Text>
            )}
        </Animated.View>
    );

    if (!activePowerMode) {
        return tile;
    }

    return (
        <Pressable
            onPress={onPress}
            disabled={value <= 0}
            accessibilityLabel={value > 0 ? `Select ${value} tile` : 'Empty tile'}
            accessibilityRole="button">
            {tile}
        </Pressable>
    );
}

/* ─── Merge travel: copies of the two source tiles sliding into the merge spot ─── */
function MergeTravelTile({
    value,
    from,
    to,
    tick,
}: {
    value: number;
    from: { row: number; col: number };
    to: { row: number; col: number };
    tick: number;
}) {
    const progress = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const colorsFor = getTileStyle(value);
    const start = getCellOffset(from);
    const end = getCellOffset(to);

    useEffect(() => {
        progress.setValue(0);
        opacity.setValue(1);
        Animated.parallel([
            Animated.timing(progress, { toValue: 1, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.sequence([
                Animated.delay(95),
                Animated.timing(opacity, { toValue: 0, duration: 85, useNativeDriver: true }),
            ]),
        ]).start();
    }, [opacity, progress, tick]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.tile,
                styles.travel,
                {
                    left: start.left,
                    top: start.top,
                    backgroundColor: colorsFor.bg,
                    opacity,
                    transform: [
                        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, end.left - start.left] }) },
                        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, end.top - start.top] }) },
                    ],
                },
            ]}>
            <Text style={[styles.tileText, { color: colorsFor.text, fontSize: getTileFontSize(value) }]} numberOfLines={1} adjustsFontSizeToFit>
                {value}
            </Text>
        </Animated.View>
    );
}

function MergeTravelLayer({ animations, tick }: { animations: MergeAnimation[]; tick: number }) {
    return (
        <>
            {animations.flatMap(animation =>
                animation.from.map((from, sourceIndex) => (
                    <MergeTravelTile
                        key={`${tick}-${animation.id}-${sourceIndex}`}
                        value={animation.value}
                        from={from}
                        to={animation.to}
                        tick={tick}
                    />
                )),
            )}
        </>
    );
}

/* ─── New high score banner ─── */
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
                Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else if (show) {
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setShow(false));
        }
    }, [visible, opacity, scale, show]);

    if (!show) { return null; }

    return (
        <View style={styles.bannerLayer} pointerEvents="none">
            <Animated.View style={[styles.highScore, { opacity, transform: [{ scale }] }]}>
                <Lucide name="trophy" size={44} color={colors.ink} />
                <Text style={styles.highScoreText}>New high score!</Text>
            </Animated.View>
        </View>
    );
}

/* ─── Score chip with a "+N" that floats up ─── */
function ScoreChip({
    label,
    value,
    added,
    bumpTick,
    highlight,
}: {
    label: string;
    value: number;
    added?: number;
    bumpTick?: number;
    highlight?: string;
}) {
    const bumpScale = useRef(new Animated.Value(1)).current;
    const addedOpacity = useRef(new Animated.Value(0)).current;
    const addedY = useRef(new Animated.Value(0)).current;
    const [showAdded, setShowAdded] = useState(false);

    useEffect(() => {
        if (!bumpTick || !added || added <= 0) { return; }
        bumpScale.setValue(1.2);
        Animated.timing(bumpScale, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        setShowAdded(true);
        addedOpacity.setValue(1);
        addedY.setValue(0);
        Animated.parallel([
            Animated.timing(addedOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(addedY, { toValue: -26, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start(() => setShowAdded(false));
    }, [added, addedOpacity, addedY, bumpScale, bumpTick]);

    return (
        <View
            style={[styles.chip, { backgroundColor: highlight ?? colors.card }]}
            accessible
            accessibilityLabel={`${label} ${value}`}>
            <Text style={[styles.chipLabel, { color: highlight ? colors.ink : colors.muted }]}>{label}</Text>
            <Animated.Text style={[styles.chipValue, { transform: [{ scale: bumpScale }] }]} numberOfLines={1} adjustsFontSizeToFit>
                {value.toLocaleString()}
            </Animated.Text>
            {showAdded && (
                <Animated.Text style={[styles.added, { opacity: addedOpacity, transform: [{ translateY: addedY }] }]}>
                    +{added}
                </Animated.Text>
            )}
        </View>
    );
}

/* ─── Dialog used by the shop, win and reset prompts ─── */
function Dialog({
    visible,
    onClose,
    icon,
    iconColor = colors.coin,
    title,
    body,
    children,
}: {
    visible: boolean;
    onClose: () => void;
    icon: React.ComponentProps<typeof Lucide>['name'];
    iconColor?: string;
    title: string;
    body?: string;
    children: React.ReactNode;
}) {
    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.dialog}>
                    <View style={[styles.dialogIcon, { backgroundColor: iconColor }]}>
                        <Lucide name={icon} size={28} color={colors.ink} />
                    </View>
                    <Text style={styles.dialogTitle} accessibilityRole="header">{title}</Text>
                    {body != null && <Text style={styles.dialogBody}>{body}</Text>}
                    <View style={styles.dialogActions}>{children}</View>
                </View>
            </View>
        </Modal>
    );
}

function PowerPurchaseModal({
    pendingPower,
    coins,
    destroyCost,
    blastCost,
    onBuyDestroy,
    onBuyBlast,
    onCancel,
}: {
    pendingPower: PowerPurchaseKind | null;
    coins: number;
    destroyCost: number;
    blastCost: number;
    onBuyDestroy: () => void;
    onBuyBlast: () => void;
    onCancel: () => void;
}) {
    if (pendingPower === 'shop') {
        return (
            <Dialog visible onClose={onCancel} icon="shopping-bag" title="Power shop" body={`You have ${coins.toLocaleString()} coins.`}>
                <ShopRow icon="hammer" name="Smash" desc="Remove any one tile" cost={destroyCost} color={POWER_COLORS.destroy} onBuy={onBuyDestroy} />
                <ShopRow icon="wand-sparkles" name="Blast" desc="Clear every tile of a number" cost={blastCost} color={POWER_COLORS.blast} onBuy={onBuyBlast} />
                <ChunkyButton label="Close" onPress={onCancel} />
            </Dialog>
        );
    }
    const isDestroy = pendingPower === 'destroy';
    return (
        <Dialog
            visible={pendingPower != null}
            onClose={onCancel}
            icon={isDestroy ? 'hammer' : 'wand-sparkles'}
            iconColor={isDestroy ? POWER_COLORS.destroy : POWER_COLORS.blast}
            title={`Out of ${isDestroy ? 'Smash' : 'Blast'}`}
            body={`Buy one more for ${isDestroy ? destroyCost : blastCost} coins?`}>
            <ChunkyButton label="Buy" color={colors.ink} textColor={colors.white} onPress={isDestroy ? onBuyDestroy : onBuyBlast} />
            <ChunkyButton label="Not now" onPress={onCancel} />
        </Dialog>
    );
}

function ShopRow({
    icon,
    name,
    desc,
    cost,
    color,
    onBuy,
}: {
    icon: React.ComponentProps<typeof Lucide>['name'];
    name: string;
    desc: string;
    cost: number;
    color: string;
    onBuy: () => void;
}) {
    return (
        <View style={styles.shopRow}>
            <View style={[styles.shopIcon, { backgroundColor: color }]}>
                <Lucide name={icon} size={20} color={colors.ink} />
            </View>
            <View style={styles.flex}>
                <Text style={styles.shopName}>{name}</Text>
                <Text style={styles.shopDesc}>{desc}</Text>
            </View>
            <ChunkyButton label={String(cost)} icon="coins" color={colors.coin} onPress={onBuy} accessibilityLabel={`Buy ${name} for ${cost} coins`} />
        </View>
    );
}

const highestTile = (board: number[][]) => Math.max(...board.flat());

/* ─── Main View ─── */
const MainView = () => {
    const { soundEnabled, toggleSound } = usePlaybox();
    const { recordResult } = useGameStats('g2048');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [graceLeft, setGraceLeft] = useState(GRACE_SECONDS);
    const [result, setResult] = useState<ResultInfo | null>(null);
    const {
        board,
        score,
        bestScore,
        coins,
        coinsAdded,
        coinsBumpTick,
        destroyUses,
        blastUses,
        activePowerMode,
        pendingPurchasePower,
        showInsufficientCoinsModal,
        destroyPowerCost,
        blastPowerCost,
        scoreAdded,
        scoreBumpTick,
        showHighScoreAnimation,
        isGameOver,
        showGameOverModal,
        showWinModal,
        mergedCells,
        mergeAnimations,
        powerActionCells,
        powerAnimationTick,
        mergeAnimationTick,
        gesture,
        canUndo,
        retryGame,
        undoMove,
        keepPlaying,
        activateDestroyMode,
        activateBlastMode,
        selectPowerTile,
        cancelPowerMode,
        buyDestroyPower,
        buyBlastPower,
        closePowerModal,
        openPowerShop,
    } = useMainViewModel({ soundEnabled });

    const mergedCellSet = useMemo(() => new Set(mergedCells), [mergedCells]);
    const powerActionCellSet = useMemo(() => new Set(powerActionCells), [powerActionCells]);
    const inGraceWindow = isGameOver && !showGameOverModal;

    useEffect(() => {
        const sync = (appState: string) => {
            if (soundEnabled && appState === 'active') {
                startBackgroundMusic();
            } else {
                stopBackgroundMusic();
            }
        };
        sync(AppState.currentState);
        const subscription = AppState.addEventListener('change', sync);
        return () => {
            subscription.remove();
            stopBackgroundMusic();
        };
    }, [soundEnabled]);

    // Countdown shown while the player can still rescue the game with a power.
    useEffect(() => {
        setGraceLeft(GRACE_SECONDS);
        if (!inGraceWindow) { return; }
        const id = setInterval(() => setGraceLeft(s => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [inGraceWindow]);

    // Record the run once when the game-over screen appears.
    const recorded = useRef(false);
    useEffect(() => {
        if (!showGameOverModal) {
            recorded.current = false;
            setResult(null);
            return;
        }
        if (recorded.current) { return; }
        recorded.current = true;
        const top = highestTile(board);
        const { isNewBest } = recordResult({ score, won: top >= 2048 });
        setResult({
            title: top >= 2048 ? 'Amazing run!' : 'Great run!',
            subtitle: '2048 · no moves left',
            scoreLabel: 'FINAL SCORE',
            score: score.toLocaleString(),
            isNewBest,
            won: top >= 2048,
            stats: [
                { label: 'Top tile', value: String(top) },
                { label: 'Best', value: Math.max(bestScore, score).toLocaleString() },
                { label: 'Coins', value: coins.toLocaleString() },
            ],
        });
    }, [bestScore, board, coins, recordResult, score, showGameOverModal]);

    const powerHint = activePowerMode === 'destroy'
        ? 'Tap any tile to smash it'
        : activePowerMode === 'blast' ? 'Tap a number to blast them all' : null;

    return (
        <GameShell
            tutorial="g2048"
            title="2048"
            background={colors.cream}
            scroll={false}
            action={{
                icon: soundEnabled ? 'volume-2' : 'volume-x',
                label: soundEnabled ? 'Turn sound off' : 'Turn sound on',
                onPress: toggleSound,
            }}
            footer={
                <View style={styles.footerRow}>
                    <ChunkyButton label="New game" icon="rotate-ccw" color={colors.ink} textColor={colors.white} style={styles.flex} onPress={() => setShowResetConfirm(true)} />
                    <ChunkyButton icon="shopping-bag" accessibilityLabel="Power shop" onPress={openPowerShop} />
                </View>
            }>
            <View style={styles.row}>
                <ScoreChip label="SCORE" value={score} added={scoreAdded} bumpTick={scoreBumpTick} highlight={COLOR.main} />
                <ScoreChip label="BEST" value={bestScore} />
                <ScoreChip label="COINS" value={coins} added={coinsAdded} bumpTick={coinsBumpTick} highlight={colors.coin} />
            </View>

            <GestureDetector gesture={gesture}>
                <View style={styles.board} accessibilityLabel="2048 board, swipe to move tiles">
                    {board.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.boardRow}>
                            {row.map((cell, colIndex) => {
                                const key = `${rowIndex}-${colIndex}`;
                                return (
                                    <Tile
                                        key={key}
                                        value={cell}
                                        isMerged={mergedCellSet.has(key)}
                                        isSelectable={activePowerMode != null && cell > 0}
                                        isPowerAction={powerActionCellSet.has(key)}
                                        activePowerMode={activePowerMode}
                                        powerAnimationTick={powerAnimationTick}
                                        mergeAnimationTick={mergeAnimationTick}
                                        onPress={() => selectPowerTile(rowIndex, colIndex)}
                                    />
                                );
                            })}
                        </View>
                    ))}
                    <MergeTravelLayer animations={mergeAnimations} tick={mergeAnimationTick} />
                </View>
            </GestureDetector>

            <View style={styles.powers}>
                <PowerButton label="Undo" icon="undo-2" color={colors.card} disabled={!canUndo || isGameOver} onPress={undoMove} />
                <PowerButton
                    label="Smash"
                    icon="hammer"
                    color={POWER_COLORS.destroy}
                    active={activePowerMode === 'destroy'}
                    urgent={inGraceWindow}
                    badge={destroyUses > 0 ? String(destroyUses) : undefined}
                    price={destroyPowerCost}
                    onPress={activateDestroyMode}
                />
                <PowerButton
                    label="Blast"
                    icon="wand-sparkles"
                    color={POWER_COLORS.blast}
                    active={activePowerMode === 'blast'}
                    urgent={inGraceWindow}
                    badge={blastUses > 0 ? String(blastUses) : undefined}
                    price={blastPowerCost}
                    onPress={activateBlastMode}
                />
            </View>

            {inGraceWindow ? (
                <Banner color="#FFDCEA">
                    <View style={styles.countdown}><Text style={styles.countdownText}>{graceLeft}</Text></View>
                    <Text style={styles.bannerText}>No moves left! Use a power to keep going</Text>
                </Banner>
            ) : powerHint ? (
                <Banner color={activePowerMode === 'destroy' ? '#FFDCEA' : colors.coinLight} dashed>
                    <Text style={styles.bannerText}>{powerHint}</Text>
                    <Pressable onPress={cancelPowerMode} hitSlop={10} accessibilityRole="button">
                        <Text style={styles.cancel}>Cancel</Text>
                    </Pressable>
                </Banner>
            ) : (
                <Text style={styles.hint}>Swipe to move. Same numbers merge. Bigger merges earn coins.</Text>
            )}

            <HighScoreBanner visible={showHighScoreAnimation} />

            <PowerPurchaseModal
                pendingPower={pendingPurchasePower}
                coins={coins}
                destroyCost={destroyPowerCost}
                blastCost={blastPowerCost}
                onBuyDestroy={buyDestroyPower}
                onBuyBlast={buyBlastPower}
                onCancel={closePowerModal}
            />

            <Dialog visible={showInsufficientCoinsModal} onClose={closePowerModal} icon="coins" title="Not enough coins" body="Merge bigger tiles (256 and up) or play the other games to earn coins.">
                <ChunkyButton label="OK" color={colors.ink} textColor={colors.white} onPress={closePowerModal} />
            </Dialog>

            <Dialog visible={showWinModal} onClose={keepPlaying} icon="trophy" title="You made 2048!" body={`Score ${score.toLocaleString()}. Keep going for an even bigger tile?`}>
                <ChunkyButton label="Keep playing" color={colors.ink} textColor={colors.white} onPress={keepPlaying} />
                <ChunkyButton label="New game" onPress={retryGame} />
            </Dialog>

            <Dialog visible={showResetConfirm} onClose={() => setShowResetConfirm(false)} icon="rotate-ccw" iconColor={COLOR.main} title="Start a new game?" body="Your current board and undo history will be cleared.">
                <ChunkyButton label="New game" color={colors.ink} textColor={colors.white} onPress={() => { setShowResetConfirm(false); retryGame(); }} />
                <ChunkyButton label="Keep this game" onPress={() => setShowResetConfirm(false)} />
            </Dialog>

            <ResultModal result={showGameOverModal ? result : null} onPlayAgain={retryGame} />
        </GameShell>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    row: { flexDirection: 'row', gap: 10 },
    footerRow: { flexDirection: 'row', gap: 10 },
    chip: { flex: 1, borderRadius: 16, ...outlined, paddingVertical: 6, paddingHorizontal: 10 },
    chipLabel: { fontSize: 12, fontFamily: fonts.heavy },
    chipValue: { fontSize: 22, fontFamily: fonts.display, color: colors.ink },
    added: { position: 'absolute', right: 8, top: 4, fontSize: 15, fontFamily: fonts.heavy, color: colors.ink },
    board: {
        alignSelf: 'center',
        width: BOARD_WIDTH,
        backgroundColor: colors.sand,
        borderRadius: radius.board,
        ...chunky(5),
        padding: BOARD_PADDING,
    },
    boardRow: { flexDirection: 'row' },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        margin: TILE_MARGIN,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    travel: { position: 'absolute', margin: 0, borderColor: colors.ink, zIndex: 10 },
    tileText: { fontFamily: fonts.display },
    powers: { flexDirection: 'row', gap: 10, paddingTop: 6 },
    bannerText: { flex: 1, fontSize: 14, fontFamily: fonts.heavy, color: colors.ink },
    cancel: { fontSize: 14, fontFamily: fonts.heavy, color: colors.ink, textDecorationLine: 'underline' },
    countdown: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.card,
        borderWidth: 3,
        borderColor: POWER_COLORS.destroy,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countdownText: { fontSize: 15, fontFamily: fonts.display, color: colors.ink },
    hint: { fontSize: 14, fontFamily: fonts.bold, color: colors.muted, textAlign: 'center' },
    bannerLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 20 },
    highScore: {
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.coin,
        borderRadius: 24,
        ...chunky(6),
        paddingHorizontal: 32,
        paddingVertical: 22,
    },
    highScoreText: { fontSize: 26, fontFamily: fonts.display, color: colors.ink },
    backdrop: { flex: 1, backgroundColor: 'rgba(43,33,64,0.55)', justifyContent: 'center', padding: 24 },
    dialog: {
        backgroundColor: colors.cream,
        borderRadius: 26,
        ...chunky(6),
        padding: 20,
        gap: 10,
        alignItems: 'center',
    },
    dialogIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        ...outlined,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogTitle: { fontSize: 24, fontFamily: fonts.display, color: colors.ink, textAlign: 'center' },
    dialogBody: { fontSize: 15, fontFamily: fonts.bold, color: colors.muted, textAlign: 'center' },
    dialogActions: { alignSelf: 'stretch', gap: 10, marginTop: 6 },
    shopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.card,
        borderRadius: 16,
        ...outlined,
        padding: 10,
    },
    shopIcon: { width: 40, height: 40, borderRadius: 12, ...outlined, alignItems: 'center', justifyContent: 'center' },
    shopName: { fontSize: 15, fontFamily: fonts.display, color: colors.ink },
    shopDesc: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted },
});

export default MainView;
