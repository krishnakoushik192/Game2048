import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { chunky, colors, fonts, gameColors, outlined } from './theme';
import { ChunkyButton } from './shared/ui';
import type { IconName } from './shared/ui';
import { RootStackParamList, WELCOME_SEEN_KEY } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const PROMISES: Array<{ icon: IconName; color: string; text: string }> = [
    { icon: 'layout-grid', color: gameColors.memory.main, text: '8 fun games to play' },
    { icon: 'wifi-off', color: gameColors.snake.main, text: 'No internet needed, ever' },
    { icon: 'star', color: gameColors.tictactoe.main, text: 'Learn each game in 3 steps' },
];

const BLOCKS = [
    { bg: gameColors.g2048.main, text: '2' },
    { bg: gameColors.tictactoe.main, text: 'X', light: true },
    { bg: gameColors.memory.main, text: '?', light: true },
    { bg: gameColors.colorRecall.main, text: '' },
    { bg: colors.card, text: '15' },
    { bg: gameColors.dropFour.main, text: '●', fg: colors.coin },
];

/** First launch only. Each game then teaches itself the first time it opens. */
export default function WelcomeScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();

    const start = () => {
        AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true').catch(() => undefined);
        navigation.replace('Home');
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.coin} />
            <View style={[styles.bubble, styles.bubbleTop]} />
            <View style={[styles.bubble, styles.bubbleBottom]} />

            <View style={styles.blocks} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {BLOCKS.map((block, i) => (
                    <View key={i} style={[styles.block, { backgroundColor: block.bg }]}>
                        <Text style={[styles.blockText, { color: block.fg ?? (block.light ? colors.white : colors.ink) }]}>{block.text}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.hello}>
                <Text style={styles.title} accessibilityRole="header">Hi there!</Text>
                <Text style={styles.subtitle}>Welcome to Playbox. Lots of little games, all in one place.</Text>
            </View>

            <View style={styles.card}>
                {PROMISES.map(item => (
                    <View key={item.text} style={styles.promise}>
                        <View style={[styles.promiseIcon, { backgroundColor: item.color }]}>
                            <Lucide name={item.icon} size={22} color={colors.ink} />
                        </View>
                        <Text style={styles.promiseText}>{item.text}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.spacer} />
            <ChunkyButton label="Let’s play!" size="lg" color={colors.ink} textColor={colors.white} onPress={start} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.coin, paddingHorizontal: 20, gap: 22, overflow: 'hidden' },
    bubble: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFDA6B' },
    bubbleTop: { width: 220, height: 220, top: -60, right: -60 },
    bubbleBottom: { width: 200, height: 200, bottom: 160, left: -80 },
    blocks: { alignSelf: 'center', width: 212, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    block: { width: 64, height: 64, borderRadius: 18, ...chunky(4), alignItems: 'center', justifyContent: 'center' },
    blockText: { fontSize: 24, fontFamily: fonts.display },
    hello: { alignItems: 'center', gap: 8 },
    title: { fontSize: 44, fontFamily: fonts.display, color: colors.ink },
    subtitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink, textAlign: 'center', lineHeight: 25 },
    card: { backgroundColor: colors.card, borderRadius: 24, ...chunky(4), padding: 16, gap: 14 },
    promise: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    promiseIcon: { width: 44, height: 44, borderRadius: 14, ...outlined, alignItems: 'center', justifyContent: 'center' },
    promiseText: { flex: 1, fontSize: 17, fontFamily: fonts.heavy, color: colors.ink },
    spacer: { flex: 1 },
});
