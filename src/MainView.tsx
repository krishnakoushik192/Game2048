import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useMainViewModel } from './MianViewModel';

const GRID_SIZE = 4;
const BOARD_PADDING = 8;
const TILE_MARGIN = 6;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = SCREEN_WIDTH - 40;
const TILE_SIZE =
    (BOARD_WIDTH - BOARD_PADDING * 2 - TILE_MARGIN * 2 * GRID_SIZE) / GRID_SIZE;

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
    0: { bg: '#b0c4de', text: 'transparent' },
    2: { bg: '#dce8f5', text: '#2c4a6e' },
    4: { bg: '#a8c8f0', text: '#1a3a5c' },
    8: { bg: '#93b8e0', text: '#f0f6ff' },
    16: { bg: '#6a9fd4', text: '#f0f6ff' },
    32: { bg: '#4a87c8', text: '#f0f6ff' },
    64: { bg: '#2e6fbc', text: '#f0f6ff' },
    128: { bg: '#1a56a0', text: '#f0f6ff' },
    256: { bg: '#154490', text: '#f0f6ff' },
    512: { bg: '#0f3278', text: '#f0f6ff' },
    1024: { bg: '#0a2260', text: '#f0f6ff' },
    2048: { bg: '#051248', text: '#f0f6ff' },
};

function getTileStyle(value: number) {
    return TILE_COLORS[value] ?? { bg: '#020c30', text: '#f0f6ff' };
}

function getTileFontSize(value: number) {
    if (value < 100) return 36;
    if (value < 1000) return 28;
    return 22;
}

function Tile({
    value,
    isMerged,
    mergeAnimationTick,
}: {
    value: number;
    isMerged: boolean;
    mergeAnimationTick: number;
}) {
    const colors = getTileStyle(value);
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isMerged || value === 0) {
            return;
        }
        scale.setValue(1);
        Animated.sequence([
            Animated.timing(scale, {
                toValue: 1.15,
                duration: 90,
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
                { backgroundColor: colors.bg, transform: [{ scale }] },
            ]}>
            {value > 0 && (
                <Text
                    style={[
                        styles.tileText,
                        { color: colors.text, fontSize: getTileFontSize(value) },
                    ]}>
                    {value}
                </Text>
            )}
        </Animated.View>
    );
}

function ScoreBox({ label, score }: { label: string; score: number }) {
    return (
        <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>{label}</Text>
            <Text style={styles.scoreValue}>{score}</Text>
        </View>
    );
}

const MainView = () => {
    const { board, score, bestScore, mergedCells, mergeAnimationTick, gesture } =
        useMainViewModel();
    const mergedCellSet = useMemo(() => new Set(mergedCells), [mergedCells]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>2048</Text>
                <View style={styles.scoresRow}>
                    <ScoreBox label="SCORE" score={score} />
                    <ScoreBox label="BEST" score={bestScore} />
                </View>
            </View>

            {/* <View style={styles.subHeader}>
        <Text style={styles.tagline}>
          Join the numbers and get to the{' '}
          <Text style={styles.taglineBold}>2048 tile!</Text>
        </Text>
        <TouchableOpacity style={styles.newGameButton} activeOpacity={0.7}>
          <Text style={styles.newGameText}>New Game</Text>
        </TouchableOpacity>
      </View> */}

            <GestureDetector gesture={gesture}>
                <View style={styles.board}>
                    {board.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            {row.map((cell, colIndex) => (
                                <Tile
                                    key={`${rowIndex}-${colIndex}`}
                                    value={cell}
                                    isMerged={mergedCellSet.has(`${rowIndex}-${colIndex}`)}
                                    mergeAnimationTick={mergeAnimationTick}
                                />
                            ))}
                        </View>
                    ))}
                </View>
            </GestureDetector>

            <Text style={styles.instructions}>
                Swipe to move the tiles. When two tiles with the same number touch, they
                merge into one!
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8f0fb',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        justifyContent: 'space-between',
    },
    header: {
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 64,
        fontWeight: '800',
        color: '#1a4a8a',
    },
    scoresRow: {
        flexDirection: 'row',
        gap: 8,
    },
    scoreBox: {
        backgroundColor: '#3a6fbc',
        borderRadius: 6,
        paddingHorizontal: 20,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#c5daf5',
        letterSpacing: 1,
    },
    scoreValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 2,
    },
    subHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    tagline: {
        fontSize: 15,
        color: '#2c4a6e',
        flex: 1,
        marginRight: 12,
    },
    taglineBold: {
        fontWeight: '700',
    },
    newGameButton: {
        backgroundColor: '#2e6fbc',
        borderRadius: 6,
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    newGameText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#f0f6ff',
    },
    board: {
        width: BOARD_WIDTH,
        backgroundColor: '#4a7fc1',
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
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileText: {
        fontWeight: '800',
    },
    instructions: {
        marginTop: 20,
        fontSize: 14,
        color: '#2c4a6e',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
    },
});

export default MainView;
