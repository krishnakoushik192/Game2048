import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { chunky, colors, gameColors, outlined, radius } from './theme';
import type { GameId } from './theme';
import { ChunkyButton, CoinPill, IconButton } from './shared/ui';
import type { IconName } from './shared/ui';
import { usePlaybox } from './shared/playbox';
import { GameStats, loadStats, todayKey } from './shared/stats';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type Route = Exclude<keyof RootStackParamList, 'Home' | 'Tutorial'>;

type GameEntry = {
    id: Exclude<GameId, 'g2048'>;
    route: Route;
    name: string;
    icon: IconName;
    challenge: string;
    meta: (stats: GameStats) => string;
};

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const GAMES: GameEntry[] = [
    { id: 'tictactoe', route: 'TicTacToe', name: 'Tic-Tac-Toe', icon: 'hash', challenge: 'Beat the AI at Tic-Tac-Toe', meta: s => (s.wins ? `${s.wins} wins` : 'Play vs AI') },
    { id: 'memory', route: 'Memory', name: 'Memory Match', icon: 'layers', challenge: 'Clear a Memory Match board', meta: s => (s.best != null ? `Best ${s.best} moves` : 'Find the pairs') },
    { id: 'colorRecall', route: 'ColorRecall', name: 'Color Recall', icon: 'circle-dot', challenge: 'Reach round 5 in Color Recall', meta: s => (s.best != null ? `Best round ${s.best}` : 'Repeat the lights') },
    { id: 'slide', route: 'SlidePuzzle', name: 'Slide Puzzle', icon: 'grid-3x3', challenge: 'Solve a Slide Puzzle', meta: s => (s.best != null ? `Best ${s.best} moves` : 'Put 1–15 in order') },
    { id: 'dropFour', route: 'DropFour', name: 'Drop Four', icon: 'circle', challenge: 'Win a game of Drop Four', meta: s => (s.wins ? `${s.wins} wins` : 'Four in a line') },
    { id: 'snake', route: 'Snake', name: 'Snake', icon: 'worm', challenge: 'Eat 10 berries in Snake', meta: s => (s.best != null ? `Best length ${s.best}` : 'Eat and grow') },
    { id: 'mines', route: 'MineFinder', name: 'Mine Finder', icon: 'bomb', challenge: 'Clear a Mine Finder field', meta: s => (s.best != null ? `Best ${formatTime(s.best)}` : 'Avoid the mines') },
];

const DAILY_REWARD = 50;
const DAILY_CLAIM_KEY = '@playbox_daily_claimed';

/** Same challenge for everyone on a given day, rotating through the games. */
export const dailyGameIndex = (date = new Date()) => {
    const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
    return dayNumber % GAMES.length;
};

export default function HomeScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { coins, reloadCoins, addCoins, soundEnabled, toggleSound } = usePlaybox();
    const [stats, setStats] = useState<Partial<Record<GameId, GameStats>>>({});
    const [claimedToday, setClaimedToday] = useState(true);
    const today = todayKey();
    const daily = GAMES[dailyGameIndex()];
    const dailyDone = stats[daily.id]?.lastWinDate === today;

    useFocusEffect(useCallback(() => {
        reloadCoins();
        Promise.all(GAMES.map(game => loadStats(game.id))).then(all => {
            setStats(Object.fromEntries(GAMES.map((game, i) => [game.id, all[i]])));
        });
        AsyncStorage.getItem(DAILY_CLAIM_KEY)
            .then(value => setClaimedToday(value === todayKey()))
            .catch(() => setClaimedToday(false));
    }, [reloadCoins]));

    const claimDaily = async () => {
        if (!dailyDone || claimedToday) { return; }
        setClaimedToday(true);
        await AsyncStorage.setItem(DAILY_CLAIM_KEY, today).catch(() => undefined);
        await addCoins(DAILY_REWARD);
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.kicker}>Welcome back</Text>
                        <Text style={styles.hello} accessibilityRole="header">Let’s play!</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <CoinPill coins={coins} />
                        <IconButton
                            icon={soundEnabled ? 'volume-2' : 'volume-x'}
                            label={soundEnabled ? 'Turn sound off' : 'Turn sound on'}
                            onPress={toggleSound}
                        />
                    </View>
                </View>

                <View style={styles.daily}>
                    <View style={styles.dailyTop}>
                        <View style={styles.flex}>
                            <Text style={styles.dailyKicker}>TODAY’S CHALLENGE</Text>
                            <Text style={styles.dailyTitle}>{daily.challenge}</Text>
                        </View>
                        <View style={styles.reward}><Text style={styles.rewardText}>+{DAILY_REWARD}</Text></View>
                    </View>
                    {claimedToday && dailyDone ? (
                        <Text style={styles.dailyNote}>Reward claimed. New challenge tomorrow!</Text>
                    ) : dailyDone ? (
                        <ChunkyButton label={`Claim ${DAILY_REWARD} coins`} color={colors.coin} onPress={claimDaily} />
                    ) : (
                        <ChunkyButton label="Play now" icon="play" onPress={() => navigation.navigate(daily.route)} />
                    )}
                </View>

                <Pressable
                    onPress={() => navigation.navigate('Game')}
                    accessibilityRole="button"
                    accessibilityLabel="Play 2048"
                    style={({ pressed }) => [styles.featured, pressed ? { ...outlined, marginTop: 4 } : chunky(4)]}>
                    <View style={styles.featuredIcon}><Text style={styles.featuredIconText}>2048</Text></View>
                    <View style={styles.flex}>
                        <Text style={styles.featuredKicker}>THE ORIGINAL</Text>
                        <Text style={styles.featuredTitle}>2048</Text>
                        <Text style={styles.meta}>Merge tiles, earn coins, use powers</Text>
                    </View>
                    <Lucide name="play" size={22} color={colors.ink} />
                </Pressable>

                <Text style={styles.section} accessibilityRole="header">Pick a game</Text>
                <View style={styles.grid}>
                    {GAMES.map(game => {
                        const color = gameColors[game.id];
                        return (
                            <Pressable
                                key={game.id}
                                onPress={() => navigation.navigate(game.route)}
                                accessibilityRole="button"
                                accessibilityLabel={`Play ${game.name}`}
                                style={({ pressed }) => [
                                    styles.card,
                                    { backgroundColor: color.tint },
                                    pressed ? { ...outlined, marginTop: 3 } : chunky(3),
                                ]}>
                                <View style={[styles.cardIcon, { backgroundColor: color.main }]}>
                                    <Lucide name={game.icon} size={18} color={colors.ink} />
                                </View>
                                <View style={styles.flex}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>{game.name}</Text>
                                    <Text style={styles.meta} numberOfLines={1}>{game.meta(stats[game.id] ?? { plays: 0, wins: 0, best: null, lastWinDate: null })}</Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.cream },
    content: { paddingHorizontal: 20, gap: 16 },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    kicker: { fontSize: 13, fontWeight: '700', color: colors.muted },
    hello: { fontSize: 28, fontWeight: '800', color: colors.ink },
    daily: {
        backgroundColor: '#6A4BE0',
        borderRadius: 22,
        ...chunky(4),
        padding: 16,
        gap: 12,
    },
    dailyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    dailyKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#E6DEFF' },
    dailyTitle: { fontSize: 20, fontWeight: '800', color: colors.white },
    dailyNote: { fontSize: 14, fontWeight: '700', color: colors.white },
    reward: { backgroundColor: colors.coin, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
    rewardText: { fontSize: 13, fontWeight: '800', color: colors.ink },
    featured: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: gameColors.g2048.tint,
        borderRadius: 22,
        padding: 14,
    },
    featuredIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: gameColors.g2048.main,
        ...outlined,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featuredIconText: { fontSize: 16, fontWeight: '800', color: colors.ink },
    featuredKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#A34A12' },
    featuredTitle: { fontSize: 24, fontWeight: '800', color: colors.ink },
    section: { fontSize: 20, fontWeight: '800', color: colors.ink },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        width: '47.8%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: radius.card,
        padding: 10,
        minHeight: 70,
    },
    cardIcon: {
        width: 36,
        height: 36,
        borderRadius: 11,
        ...outlined,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
    meta: { fontSize: 12, fontWeight: '700', color: colors.muted },
});
