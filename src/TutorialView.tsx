import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Pressable,
    Text,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { RootStackParamList, TUTORIAL_SEEN_KEY } from './navigation';
import { GRADIENTS, PALETTE, cardShadow, gradientBg } from './theme';
import AmbientGlow from './components/AmbientGlow';
import { GhostButton, GradientButton } from './components/GradientButton';

type Direction = 'left' | 'right' | 'up' | 'down';
type Props = NativeStackScreenProps<RootStackParamList, 'Tutorial'>;
type IntroStep = 'welcome' | 'new' | 'help';
type LucideIconName = React.ComponentProps<typeof Lucide>['name'];

const GRID_SIZE = 4;
const BOARD_PADDING = 10;
const TILE_MARGIN = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 380);
const TILE_SIZE =
    (BOARD_WIDTH - BOARD_PADDING * 2 - TILE_MARGIN * 2 * GRID_SIZE) / GRID_SIZE;

const EMPTY_CELL = { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)' };

const COLORS: Record<number, { gradient: string; text: string; border: string }> = {
    2: { gradient: GRADIENTS.tile2, text: '#CBD5E1', border: 'rgba(255,255,255,0.10)' },
    4: { gradient: GRADIENTS.tile4, text: '#E2E8F0', border: 'rgba(255,255,255,0.12)' },
    8: { gradient: GRADIENTS.tile8, text: '#F1F5F9', border: 'rgba(255,255,255,0.14)' },
    16: { gradient: GRADIENTS.tile16, text: '#FFFFFF', border: 'rgba(255,255,255,0.16)' },
    32: { gradient: GRADIENTS.tile32, text: '#FFF7E8', border: 'rgba(255,255,255,0.18)' },
};

const INTRO_STEPS: Array<{ key: IntroStep; text: string }> = [
    { key: 'welcome', text: 'Welcome to the Game' },
    { key: 'new', text: 'New to The Game' },
    { key: 'help', text: 'I will Help You to play the game' },
];

const SWIPE_ICONS: Record<Direction, LucideIconName> = {
    left: 'arrow-left',
    right: 'arrow-right',
    up: 'arrow-up',
    down: 'arrow-down',
};

const STEPS: Array<{
    board: number[][];
    afterBoard: number[][];
    expectedDirection: Direction;
    prompt: string;
    mergedCell: string;
    addedCell: string;
}> = [
        {
            board: [
                [0, 0, 0, 0],
                [0, 2, 2, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            afterBoard: [
                [0, 0, 0, 0],
                [4, 0, 0, 0],
                [4, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            expectedDirection: 'left',
            prompt: 'Move left to merge the two 2 tiles.',
            mergedCell: '1-0',
            addedCell: '2-0',
        },
        {
            board: [
                [0, 0, 0, 0],
                [4, 0, 0, 0],
                [4, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            afterBoard: [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [8, 0, 0, 8],
                [0, 0, 0, 0],
            ],
            expectedDirection: 'down',
            prompt: 'Move down to combine the 4 tiles.',
            mergedCell: '3-0',
            addedCell: '2-0',
        },
        {
            board: [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [8, 0, 0, 8],
                [0, 0, 0, 0],
            ],
            afterBoard: [
                [0, 0, 0, 0],
                [0, 0, 0, 16],
                [0, 0, 0, 0],
                [0, 0, 0, 16],
            ],
            expectedDirection: 'right',
            prompt: 'Move right to create a 16 tile.',
            mergedCell: '3-3',
            addedCell: '1-3',
        },
        {
            board: [
                [0, 0, 0, 0],
                [0, 0, 0, 16],
                [0, 0, 0, 0],
                [0, 0, 0, 16],
            ],
            afterBoard: [
                [0, 0, 0, 32],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            expectedDirection: 'up',
            prompt: 'Move up to finish the practice run.',
            mergedCell: '0-3',
            addedCell: '',
        },
    ];

function getTileStyle(value: number) {
    return COLORS[value] ?? { gradient: GRADIENTS.tileHigh, text: '#3A2600', border: 'rgba(255,255,255,0.55)' };
}

function tileFontSize(value: number) {
    if (value < 100) { return TILE_SIZE * 0.45; }
    if (value < 1000) { return TILE_SIZE * 0.36; }
    return TILE_SIZE * 0.28;
}

function TutorialTile({
    value,
    isMerged,
    isNew,
}: {
    value: number;
    isMerged: boolean;
    isNew: boolean;
}) {
    const colors = getTileStyle(value);
    const scale = useRef(new Animated.Value(isNew ? 0.25 : 1)).current;

    useEffect(() => {
        if (value === 0) {
            scale.setValue(1);
            return;
        }
        if (isNew) {
            scale.setValue(0.25);
            Animated.spring(scale, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }).start();
        } else if (isMerged) {
            scale.setValue(1);
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.18,
                    duration: 90,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 110,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isMerged, isNew, scale, value]);

    return (
        <Animated.View
            className="items-center justify-center overflow-hidden rounded-[16px]"
            style={[
                value === 0 ? { backgroundColor: EMPTY_CELL.bg } : gradientBg(colors.gradient),
                {
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    margin: TILE_MARGIN,
                    borderColor: value === 0 ? EMPTY_CELL.border : colors.border,
                    borderWidth: 1,
                    transform: [{ scale }],
                },
            ]}>
            {value > 0 && (
                <Text
                    className="font-extrabold"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ color: colors.text, fontSize: tileFontSize(value) }}>
                    {value}
                </Text>
            )}
        </Animated.View>
    );
}

function TutorialBoard({
    board,
    mergedCell,
    addedCell,
}: {
    board: number[][];
    mergedCell: string;
    addedCell: string;
}) {
    return (
        <View
            className="overflow-hidden rounded-[24px] border-[1.5px]"
            style={[
                gradientBg(GRADIENTS.boardBg),
                { width: BOARD_WIDTH, padding: BOARD_PADDING, borderColor: PALETTE.border },
                cardShadow('#000000', 0.4, 20),
            ]}>
            {board.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row justify-center">
                    {row.map((value, colIndex) => {
                        const key = `${rowIndex}-${colIndex}`;
                        return (
                            <TutorialTile
                                key={key}
                                value={value}
                                isMerged={mergedCell === key}
                                isNew={addedCell === key}
                            />
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

function SwipeNudge({ direction }: { direction: Direction }) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        progress.setValue(0);
        Animated.loop(
            Animated.sequence([
                Animated.timing(progress, {
                    toValue: 1,
                    duration: 650,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(progress, {
                    toValue: 0,
                    duration: 650,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, [direction, progress]);

    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: direction === 'left' ? [24, -24] : direction === 'right' ? [-24, 24] : [0, 0],
    });
    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: direction === 'up' ? [24, -24] : direction === 'down' ? [-24, 24] : [0, 0],
    });

    return (
        <View className="mt-5 items-center">
            <Animated.View
                style={{ transform: [{ translateX }, { translateY }] }}>
                <Lucide name={SWIPE_ICONS[direction]} size={46} color={PALETTE.sapphire} />
            </Animated.View>
            <Text className="text-sm font-extrabold tracking-[2px]" style={{ color: PALETTE.gold }}>
                SWIPE {direction.toUpperCase()}
            </Text>
        </View>
    );
}

export default function TutorialView({ navigation, route }: Props) {
    const startsAtPractice = route.params?.startAtPractice === true;
    const [phase, setPhase] = useState<'introText' | 'practice'>(startsAtPractice ? 'practice' : 'introText');
    const [introIndex, setIntroIndex] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [typingDone, setTypingDone] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [board, setBoard] = useState(STEPS[0].board);
    const [mergedCell, setMergedCell] = useState('');
    const [addedCell, setAddedCell] = useState('');
    const [isAdvancing, setIsAdvancing] = useState(false);
    const fade = useRef(new Animated.Value(0)).current;
    const shake = useRef(new Animated.Value(0)).current;
    const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentStep = STEPS[stepIndex];
    const currentIntroStep = INTRO_STEPS[introIndex];

    useEffect(() => {
        fade.setValue(0);
        Animated.timing(fade, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        }).start();
    }, [fade]);

    useEffect(() => {
        setBoard(currentStep.board);
        setMergedCell('');
        setAddedCell('');
        setIsAdvancing(false);
    }, [currentStep]);

    useEffect(() => {
        if (phase !== 'introText') { return undefined; }

        let startTimer: ReturnType<typeof setTimeout> | null = null;
        let typingTimer: ReturnType<typeof setInterval> | null = null;
        const text = currentIntroStep.text;

        setTypedText('');
        setTypingDone(false);

        startTimer = setTimeout(() => {
            let nextLength = 0;
            typingTimer = setInterval(() => {
                nextLength += 1;
                setTypedText(text.slice(0, nextLength));

                if (nextLength >= text.length && typingTimer) {
                    clearInterval(typingTimer);
                    typingTimer = null;
                    setTypingDone(true);
                }
            }, 55);
        }, introIndex === 0 ? 1000 : 350);

        return () => {
            if (startTimer) { clearTimeout(startTimer); }
            if (typingTimer) { clearInterval(typingTimer); }
        };
    }, [currentIntroStep.text, introIndex, phase]);

    useEffect(() => {
        if (autoAdvanceTimer.current) {
            clearTimeout(autoAdvanceTimer.current);
            autoAdvanceTimer.current = null;
        }

        if (phase !== 'introText' || !typingDone || introIndex >= INTRO_STEPS.length - 1) {
            return undefined;
        }

        autoAdvanceTimer.current = setTimeout(() => {
            setIntroIndex(prev => Math.min(prev + 1, INTRO_STEPS.length - 1));
        }, 2000);

        return () => {
            if (autoAdvanceTimer.current) {
                clearTimeout(autoAdvanceTimer.current);
                autoAdvanceTimer.current = null;
            }
        };
    }, [introIndex, phase, typingDone]);

    const clearAutoAdvance = useCallback(() => {
        if (!autoAdvanceTimer.current) { return; }
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
    }, []);

    const goToGame = useCallback(async () => {
        clearAutoAdvance();
        try {
            await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
        } catch {
            // The tutorial should never block play because persistence failed.
        }
        navigation.replace('Game');
    }, [clearAutoAdvance, navigation]);

    const goBack = useCallback(() => {
        clearAutoAdvance();
        navigation.goBack();
    }, [clearAutoAdvance, navigation]);

    const advanceIntro = useCallback(() => {
        clearAutoAdvance();
        if (introIndex === INTRO_STEPS.length - 1) {
            setPhase('practice');
            return;
        }
        setIntroIndex(prev => prev + 1);
    }, [clearAutoAdvance, introIndex]);

    const showWrongMove = useCallback(() => {
        shake.setValue(0);
        Animated.sequence([
            Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
            Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start();
    }, [shake]);

    const handleMove = useCallback((direction: Direction) => {
        if (isAdvancing) { return; }
        if (direction !== currentStep.expectedDirection) {
            showWrongMove();
            return;
        }

        setIsAdvancing(true);
        setBoard(currentStep.afterBoard);
        setMergedCell(currentStep.mergedCell);
        setAddedCell(currentStep.addedCell);
        setTimeout(() => {
            if (stepIndex === STEPS.length - 1) {
                goToGame();
                return;
            }
            setStepIndex(prev => prev + 1);
        }, 700);
    }, [currentStep, goToGame, isAdvancing, showWrongMove, stepIndex]);

    const flingLeft = useMemo(
        () => Gesture.Fling().runOnJS(true).direction(Directions.LEFT).onEnd(() => handleMove('left')),
        [handleMove],
    );
    const flingRight = useMemo(
        () => Gesture.Fling().runOnJS(true).direction(Directions.RIGHT).onEnd(() => handleMove('right')),
        [handleMove],
    );
    const flingUp = useMemo(
        () => Gesture.Fling().runOnJS(true).direction(Directions.UP).onEnd(() => handleMove('up')),
        [handleMove],
    );
    const flingDown = useMemo(
        () => Gesture.Fling().runOnJS(true).direction(Directions.DOWN).onEnd(() => handleMove('down')),
        [handleMove],
    );
    const tutorialGesture = useMemo(
        () => Gesture.Simultaneous(flingLeft, flingRight, flingUp, flingDown),
        [flingDown, flingLeft, flingRight, flingUp],
    );
    const translateX = shake.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-9, 0, 9],
    });

    return (
        <Animated.View className="flex-1" style={[gradientBg(GRADIENTS.appBg), { opacity: fade }]}>
            <AmbientGlow />
            {startsAtPractice && phase === 'practice' && (
                <Pressable
                    className="absolute left-5 top-10 z-10 h-11 w-11 mt-4 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.07)]"
                    style={({ pressed }) => [pressed && { opacity: 0.72 }]}
                    onPress={goBack}
                    accessibilityLabel="Back"
                    accessibilityRole="button">
                    <Lucide name="arrow-left" size={24} color="#ffffff" />
                </Pressable>
            )}
            {phase === 'introText' ? (
                <View className="flex-1 items-center justify-center px-7">
                    <View className="w-full max-w-[390px] items-center justify-center" style={{ minHeight: 150 }}>
                        <Text
                            className="text-center text-[44px] font-black leading-[54px] text-white"
                            adjustsFontSizeToFit
                            numberOfLines={3}>
                            {typedText}
                        </Text>
                    </View>

                    {typingDone && (
                        <View className="absolute bottom-9 w-full max-w-[390px] px-7">
                            {currentIntroStep.key === 'help' ? (
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <GhostButton label="Skip" onPress={goToGame} style={{ width: '100%' }} />
                                    </View>
                                    <View className="flex-1">
                                        <GradientButton label="Next" onPress={advanceIntro} style={{ width: '100%' }} />
                                    </View>
                                </View>
                            ) : (
                                <GradientButton label="Next" onPress={advanceIntro} style={{ width: '100%' }} />
                            )}
                        </View>
                    )}
                </View>
            ) : (
                <View className="flex-1 items-center justify-center px-5">
                    <Text className="mb-3 text-center text-3xl font-black" style={{ color: PALETTE.sapphire }}>
                        Practice Move
                    </Text>
                    <Text className="mb-5 text-center text-base font-semibold leading-6 text-white">
                        {currentStep.prompt}
                    </Text>
                    <GestureDetector gesture={tutorialGesture}>
                        <Animated.View style={{ transform: [{ translateX }] }}>
                            <TutorialBoard
                                board={board}
                                mergedCell={mergedCell}
                                addedCell={addedCell}
                            />
                        </Animated.View>
                    </GestureDetector>
                    <SwipeNudge direction={currentStep.expectedDirection} />
                    <Text className="mt-5 text-xs font-semibold text-[rgba(255,255,255,0.45)]">
                        Step {stepIndex + 1} of {STEPS.length}
                    </Text>
                </View>
            )}
        </Animated.View>
    );
}
