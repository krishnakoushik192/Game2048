import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import type { GameId } from '../theme';
import { HowToPlay } from '../tutorial/HowToPlay';
import { useTutorial } from '../tutorial/seen';
import { IconButton } from './ui';
import type { IconName } from './ui';

type Action = { icon: IconName; label: string; onPress: () => void };

/** Width available for a square game board on this screen. */
export function useBoardSize(max = 380) {
    const { width } = useWindowDimensions();
    return Math.min(width - 40, max);
}

/**
 * Shared frame for every game: safe-area padding, tinted background,
 * back button, title, a "?" button and one action on the right.
 * With `tutorial`, the game's How to play opens by itself the first time.
 */
export function GameShell({
    title,
    background,
    action,
    children,
    footer,
    scroll = true,
    tutorial,
}: {
    /** Swipe-driven games pass false so the scroll view never steals the gesture. */
    scroll?: boolean;
    title: string;
    background: string;
    action?: Action;
    children: React.ReactNode;
    footer?: React.ReactNode;
    tutorial?: GameId;
}) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const howTo = useTutorial(tutorial);
    const rightCount = (tutorial ? 1 : 0) + (action ? 1 : 0);
    // Both sides get the same width so the title stays centred.
    const sideWidth = Math.max(1, rightCount) * 44 + (Math.max(1, rightCount) - 1) * 8;

    return (
        <View style={[styles.root, { backgroundColor: background, paddingTop: insets.top + 12 }]}>
            <StatusBar barStyle="dark-content" backgroundColor={background} />
            <View style={styles.header}>
                <View style={[styles.side, { width: sideWidth }]}>
                    <IconButton icon="chevron-left" label="Back" onPress={() => navigation.goBack()} />
                </View>
                <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{title}</Text>
                <View style={[styles.side, styles.sideRight, { width: sideWidth }]}>
                    {tutorial && <IconButton icon="circle-help" label="How to play" onPress={howTo.open} />}
                    {action && <IconButton icon={action.icon} label={action.label} onPress={action.onPress} />}
                </View>
            </View>
            {tutorial && <HowToPlay game={tutorial} visible={howTo.visible} onClose={howTo.close} />}
            {scroll ? (
                <ScrollView
                    contentContainerStyle={styles.content}
                    bounces={false}
                    showsVerticalScrollIndicator={false}>
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.content, styles.fill]}>{children}</View>
            )}
            {footer && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>{footer}</View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 52,
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 24,
        fontFamily: fonts.display,
        color: colors.ink,
        marginHorizontal: 8,
    },
    side: { flexDirection: 'row', gap: 8 },
    sideRight: { justifyContent: 'flex-end' },
    fill: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 16, alignItems: 'stretch' },
    footer: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
});
