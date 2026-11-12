import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { chunky, colors, outlined, radius } from '../theme';
import { ChunkyButton } from './ui';

export type ResultInfo = {
    title: string;
    subtitle: string;
    scoreLabel: string;
    score: string;
    stats: Array<{ label: string; value: string }>;
    /** Omit to hide the coins row (2048 pays coins during play). */
    coins?: number;
    isNewBest?: boolean;
    won?: boolean;
};

/** Shared end-of-game screen. Every game passes its own numbers. */
export function ResultModal({
    result,
    onPlayAgain,
}: {
    result: ResultInfo | null;
    onPlayAgain: () => void;
}) {
    const navigation = useNavigation();
    return (
        <Modal visible={result != null} animationType="fade" transparent statusBarTranslucent onRequestClose={onPlayAgain}>
            {result && (
                <View style={styles.backdrop}>
                    <View style={styles.sheet}>
                        <View style={styles.top}>
                            <Lucide
                                name={result.won ? 'trophy' : 'flag'}
                                size={44}
                                color={colors.ink}
                            />
                            <Text style={styles.title} accessibilityRole="header">{result.title}</Text>
                            <Text style={styles.subtitle}>{result.subtitle}</Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
                            <Text style={styles.score}>{result.score}</Text>
                            {result.isNewBest && (
                                <View style={styles.best}>
                                    <Text style={styles.bestText}>New best!</Text>
                                </View>
                            )}
                            {result.stats.length > 0 && (
                                <View style={styles.statsRow}>
                                    {result.stats.map(stat => (
                                        <View key={stat.label} style={styles.stat}>
                                            <Text style={styles.statValue}>{stat.value}</Text>
                                            <Text style={styles.statLabel}>{stat.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {result.coins != null && (
                                <View style={styles.coins}>
                                    <Text style={styles.coinsLabel}>Coins earned</Text>
                                    <Text style={styles.coinsValue}>+{result.coins}</Text>
                                </View>
                            )}
                        </View>

                        <ChunkyButton label="Play again" size="lg" color={colors.ink} textColor={colors.white} onPress={onPlayAgain} />
                        <ChunkyButton label="Home" onPress={() => navigation.goBack()} />
                    </View>
                </View>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(43,33,64,0.55)',
        justifyContent: 'center',
        padding: 20,
    },
    sheet: {
        backgroundColor: colors.coin,
        borderRadius: 28,
        ...chunky(6),
        padding: 20,
        gap: 12,
    },
    top: { alignItems: 'center', gap: 4 },
    title: { fontSize: 30, fontWeight: '800', color: colors.ink },
    subtitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
    card: {
        backgroundColor: colors.card,
        borderRadius: 22,
        ...outlined,
        padding: 16,
        alignItems: 'center',
        gap: 10,
    },
    scoreLabel: { fontSize: 12, fontWeight: '800', color: colors.muted },
    score: { fontSize: 44, fontWeight: '800', color: colors.ink },
    best: {
        backgroundColor: colors.success,
        borderRadius: radius.pill,
        ...outlined,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    bestText: { fontSize: 13, fontWeight: '800', color: colors.ink },
    statsRow: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
    stat: {
        flex: 1,
        backgroundColor: colors.cream,
        borderRadius: 14,
        paddingVertical: 8,
        alignItems: 'center',
    },
    statValue: { fontSize: 18, fontWeight: '800', color: colors.ink },
    statLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
    coins: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.coinLight,
        borderRadius: 14,
        ...outlined,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    coinsLabel: { fontSize: 14, fontWeight: '800', color: colors.ink },
    coinsValue: { fontSize: 20, fontWeight: '800', color: colors.ink },
});
