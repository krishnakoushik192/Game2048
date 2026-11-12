import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
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
 * back button, title and one action on the right.
 */
export function GameShell({
    title,
    background,
    action,
    children,
    footer,
    scroll = true,
}: {
    /** Swipe-driven games pass false so the scroll view never steals the gesture. */
    scroll?: boolean;
    title: string;
    background: string;
    action?: Action;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.root, { backgroundColor: background, paddingTop: insets.top + 12 }]}>
            <StatusBar barStyle="dark-content" backgroundColor={background} />
            <View style={styles.header}>
                <IconButton icon="chevron-left" label="Back" onPress={() => navigation.goBack()} />
                <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{title}</Text>
                {action ? (
                    <IconButton icon={action.icon} label={action.label} onPress={action.onPress} />
                ) : (
                    <View style={styles.spacer} />
                )}
            </View>
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
        fontWeight: '800',
        color: colors.ink,
        marginHorizontal: 8,
    },
    spacer: { width: 44 },
    fill: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 16, alignItems: 'stretch' },
    footer: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
});
