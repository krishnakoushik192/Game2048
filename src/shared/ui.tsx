import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { chunky, colors, outlined, radius, fonts } from '../theme';

export type IconName = React.ComponentProps<typeof Lucide>['name'];

type ChunkyButtonProps = {
    label?: string;
    icon?: IconName;
    onPress: () => void;
    color?: string;
    textColor?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
    size?: 'md' | 'lg';
    selected?: boolean;
};

/** Toy-block button: thick bottom edge that collapses when pressed. */
export function ChunkyButton({
    label,
    icon,
    onPress,
    color = colors.card,
    textColor = colors.ink,
    disabled,
    style,
    accessibilityLabel,
    size = 'md',
    selected,
}: ChunkyButtonProps) {
    const height = size === 'lg' ? 56 : 48;
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ disabled: !!disabled, selected: !!selected }}
            style={({ pressed }) => [
                styles.button,
                { height, backgroundColor: color, opacity: disabled ? 0.5 : 1 },
                pressed || selected
                    ? { ...outlined, marginTop: 4 }
                    : chunky(4),
                style,
            ]}>
            {icon && <Lucide name={icon} size={size === 'lg' ? 22 : 20} color={textColor} />}
            {label != null && (
                <Text style={[styles.buttonText, { color: textColor, fontSize: size === 'lg' ? 18 : 15 }]}>
                    {label}
                </Text>
            )}
        </Pressable>
    );
}

export function IconButton({
    icon,
    onPress,
    label,
}: {
    icon: IconName;
    onPress: () => void;
    label: string;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={6}
            style={({ pressed }) => [
                styles.iconButton,
                pressed ? { ...outlined, marginTop: 3 } : chunky(3),
            ]}>
            <Lucide name={icon} size={20} color={colors.ink} />
        </Pressable>
    );
}

export function StatChip({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string | number;
    highlight?: string;
}) {
    return (
        <View
            style={[styles.chip, { backgroundColor: highlight ?? colors.card }]}
            accessible
            accessibilityLabel={`${label} ${value}`}>
            <Text style={[styles.chipLabel, { color: highlight ? colors.ink : colors.muted }]}>{label}</Text>
            <Text style={styles.chipValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        </View>
    );
}

export function CoinPill({ coins }: { coins: number }) {
    return (
        <View style={styles.coinPill} accessible accessibilityLabel={`${coins} coins`}>
            <Lucide name="coins" size={16} color={colors.ink} />
            <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
        </View>
    );
}

/** Segmented control used for modes, sizes and difficulty. */
export function Segmented<T extends string>({
    options,
    value,
    onChange,
    label,
}: {
    options: Array<{ value: T; label: string }>;
    value: T;
    onChange: (value: T) => void;
    label: string;
}) {
    return (
        <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={label}>
            {options.map(option => {
                const active = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        style={[styles.segment, active && { backgroundColor: colors.ink }]}>
                        <Text style={[styles.segmentText, active && { color: colors.white }]}>
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export function Banner({
    children,
    color = colors.card,
    dashed,
}: {
    children: React.ReactNode;
    color?: string;
    dashed?: boolean;
}) {
    return (
        <View style={[styles.banner, { backgroundColor: color }, dashed && { borderStyle: 'dashed' }]}>
            {children}
        </View>
    );
}

export const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        borderRadius: radius.button,
    },
    buttonText: { fontFamily: fonts.heavy },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chip: {
        flex: 1,
        borderRadius: 16,
        ...outlined,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    chipLabel: { fontSize: 12, fontFamily: fonts.heavy },
    chipValue: { fontSize: 24, fontFamily: fonts.display, color: colors.ink },
    coinPill: {
        height: 38,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        backgroundColor: colors.coin,
        ...outlined,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    coinText: { fontSize: 15, fontFamily: fonts.heavy, color: colors.ink },
    segmented: {
        flexDirection: 'row',
        height: 46,
        padding: 4,
        gap: 4,
        borderRadius: radius.pill,
        backgroundColor: colors.card,
        ...outlined,
    },
    segment: {
        flex: 1,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentText: { fontSize: 14, fontFamily: fonts.heavy, color: colors.ink },
    banner: {
        borderRadius: 16,
        ...outlined,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
});
