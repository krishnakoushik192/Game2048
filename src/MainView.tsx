import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    Text,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useMainViewModel } from './MianViewModel';
import type { PowerMode, PowerPurchaseKind } from './MianViewModel';
import Footer from './components/Footer';
import PowerButton from './components/PowerButton';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6/static';
import { Lucide } from '@react-native-vector-icons/lucide/static';

const GRID_SIZE = 4;
const BOARD_PADDING = 10;
const TILE_MARGIN = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 380);
const TILE_SIZE =
    (BOARD_WIDTH - BOARD_PADDING * 2 - TILE_MARGIN * 2 * GRID_SIZE) / GRID_SIZE;

export const COLORS = {
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
    0: { bg: COLORS.emptyCell, text: 'transparent', border: COLORS.emptyCellBorder },
    2: { bg: 'rgba(0,229,255,0.10)', text: '#00e5ff', border: 'rgba(0,229,255,0.45)' },
    4: { bg: 'rgba(57,255,20,0.10)', text: '#39ff14', border: 'rgba(57,255,20,0.45)' },
    8: { bg: 'rgba(255,171,0,0.10)', text: '#ffab00', border: 'rgba(255,171,0,0.45)' },
    16: { bg: 'rgba(224,64,251,0.10)', text: '#e040fb', border: 'rgba(224,64,251,0.45)' },
    32: { bg: 'rgba(24,255,255,0.10)', text: '#18ffff', border: 'rgba(24,255,255,0.45)' },
    64: { bg: 'rgba(118,255,3,0.10)', text: '#76ff03', border: 'rgba(118,255,3,0.45)' },
    128: { bg: 'rgba(255,215,64,0.12)', text: '#ffd740', border: 'rgba(255,215,64,0.50)' },
    256: { bg: 'rgba(255,64,129,0.12)', text: '#ff4081', border: 'rgba(255,64,129,0.50)' },
    512: { bg: 'rgba(105,240,174,0.10)', text: '#69f0ae', border: 'rgba(105,240,174,0.45)' },
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
    isNew: _isNew,
    isSelectable,
    isPowerAction,
    activePowerMode,
    powerAnimationTick,
    mergeAnimationTick,
    spawnAnimationTick: _spawnAnimationTick,
    onPress,
}: {
    value: number;
    isMerged: boolean;
    isNew: boolean;
    isSelectable: boolean;
    isPowerAction: boolean;
    activePowerMode: PowerMode;
    powerAnimationTick: number;
    mergeAnimationTick: number;
    spawnAnimationTick: number;
    onPress: () => void;
}) {
    const colors = getTileStyle(value);
    const scale = useRef(new Animated.Value(1)).current;
    const powerScale = useRef(new Animated.Value(1)).current;
    const powerOpacity = useRef(new Animated.Value(1)).current;
    const shake = useRef(new Animated.Value(0)).current;

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

    useEffect(() => {
        if (!isPowerAction || value === 0) { return; }
        powerScale.setValue(1);
        powerOpacity.setValue(1);
        shake.setValue(0);
        const shakeAnimation = Animated.sequence([
            Animated.timing(shake, { toValue: -4, duration: 35, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 4, duration: 35, useNativeDriver: true }),
            Animated.timing(shake, { toValue: -3, duration: 35, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 3, duration: 35, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: 35, useNativeDriver: true }),
        ]);
        const blastAnimation = Animated.sequence([
            Animated.timing(powerScale, {
                toValue: activePowerMode === 'blast' ? 1.16 : 1.08,
                duration: 100,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(powerScale, {
                    toValue: 0,
                    duration: activePowerMode === 'blast' ? 220 : 160,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(powerOpacity, {
                    toValue: 0,
                    duration: activePowerMode === 'blast' ? 220 : 160,
                    useNativeDriver: true,
                }),
            ]),
        ]);
        Animated.parallel([shakeAnimation, blastAnimation]).start();
    }, [activePowerMode, isPowerAction, powerAnimationTick, powerOpacity, powerScale, shake, value]);

    const tile = (
        <Animated.View
            className="items-center justify-center rounded-[10px]"
            style={[
                {
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    margin: TILE_MARGIN,
                    backgroundColor: colors.bg,
                    borderColor: isSelectable ? (activePowerMode === 'destroy' ? COLORS.pink : COLORS.cyan) : colors.border,
                    borderWidth: isSelectable ? 2 : value > 0 ? 1.5 : 1,
                    opacity: isPowerAction ? powerOpacity : 1,
                    shadowColor: activePowerMode === 'destroy' ? COLORS.pink : COLORS.cyan,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isSelectable ? 0.55 : 0,
                    shadowRadius: isSelectable ? 12 : 0,
                    elevation: isSelectable ? 8 : 0,
                    transform: [
                        { translateX: isPowerAction ? shake : 0 },
                        { scale: isPowerAction ? powerScale : isMerged && value > 0 ? scale : 1 },
                    ],
                },
            ]}>
            {isSelectable && (
                <View
                    className="absolute inset-0 rounded-[10px]"
                    style={{
                        backgroundColor: activePowerMode === 'destroy'
                            ? 'rgba(255,45,120,0.12)'
                            : 'rgba(0,229,255,0.12)',
                    }}
                />
            )}
            {isPowerAction && (
                <Animated.View
                    className="absolute rounded-full border-2"
                    style={{
                        width: TILE_SIZE * 0.94,
                        height: TILE_SIZE * 0.94,
                        borderColor: activePowerMode === 'destroy' ? COLORS.pink : COLORS.gold,
                        opacity: powerOpacity,
                        transform: [{ scale: powerScale }],
                    }}
                />
            )}
            {value > 0 && (
                <Text
                    className="font-extrabold"
                    style={[
                        { color: colors.text, fontSize: getTileFontSize(value) },
                    ]}
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
        <View className="absolute inset-0 z-10 items-center justify-center" pointerEvents="none">
            <Animated.View
                className="items-center rounded-[20px] border-2 border-[rgba(255,215,64,0.5)] bg-[rgba(255,215,64,0.18)] px-10 py-7"
                style={[
                    {
                        transform: [{ scale }],
                        opacity,
                        elevation: 12,
                        shadowColor: COLORS.gold,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.4,
                        shadowRadius: 20,
                    },
                ]}>
                <Text className="mb-2 text-5xl">🏆</Text>
                <Text className="text-[28px] font-extrabold text-[#ffd740]">New High Score!</Text>
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
    const labelColor = label === 'SCORE' ? COLORS.pink : COLORS.cyan;

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
        <View className="relative flex-1 items-center py-1 mt-12">
            <Text className="text-sm font-bold tracking-[2px]" style={{ color: labelColor }}>{label}</Text>
            <Animated.Text
                className="mt-0 text-4xl font-extrabold text-white"
                style={[
                    { transform: [{ scale: bumpScale }] },
                ]}>
                {score}
            </Animated.Text>
            {showAdded && scoreAdded != null && scoreAdded > 0 && (
                <Animated.Text
                    className="absolute right-8 top-2 text-lg font-bold text-[#ff2d78]"
                    style={[
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

function CoinCounter({
    coins,
    coinsAdded,
    coinsBumpTick,
}: {
    coins: number;
    coinsAdded: number;
    coinsBumpTick: number;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    const addedOpacity = useRef(new Animated.Value(0)).current;
    const addedTranslateY = useRef(new Animated.Value(0)).current;
    const [showAdded, setShowAdded] = useState(false);

    useEffect(() => {
        if (!coinsBumpTick || coinsAdded <= 0) { return; }
        scale.setValue(1.16);
        Animated.timing(scale, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
        setShowAdded(true);
        addedOpacity.setValue(1);
        addedTranslateY.setValue(0);
        Animated.parallel([
            Animated.timing(addedOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(addedTranslateY, {
                toValue: -24,
                duration: 800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start(() => setShowAdded(false));
    }, [addedOpacity, addedTranslateY, coinsAdded, coinsBumpTick, scale]);

    return (
        <View
            className="relative self-center rounded-full border px-4 py-2"
            style={{
                backgroundColor: 'rgba(255,215,64,0.08)',
                borderColor: 'rgba(255,215,64,0.42)',
                shadowColor: COLORS.gold,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
            }}>
            <Animated.View
                className="flex-row items-center gap-2"
                style={{ transform: [{ scale }] }}>
                <FontAwesome6 name="coins" iconStyle="solid" size={18} color={COLORS.gold} />
                <Text className="text-[16px] font-extrabold text-[#ffd740]">{coins}</Text>
            </Animated.View>
            {showAdded && (
                <Animated.Text
                    className="absolute right-2 top-0 text-xs font-extrabold text-[#39ff14]"
                    style={{ opacity: addedOpacity, transform: [{ translateY: addedTranslateY }] }}>
                    +{coinsAdded}
                </Animated.Text>
            )}
        </View>
    );
}


function PowerPurchaseModal({
    pendingPower,
    destroyCost,
    blastCost,
    onBuyDestroy,
    onBuyBlast,
    onCancel,
}: {
    pendingPower: PowerPurchaseKind | null;
    destroyCost: number;
    blastCost: number;
    onBuyDestroy: () => void;
    onBuyBlast: () => void;
    onCancel: () => void;
}) {
    const isShop = pendingPower === 'shop';
    const isDestroy = pendingPower === 'destroy';
    const title = isDestroy ? 'Destroy Tile' : 'Number Blast';
    const cost = isDestroy ? destroyCost : blastCost;
    const color = isDestroy ? COLORS.magenta : COLORS.cyan;
    const shopItems = [
        { title: 'Destroy', icon: 'hammer', cost: destroyCost, color: COLORS.magenta, onPress: onBuyDestroy },
        { title: 'Blast', icon: 'wand-sparkles', cost: blastCost, color: COLORS.cyan, onPress: onBuyBlast },
    ] as const;

    return (
        <Modal
            visible={pendingPower != null}
            animationType="fade"
            transparent
            statusBarTranslucent
            onRequestClose={onCancel}>
            <View className="flex-1 items-center justify-center bg-[rgba(8,12,24,0.88)] px-6">
                <View
                    className="w-full max-w-[340px] items-center rounded-[20px] border border-[rgba(255,255,255,0.10)] bg-[rgba(20,25,50,0.95)] px-7 py-8"
                    style={{
                        elevation: 12,
                        shadowColor: isShop ? COLORS.cyan : color,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.25,
                        shadowRadius: 20,
                    }}>
                    {isShop ? (
                        <>
                            <Text className="mb-5 text-3xl font-extrabold text-white">Power Shop</Text>
                            <View className="w-full flex-row justify-center" style={{ columnGap: 56 }}>
                                {shopItems.map(item => (
                                    <Pressable
                                        key={item.title}
                                        className="items-center justify-center rounded-full"
                                        style={({ pressed }) => [
                                            pressed && { opacity: 0.72 },
                                        ]}
                                        onPress={item.onPress}>
                                        <View
                                            className="rounded-full"
                                            style={{
                                                borderWidth: 1,
                                                backgroundColor: `${item.color}24`,
                                                borderColor: item.color,
                                                paddingVertical: 15,
                                                paddingHorizontal: 15,
                                            }}>
                                            <Lucide name={item.icon} size={24} color={item.color} />
                                        </View>
                                        <Text className="mt-2 text-center text-[14px] font-extrabold text-white">{item.title}</Text>
                                        <Text className="mt-2 text-[13px] font-extrabold text-[#ffd740]">{item.cost} coins</Text>
                                    </Pressable>
                                ))}
                            </View>
                            <Pressable
                                className="mt-5 min-w-[120px] items-center rounded-xl border-[1.5px] border-[rgba(255,255,255,0.14)] px-5 py-3"
                                onPress={onCancel}>
                                <Text className="text-[15px] font-bold text-white">Cancel</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <View
                                className="mb-3 rounded-full"
                                style={{
                                    borderWidth: 1,
                                    backgroundColor: `${color}24`,
                                    borderColor: color,
                                    paddingVertical: 15,
                                    paddingHorizontal: 15,
                                }}>
                                <Lucide name={isDestroy ? 'hammer' : 'wand-sparkles'} size={24} color={color} />
                            </View>
                            <Text className="mb-1.5 text-3xl font-extrabold text-white">Recharge Power?</Text>
                            <Text className="mb-2 text-[16px] font-bold" style={{ color }}>{title}</Text>
                            <Text className="mb-5 text-xl font-extrabold text-[#ffd740]">Cost: {cost} coins</Text>
                            <View className="flex-row gap-3">
                                <Pressable
                                    className="min-w-[104px] items-center rounded-xl px-5 py-3"
                                    style={{ backgroundColor: color }}
                                    onPress={isDestroy ? onBuyDestroy : onBuyBlast}>
                                    <Text className="text-[15px] font-bold text-white">Buy</Text>
                                </Pressable>
                                <Pressable
                                    className="min-w-[104px] items-center rounded-xl border-[1.5px] border-[rgba(255,255,255,0.14)] px-5 py-3"
                                    onPress={onCancel}>
                                    <Text className="text-[15px] font-bold text-white">Cancel</Text>
                                </Pressable>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

function InfoModal({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}>
            <View className="flex-1 items-center justify-center bg-[rgba(8,12,24,0.88)] px-6">
                <View className="w-full max-w-[320px] items-center rounded-[20px] border border-[rgba(255,255,255,0.10)] bg-[rgba(20,25,50,0.95)] px-7 py-8">
                    <FontAwesome6 name="coins" iconStyle="solid" size={42} color={COLORS.gold} style={{ marginBottom: 8 }} />
                    <Text className="mb-2 text-3xl font-extrabold text-white">Not Enough Coins</Text>
                    <Text className="mb-5 text-center text-[15px] leading-5 text-[rgba(255,255,255,0.58)]">
                        Merge bigger tiles to earn coins.
                    </Text>
                    <Pressable
                        className="min-w-[120px] items-center rounded-xl bg-[#ff2d78] px-5 py-3"
                        onPress={onClose}>
                        <Text className="text-[15px] font-bold text-white">OK</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GridIcon() {
    const sq = {
        width: 9,
        height: 9,
        borderRadius: 2,
        backgroundColor: COLORS.white,
    };
    return (
        <View className="w-[22px] flex-row flex-wrap gap-[3px]">
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
            className="m-0.5 items-center justify-center rounded-lg"
            style={{
                width: size,
                height: size,
                backgroundColor: colors.bg,
                borderWidth: value > 0 ? 1.5 : 1,
                borderColor: colors.border,
            }}>
            {value > 0 && (
                <Text className="font-extrabold" style={{ color: colors.text, fontSize }}>
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
        <View className="my-1.5 items-center">
            <View className="flex-row items-center">
                <MiniTile value={from1} />
                <Text className="mx-1 text-lg font-bold text-[rgba(255,255,255,0.5)]">+</Text>
                <MiniTile value={from2} />
                <Text className="mx-1 text-lg font-bold text-[rgba(255,255,255,0.5)]">=</Text>
                <MiniTile value={result} />
            </View>
            <Text className="mt-1 text-xs font-semibold text-[#ffd740]">
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
        <View className="mt-3.5 w-full max-w-[400px] rounded-[14px] border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] p-4">
            <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[15px] font-extrabold italic text-[#ff2d78]">Pro Tip</Text>
                <View className="h-4 w-4 rounded-full border-2 border-[rgba(255,255,255,0.15)]" />
            </View>
            <Animated.Text className="text-[13px] leading-[19px] text-[rgba(255,255,255,0.7)]" style={{ opacity: fadeAnim }}>
                {PRO_TIPS[tipIndex]}
            </Animated.Text>
        </View>
    );
}

/* ─── Tutorial / Onboarding Overlay ─── */
export function TutorialOverlay({
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
                <View className="relative mb-6">
                    <View className="rounded-xl bg-[rgba(15,20,45,0.9)] p-1.5">
                        {[
                            [0, 2, 0, 0],
                            [4, 0, 2, 0],
                            [0, 0, 0, 0],
                            [0, 4, 0, 0],
                        ].map((row, ri) => (
                            <View key={ri} className="flex-row">
                                {row.map((v, ci) => (
                                    <MiniTile key={ci} value={v} size={52} />
                                ))}
                            </View>
                        ))}
                    </View>
                    <View className="absolute bottom-10 left-5 flex-row items-center">
                        <Text className="text-[40px]">👋</Text>
                        <View className="ml-1 h-[3px] w-20 rounded-sm bg-[#ff2d78]" />
                    </View>
                </View>
            ),
        },
        {
            title: 'Same numbers merge together!',
            body: 'Every merge adds the new tile\'s value to your score. Bigger merges = more points!',
            visual: (
                <View className="mt-2">
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
                <View className="mt-3 flex-row gap-1">
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
            <Animated.View
                className="flex-1 bg-[rgba(8,12,24,0.96)] px-6 pb-8 pt-12"
                style={{ opacity: backdropOpacity }}>
                {/* Header */}
                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-4xl font-black text-[#39ff14]">2048</Text>
                    <Pressable onPress={onDismiss} hitSlop={16}>
                        <Text className="text-[15px] font-semibold tracking-[1px] text-white">SKIP</Text>
                    </Pressable>
                </View>

                {/* Step indicator */}
                <View className="mb-5 flex-row justify-center gap-1.5">
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            className={`h-1 w-7 rounded-sm ${i === step ? 'bg-[#ff2d78]' : 'bg-[rgba(255,255,255,0.15)]'}`}
                        />
                    ))}
                </View>

                {/* Content */}
                <Animated.View
                    className="flex-1 items-center justify-center"
                    style={[
                        { opacity: contentOpacity, transform: [{ translateY: contentSlide }] },
                    ]}>
                    {slide.visual}

                    <Text className="mb-2.5 text-center text-2xl font-extrabold leading-8 text-white">{slide.title}</Text>
                    <Text className="px-3 text-center text-sm leading-[21px] text-[rgba(255,255,255,0.5)]">{slide.body}</Text>
                </Animated.View>

                {/* Next / Let's Go button */}
                <Pressable
                    onPress={() => {
                        if (isLast) { onDismiss(); }
                        else { animateToNextStep(step + 1); }
                    }}
                    className="mt-5 items-center rounded-[14px] bg-[#ff2d78] py-4"
                    style={({ pressed }) => [
                        pressed && { opacity: 0.85 },
                    ]}>
                    <Text className="text-base font-extrabold tracking-[1.5px] text-white">
                        {isLast ? "LET'S GO!" : 'NEXT'}
                    </Text>
                </Pressable>
            </Animated.View>
        </Modal>
    );
}

/* ─── Main View ─── */
const MainView = () => {
    const navigation = useNavigation<any>();
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
        showGameOverModal,
        showWinModal,
        mergedCells,
        newTileCells,
        powerActionCells,
        powerAnimationTick,
        mergeAnimationTick,
        spawnAnimationTick,
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
    } = useMainViewModel();

    const mergedCellSet = useMemo(() => new Set(mergedCells), [mergedCells]);
    const newTileCellSet = useMemo(() => new Set(newTileCells), [newTileCells]);
    const powerActionCellSet = useMemo(() => new Set(powerActionCells), [powerActionCells]);

    return (
        <View className="flex-1 items-center justify-between bg-[#080c18] px-5 pt-4">
            {/* Header */}
            <View className="mb-2 w-full max-w-[400px]">
                <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-5xl font-black tracking-[2px] text-[#00e5ff]">2048</Text>
                    <CoinCounter coins={coins} coinsAdded={coinsAdded} coinsBumpTick={coinsBumpTick} />
                </View>

                <View className="flex-row justify-between">
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
                <View
                    className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(15,20,45,0.9)]"
                    style={{ width: BOARD_WIDTH, padding: BOARD_PADDING }}>
                    {board.map((row, rowIndex) => (
                        <View key={rowIndex} className="flex-row justify-center">
                            {row.map((cell, colIndex) => {
                                const key = `${rowIndex}-${colIndex}`;
                                return (
                                    <Tile
                                        key={key}
                                        value={cell}
                                        isMerged={mergedCellSet.has(key)}
                                        isNew={newTileCellSet.has(key)}
                                        isSelectable={activePowerMode != null && cell > 0}
                                        isPowerAction={powerActionCellSet.has(key)}
                                        activePowerMode={activePowerMode}
                                        powerAnimationTick={powerAnimationTick}
                                        mergeAnimationTick={mergeAnimationTick}
                                        spawnAnimationTick={spawnAnimationTick}
                                        onPress={() => selectPowerTile(rowIndex, colIndex)}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>
            </GestureDetector>

            {/* Power Buttons */}
            <View className="mt-3 w-full items-center">
                <View className="flex-row items-center">
                    <View style={{ marginRight: 56 }}>
                        <PowerButton
                            label="Destroy"
                            icon="hammer"
                            uses={destroyUses}
                            color={COLORS.magenta}
                            active={activePowerMode === 'destroy'}
                            onPress={activateDestroyMode}
                        />
                    </View>
                    <View>
                        <PowerButton
                            label="Blast"
                            icon="wand-sparkles"
                            uses={blastUses}
                            color={'#00e5ff'}
                            active={activePowerMode === 'blast'}
                            onPress={activateBlastMode}
                        />
                    </View>
                </View>
                {activePowerMode && (
                    <View className="mt-2 flex-row items-center gap-3">
                        <Text className="text-xs font-bold tracking-[1px]" style={{ color: activePowerMode === 'destroy' ? COLORS.pink : COLORS.cyan }}>
                            {activePowerMode === 'destroy' ? 'Select a tile to destroy' : 'Select a number to blast'}
                        </Text>
                        <Pressable onPress={cancelPowerMode} hitSlop={10}>
                            <Text className="text-xs font-extrabold text-[rgba(255,255,255,0.62)]">Cancel</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            <Footer
                canUndo={canUndo}
                onUndo={undoMove}
                onRetry={retryGame}
                onHelp={() => navigation.navigate('Tutorial', { startAtPractice: true })}
                onShop={openPowerShop}
            />

            {/* High Score Banner */}
            <HighScoreBanner visible={showHighScoreAnimation} />

            <PowerPurchaseModal
                pendingPower={pendingPurchasePower}
                destroyCost={destroyPowerCost}
                blastCost={blastPowerCost}
                onBuyDestroy={buyDestroyPower}
                onBuyBlast={buyBlastPower}
                onCancel={closePowerModal}
            />

            <InfoModal visible={showInsufficientCoinsModal} onClose={closePowerModal} />

            {/* Win Modal */}
            <Modal
                visible={showWinModal}
                animationType="fade"
                transparent
                statusBarTranslucent
                onRequestClose={keepPlaying}>
                <View className="flex-1 items-center justify-center bg-[rgba(8,12,24,0.88)] px-6">
                    <View
                        className="w-full max-w-[320px] items-center rounded-[20px] border border-[rgba(255,255,255,0.10)] bg-[rgba(20,25,50,0.95)] px-7 py-8"
                        style={{
                            elevation: 12,
                            shadowColor: COLORS.cyan,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.2,
                            shadowRadius: 20,
                        }}>
                        <Text className="mb-2.5 text-[52px]">🎉</Text>
                        <Text className="mb-1.5 text-3xl font-extrabold text-white">You Win!</Text>
                        <Text className="mb-1 text-[15px] text-[rgba(255,255,255,0.5)]">
                            You reached the 2048 tile!
                        </Text>
                        <Text className="mb-1 text-xl font-bold text-[#00e5ff]">Score: {score}</Text>
                        <View className="mt-4 flex-row gap-3">
                            <Pressable
                                className="items-center rounded-xl border-[1.5px] border-[rgba(255,255,255,0.14)] px-5 py-3"
                                onPress={keepPlaying}>
                                <Text className="text-[15px] font-bold text-white">Keep Playing</Text>
                            </Pressable>
                            <Pressable
                                className="mt-3 min-w-[120px] items-center rounded-xl bg-[#ff2d78] px-5 py-3"
                                onPress={retryGame}>
                                <Text className="text-[15px] font-bold text-white">New Game</Text>
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
                <View className="flex-1 items-center justify-center bg-[rgba(8,12,24,0.88)] px-6">
                    <View
                        className="w-full max-w-[320px] items-center rounded-[20px] border border-[rgba(255,255,255,0.10)] bg-[rgba(20,25,50,0.95)] px-7 py-8"
                        style={{
                            elevation: 12,
                            shadowColor: COLORS.cyan,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.2,
                            shadowRadius: 20,
                        }}>
                        <Text className="mb-2.5 text-[52px]">😔</Text>
                        <Text className="mb-1.5 text-3xl font-extrabold text-white">Game Over</Text>
                        <Text className="mb-1 text-xl font-bold text-[#00e5ff]">Score: {score}</Text>
                        {score === bestScore && score > 0 && (
                            <Text className="mb-2 text-sm font-semibold text-[#ffd740]">
                                That's your best score!
                            </Text>
                        )}
                        <Pressable
                            className="mt-3 min-w-[120px] items-center rounded-xl bg-[#ff2d78] px-5 py-3"
                            onPress={retryGame}>
                            <Text className="text-[15px] font-bold text-white">Try Again</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

/* ═══ Tutorial Styles ═══ */
/* ═══ Main Styles ═══ */
export default MainView;
