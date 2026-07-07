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
import { GRADIENTS, PALETTE, cardShadow, glowShadow, gradientBg } from './theme';
import GlassCard from './components/GlassCard';
import { GhostButton, GradientButton } from './components/GradientButton';

const GRID_SIZE = 4;
const BOARD_PADDING = 10;
const TILE_MARGIN = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 380);
const TILE_SIZE =
    (BOARD_WIDTH - BOARD_PADDING * 2 - TILE_MARGIN * 2 * GRID_SIZE) / GRID_SIZE;

export const COLORS = {
    bg: PALETTE.bg,
    boardBg: PALETTE.surface,
    emptyCell: 'rgba(255,255,255,0.04)',
    emptyCellBorder: 'rgba(255,255,255,0.07)',
    sapphire: PALETTE.sapphire,
    emerald: PALETTE.emerald,
    ruby: PALETTE.ruby,
    amethyst: PALETTE.amethyst,
    gold: PALETTE.gold,
    white: '#ffffff',
    dim: PALETTE.textSecondary,
    cardBg: PALETTE.glassBg,
    cardBorder: PALETTE.glassBorder,
    btnBg: 'rgba(255,255,255,0.07)',
    btnBorder: 'rgba(255,255,255,0.14)',
};

const TILE_STYLES: Record<number, { gradient: string; text: string; border: string; glow: string }> = {
    2: { gradient: GRADIENTS.tile2, text: '#CBD5E1', border: 'rgba(255,255,255,0.10)', glow: '#1E293B' },
    4: { gradient: GRADIENTS.tile4, text: '#E2E8F0', border: 'rgba(255,255,255,0.12)', glow: '#2D3748' },
    8: { gradient: GRADIENTS.tile8, text: '#F1F5F9', border: 'rgba(255,255,255,0.14)', glow: '#3B4A63' },
    16: { gradient: GRADIENTS.tile16, text: '#FFFFFF', border: 'rgba(255,255,255,0.16)', glow: '#4A5D7A' },
    32: { gradient: GRADIENTS.tile32, text: '#FFF7E8', border: 'rgba(255,255,255,0.18)', glow: '#6B5B45' },
    64: { gradient: GRADIENTS.tile64, text: '#FFF3D6', border: 'rgba(255,255,255,0.22)', glow: '#8C6A2F' },
    128: { gradient: GRADIENTS.tile128, text: '#2A1B00', border: 'rgba(255,255,255,0.3)', glow: PALETTE.goldDeep },
    256: { gradient: GRADIENTS.tile256, text: '#2A1B00', border: 'rgba(255,255,255,0.32)', glow: PALETTE.goldDeep },
    512: { gradient: GRADIENTS.tile512, text: '#241900', border: 'rgba(255,255,255,0.36)', glow: PALETTE.gold },
    1024: { gradient: GRADIENTS.tile1024, text: '#241900', border: 'rgba(255,255,255,0.4)', glow: PALETTE.gold },
    2048: { gradient: GRADIENTS.tile2048, text: '#241900', border: 'rgba(255,255,255,0.5)', glow: PALETTE.goldBright },
    4096: { gradient: GRADIENTS.tileHigh, text: '#3A2600', border: 'rgba(255,255,255,0.55)', glow: PALETTE.goldBright },
    8192: { gradient: GRADIENTS.tileHigh, text: '#3A2600', border: 'rgba(255,255,255,0.55)', glow: PALETTE.goldBright },
};

function getTileStyle(value: number) {
    return TILE_STYLES[value] ?? { gradient: GRADIENTS.tileHigh, text: '#3A2600', border: 'rgba(255,255,255,0.55)', glow: PALETTE.goldBright };
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
    const mergeScale = useRef(new Animated.Value(1)).current;
    const mergeGlowOpacity = useRef(new Animated.Value(0)).current;
    const mergeGlowScale = useRef(new Animated.Value(0.78)).current;
    const mergeValueLift = useRef(new Animated.Value(0)).current;
    const powerScale = useRef(new Animated.Value(1)).current;
    const powerOpacity = useRef(new Animated.Value(1)).current;
    const shake = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isMerged || value === 0) { return; }
        mergeScale.stopAnimation();
        mergeGlowOpacity.stopAnimation();
        mergeGlowScale.stopAnimation();
        mergeValueLift.stopAnimation();
        mergeScale.setValue(0.96);
        mergeGlowOpacity.setValue(0);
        mergeGlowScale.setValue(0.78);
        mergeValueLift.setValue(0);
        Animated.parallel([
            Animated.sequence([
                Animated.timing(mergeScale, {
                    toValue: 1.2,
                    duration: 85,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(mergeScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 180,
                    useNativeDriver: true,
                }),
            ]),
            Animated.sequence([
                Animated.timing(mergeGlowOpacity, {
                    toValue: value >= 128 ? 0.75 : 0.52,
                    duration: 55,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(mergeGlowOpacity, {
                    toValue: 0,
                    duration: 240,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(mergeGlowScale, {
                toValue: 1.48,
                duration: 295,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(mergeValueLift, {
                    toValue: -4,
                    duration: 80,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.spring(mergeValueLift, {
                    toValue: 0,
                    friction: 5,
                    tension: 150,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            mergeScale.setValue(1);
            mergeGlowOpacity.setValue(0);
            mergeGlowScale.setValue(0.78);
            mergeValueLift.setValue(0);
        });
    }, [isMerged, mergeAnimationTick, mergeGlowOpacity, mergeGlowScale, mergeScale, mergeValueLift, value]);

    useEffect(() => {
        if (value > 0) { return; }
        mergeScale.setValue(1);
        mergeGlowOpacity.setValue(0);
        mergeGlowScale.setValue(0.78);
        mergeValueLift.setValue(0);
    }, [mergeGlowOpacity, mergeGlowScale, mergeScale, mergeValueLift, value]);

    useEffect(() => {
        if (!_isNew || value === 0 || isMerged) { return; }
        mergeScale.stopAnimation();
        mergeScale.setValue(0.72);
        Animated.spring(mergeScale, {
                toValue: 1,
                friction: 5,
                tension: 140,
                useNativeDriver: true,
        }).start();
    }, [_isNew, isMerged, mergeScale, value]);

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
            className="items-center justify-center overflow-hidden rounded-[16px]"
            style={[
                value === 0
                    ? { backgroundColor: COLORS.emptyCell }
                    : gradientBg(colors.gradient),
                {
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    margin: TILE_MARGIN,
                    borderColor: isSelectable ? (activePowerMode === 'destroy' ? COLORS.ruby : COLORS.sapphire) : (value === 0 ? COLORS.emptyCellBorder : colors.border),
                    borderWidth: isSelectable ? 2 : value > 0 ? 1 : 1,
                    opacity: isPowerAction ? powerOpacity : 1,
                    shadowColor: isSelectable ? (activePowerMode === 'destroy' ? COLORS.ruby : COLORS.sapphire) : colors.glow,
                    shadowOffset: { width: 0, height: value > 0 ? 3 : 0 },
                    shadowOpacity: isSelectable ? 0.6 : value > 0 ? 0.45 : 0,
                    shadowRadius: isSelectable ? 12 : value > 0 ? 8 : 0,
                    elevation: isSelectable ? 8 : value > 0 ? 5 : 0,
                    transform: [
                        { translateX: isPowerAction ? shake : 0 },
                        { scale: isPowerAction ? powerScale : value > 0 ? mergeScale : 1 },
                    ],
                },
            ]}>
            {isMerged && value > 0 && (
                <Animated.View
                    pointerEvents="none"
                    className="absolute rounded-[16px] border-2"
                    style={{
                        width: TILE_SIZE * 0.92,
                        height: TILE_SIZE * 0.92,
                        borderColor: value >= 128 ? COLORS.gold : 'rgba(255,255,255,0.7)',
                        backgroundColor: value >= 128 ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.14)',
                        opacity: mergeGlowOpacity,
                        transform: [{ scale: mergeGlowScale }],
                    }}
                />
            )}
            {isSelectable && (
                <View
                    className="absolute inset-0 rounded-[16px]"
                    style={{
                        backgroundColor: activePowerMode === 'destroy'
                            ? 'rgba(225,29,72,0.14)'
                            : 'rgba(59,130,246,0.14)',
                    }}
                />
            )}
            {isPowerAction && (
                <Animated.View
                    className="absolute rounded-full border-2"
                    style={{
                        width: TILE_SIZE * 0.94,
                        height: TILE_SIZE * 0.94,
                        borderColor: activePowerMode === 'destroy' ? COLORS.ruby : COLORS.gold,
                        opacity: powerOpacity,
                        transform: [{ scale: powerScale }],
                    }}
                />
            )}
            {value > 0 && (
                <Animated.Text
                    className="font-extrabold"
                    style={[
                        {
                            color: colors.text,
                            fontSize: getTileFontSize(value),
                            transform: [{ translateY: mergeValueLift }],
                        },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {value}
                </Animated.Text>
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
                className="items-center overflow-hidden rounded-[28px] border-[1.5px] border-[rgba(255,255,255,0.4)] px-11 py-8"
                style={[
                    gradientBg(GRADIENTS.gold),
                    {
                        transform: [{ scale }],
                        opacity,
                        elevation: 14,
                        shadowColor: COLORS.gold,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.5,
                        shadowRadius: 24,
                    },
                ]}>
                <Text className="mb-2 text-5xl">🏆</Text>
                <Text className="text-[26px] font-black tracking-[0.5px] text-[#241900]">New High Score!</Text>
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
    const labelColor = label === 'SCORE' ? COLORS.ruby : COLORS.sapphire;

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
        <View
            className="relative flex-1 items-center overflow-hidden rounded-[18px] border px-3 py-3"
            style={[{ backgroundColor: PALETTE.glassBg, borderColor: PALETTE.glassBorder }, cardShadow('#000', 0.3, 10)]}>
            <View
                className="rounded-full px-3 py-0.5"
                style={{ backgroundColor: `${labelColor}22` }}>
                <Text className="text-[11px] font-black tracking-[2px]" style={{ color: labelColor }}>{label}</Text>
            </View>
            <Animated.Text
                className="mt-1 text-[32px] font-black text-white"
                style={[
                    { transform: [{ scale: bumpScale }] },
                ]}>
                {score}
            </Animated.Text>
            {showAdded && scoreAdded != null && scoreAdded > 0 && (
                <Animated.Text
                    className="absolute right-3 top-2 text-base font-extrabold text-[#34D399]"
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
            className="relative self-center overflow-hidden rounded-full border-[1.5px] border-[rgba(255,255,255,0.4)] px-4 py-2"
            style={[gradientBg(GRADIENTS.gold), glowShadow(COLORS.gold, 0.35, 12)]}>
            <Animated.View
                className="flex-row items-center gap-2"
                style={{ transform: [{ scale }] }}>
                <FontAwesome6 name="coins" iconStyle="solid" size={16} color="#241900" />
                <Text className="text-[16px] font-black text-[#241900]">{coins}</Text>
            </Animated.View>
            {showAdded && (
                <Animated.Text
                    className="absolute right-2 top-0 text-xs font-extrabold text-[#065F46]"
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
    const color = isDestroy ? COLORS.ruby : COLORS.sapphire;
    const gradient = isDestroy ? GRADIENTS.ruby : GRADIENTS.sapphire;
    const shopItems = [
        { title: 'Destroy', icon: 'hammer', cost: destroyCost, color: COLORS.ruby, gradient: GRADIENTS.ruby, onPress: onBuyDestroy },
        { title: 'Blast', icon: 'wand-sparkles', cost: blastCost, color: COLORS.sapphire, gradient: GRADIENTS.sapphire, onPress: onBuyBlast },
    ] as const;

    return (
        <Modal
            visible={pendingPower != null}
            animationType="fade"
            transparent
            statusBarTranslucent
            onRequestClose={onCancel}>
            <View className="flex-1 items-center justify-center bg-[rgba(2,2,2,0.86)] px-6">
                <GlassCard glowColor={isShop ? COLORS.gold : color}>
                    {isShop ? (
                        <>
                            <Text className="mb-5 text-[26px] font-black text-white">Power Shop</Text>
                            <View className="w-full flex-row justify-center" style={{ columnGap: 44 }}>
                                {shopItems.map(item => (
                                    <Pressable
                                        key={item.title}
                                        className="items-center justify-center"
                                        style={({ pressed }) => [
                                            { transform: [{ scale: pressed ? 0.94 : 1 }] },
                                        ]}
                                        onPress={item.onPress}>
                                        <View
                                            className="overflow-hidden rounded-full border-[1.5px] border-[rgba(255,255,255,0.4)] p-4"
                                            style={[gradientBg(item.gradient), glowShadow(item.color, 0.4, 12)]}>
                                            <Lucide name={item.icon} size={24} color="#ffffff" />
                                        </View>
                                        <Text className="mt-2.5 text-center text-[14px] font-extrabold text-white">{item.title}</Text>
                                        <Text className="mt-1 text-[13px] font-extrabold" style={{ color: PALETTE.gold }}>{item.cost} coins</Text>
                                    </Pressable>
                                ))}
                            </View>
                            <GhostButton label="Cancel" onPress={onCancel} style={{ marginTop: 22 }} />
                        </>
                    ) : (
                        <>
                            <View
                                className="mb-3 overflow-hidden rounded-full border-[1.5px] border-[rgba(255,255,255,0.4)] p-4"
                                style={[gradientBg(gradient), glowShadow(color, 0.4, 14)]}>
                                <Lucide name={isDestroy ? 'hammer' : 'wand-sparkles'} size={24} color="#ffffff" />
                            </View>
                            <Text className="mb-1.5 text-[26px] font-black text-white">Recharge Power?</Text>
                            <Text className="mb-2 text-[16px] font-bold" style={{ color }}>{title}</Text>
                            <Text className="mb-5 text-xl font-extrabold" style={{ color: PALETTE.gold }}>Cost: {cost} coins</Text>
                            <View className="flex-row gap-3">
                                <GradientButton
                                    label="Buy"
                                    gradient={gradient}
                                    textColor="#ffffff"
                                    glowColor={color}
                                    onPress={isDestroy ? onBuyDestroy : onBuyBlast}
                                />
                                <GhostButton label="Cancel" onPress={onCancel} />
                            </View>
                        </>
                    )}
                </GlassCard>
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
            <View className="flex-1 items-center justify-center bg-[rgba(2,2,2,0.86)] px-6">
                <GlassCard glowColor={COLORS.gold}>
                    <View
                        className="mb-3 overflow-hidden rounded-full border-[1.5px] border-[rgba(255,255,255,0.4)] p-4"
                        style={[gradientBg(GRADIENTS.gold), glowShadow(COLORS.gold, 0.4, 14)]}>
                        <FontAwesome6 name="coins" iconStyle="solid" size={32} color="#241900" />
                    </View>
                    <Text className="mb-2 text-[26px] font-black text-white">Not Enough Coins</Text>
                    <Text className="mb-5 text-center text-[15px] leading-5 text-[rgba(255,255,255,0.58)]">
                        Merge bigger tiles to earn coins.
                    </Text>
                    <GradientButton label="OK" onPress={onClose} />
                </GlassCard>
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
            className="m-0.5 items-center justify-center overflow-hidden rounded-lg"
            style={[
                value === 0 ? { backgroundColor: COLORS.emptyCell } : gradientBg(colors.gradient),
                {
                    width: size,
                    height: size,
                    borderWidth: value > 0 ? 1 : 1,
                    borderColor: value === 0 ? COLORS.emptyCellBorder : colors.border,
                },
            ]}>
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
            <Text className="mt-1 text-xs font-semibold" style={{ color: PALETTE.gold }}>
                +{scoreGain} points!
            </Text>
        </View>
    );
}

/* ─── Pro Tip Card ─── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <View
            className="mt-3.5 w-full max-w-[400px] rounded-[16px] border p-4"
            style={{ borderColor: PALETTE.glassBorder, backgroundColor: PALETTE.glassBg }}>
            <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[15px] font-extrabold italic" style={{ color: PALETTE.ruby }}>Pro Tip</Text>
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
                    <View className="rounded-xl p-1.5" style={{ backgroundColor: PALETTE.surface }}>
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
                        <View className="ml-1 h-[3px] w-20 rounded-sm" style={{ backgroundColor: PALETTE.gold }} />
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
                className="flex-1 bg-[rgba(2,2,2,0.97)] px-6 pb-8 pt-12"
                style={{ opacity: backdropOpacity }}>
                {/* Header */}
                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-4xl font-black" style={{ color: PALETTE.gold }}>2048</Text>
                    <Pressable onPress={onDismiss} hitSlop={16}>
                        <Text className="text-[15px] font-semibold tracking-[1px] text-white">SKIP</Text>
                    </Pressable>
                </View>

                {/* Step indicator */}
                <View className="mb-5 flex-row justify-center gap-1.5">
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            className="h-1 w-7 rounded-sm"
                            style={{ backgroundColor: i === step ? PALETTE.gold : 'rgba(255,255,255,0.15)' }}
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
                    className="mt-5 items-center rounded-[18px] py-4"
                    style={({ pressed }) => [
                        { backgroundColor: PALETTE.gold },
                        pressed && { opacity: 0.85 },
                    ]}>
                    <Text className="text-base font-extrabold tracking-[1.5px]" style={{ color: '#241900' }}>
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
        <View className="flex-1 items-center justify-between px-5 pt-4">
            {/* Header */}
            <View className="mb-2 w-full max-w-[400px]">
                <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-baseline">
                        <Text
                            className="text-5xl font-black tracking-[1px]"
                            style={{
                                color: PALETTE.gold,
                                textShadowColor: 'rgba(212,175,55,0.45)',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 16,
                            }}>
                            2048
                        </Text>
                        <View className="ml-2 mb-1.5 rounded-full px-2 py-0.5" style={{ backgroundColor: PALETTE.glassBg, borderWidth: 1, borderColor: PALETTE.glassBorder }}>
                            <Text className="text-[9px] font-black tracking-[1.5px]" style={{ color: PALETTE.dim }}>PRO</Text>
                        </View>
                    </View>
                    <CoinCounter coins={coins} coinsAdded={coinsAdded} coinsBumpTick={coinsBumpTick} />
                </View>

                <View className="flex-row justify-between gap-3">
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
                    className="overflow-hidden rounded-[24px] border-[1.5px]"
                    style={[
                        gradientBg(GRADIENTS.boardBg),
                        { width: BOARD_WIDTH, padding: BOARD_PADDING, borderColor: PALETTE.border },
                        cardShadow('#000000', 0.4, 20),
                    ]}>
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
                            color={COLORS.ruby}
                            gradient={GRADIENTS.ruby}
                            active={activePowerMode === 'destroy'}
                            onPress={activateDestroyMode}
                        />
                    </View>
                    <View>
                        <PowerButton
                            label="Blast"
                            icon="wand-sparkles"
                            uses={blastUses}
                            color={COLORS.sapphire}
                            gradient={GRADIENTS.sapphire}
                            active={activePowerMode === 'blast'}
                            onPress={activateBlastMode}
                        />
                    </View>
                </View>
                {activePowerMode && (
                    <View className="mt-2 flex-row items-center gap-3">
                        <Text className="text-xs font-bold tracking-[1px]" style={{ color: activePowerMode === 'destroy' ? COLORS.ruby : COLORS.sapphire }}>
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
                <View className="flex-1 items-center justify-center bg-[rgba(2,2,2,0.86)] px-6">
                    <GlassCard glowColor={COLORS.gold}>
                        <Text className="mb-2.5 text-[52px]">🎉</Text>
                        <Text className="mb-1.5 text-[28px] font-black text-white">You Win!</Text>
                        <Text className="mb-1 text-[15px] text-[rgba(255,255,255,0.5)]">
                            You reached the 2048 tile!
                        </Text>
                        <Text className="mb-1 text-xl font-bold" style={{ color: PALETTE.sapphire }}>Score: {score}</Text>
                        <View className="mt-4 flex-row gap-3">
                            <GhostButton label="Keep Playing" onPress={keepPlaying} />
                            <GradientButton label="New Game" gradient={GRADIENTS.ruby} textColor="#ffffff" glowColor={COLORS.ruby} onPress={retryGame} />
                        </View>
                    </GlassCard>
                </View>
            </Modal>

            {/* Game Over Modal */}
            <Modal
                visible={showGameOverModal}
                animationType="fade"
                transparent
                statusBarTranslucent
                onRequestClose={() => { }}>
                <View className="flex-1 items-center justify-center bg-[rgba(2,2,2,0.86)] px-6">
                    <GlassCard glowColor={COLORS.ruby}>
                        <Text className="mb-2.5 text-[52px]">😔</Text>
                        <Text className="mb-1.5 text-[28px] font-black text-white">Game Over</Text>
                        <Text className="mb-1 text-xl font-bold" style={{ color: PALETTE.sapphire }}>Score: {score}</Text>
                        {score === bestScore && score > 0 && (
                            <Text className="mb-2 text-sm font-semibold" style={{ color: PALETTE.gold }}>
                                That's your best score!
                            </Text>
                        )}
                        <View className="mt-3">
                            <GradientButton label="Try Again" gradient={GRADIENTS.ruby} textColor="#ffffff" glowColor={COLORS.ruby} onPress={retryGame} />
                        </View>
                    </GlassCard>
                </View>
            </Modal>

        </View>
    );
};

/* ═══ Tutorial Styles ═══ */
/* ═══ Main Styles ═══ */
export default MainView;
