import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const GRID_SIZE = 4;
const BOARD_PADDING = 8;
const TILE_MARGIN = 6;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = SCREEN_WIDTH - 40;
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
};

const SAMPLE_BOARD: number[][] = [
    [2, 0, 4, 0],
    [0, 16, 0, 2],
    [8, 0, 128, 4],
    [0, 2, 0, 32],
];

function getTileStyle(value: number) {
    return TILE_COLORS[value] ?? { bg: '#3c3a32', text: '#f9f6f2' };
}

function getTileFontSize(value: number) {
    if (value < 100) return 36;
    if (value < 1000) return 28;
    return 22;
}

function Tile({ value }: { value: number }) {
    const colors = getTileStyle(value);
    return (
        <View style={[styles.tile, { backgroundColor: colors.bg }]}>
            {value > 0 && (
                <Text
                    style={[
                        styles.tileText,
                        { color: colors.text, fontSize: getTileFontSize(value) },
                    ]}>
                    {value}
                </Text>
            )}
        </View>
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
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>2048</Text>
                <View style={styles.scoresRow}>
                    <ScoreBox label="SCORE" score={1284} />
                    <ScoreBox label="BEST" score={5720} />
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

            <View style={styles.board}>
                {SAMPLE_BOARD.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((cell, colIndex) => (
                            <Tile key={`${rowIndex}-${colIndex}`} value={cell} />
                        ))}
                    </View>
                ))}
            </View>

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
        backgroundColor: '#faf8ef',
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
        color: '#776e65',
    },
    scoresRow: {
        flexDirection: 'row',
        gap: 8,
    },
    scoreBox: {
        backgroundColor: '#bbada0',
        borderRadius: 6,
        paddingHorizontal: 20,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#eee4da',
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
        color: '#776e65',
        flex: 1,
        marginRight: 12,
    },
    taglineBold: {
        fontWeight: '700',
    },
    newGameButton: {
        backgroundColor: '#8f7a66',
        borderRadius: 6,
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    newGameText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#f9f6f2',
    },
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
        color: '#776e65',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
    },
});

export default MainView;
