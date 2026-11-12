import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { chunky, colors, outlined, fonts } from '../theme';
import type { IconName } from '../shared/ui';

type PowerButtonProps = {
    label: string;
    icon: IconName;
    onPress: () => void;
    /** Fill colour while the power is armed. */
    color: string;
    active?: boolean;
    disabled?: boolean;
    /** Small corner badge, e.g. uses left. */
    badge?: string;
    /** Shown as a gold price badge when there are no uses left. */
    price?: number;
    /** Highlights the button during the game-over rescue window. */
    urgent?: boolean;
};

/** Chunky power-up button for 2048: armed = pressed in and filled with colour. */
const PowerButton = ({ label, icon, onPress, color, active, disabled, badge, price, urgent }: PowerButtonProps) => (
    <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}${badge ? `, ${badge}` : ''}${price != null ? `, costs ${price} coins` : ''}`}
        accessibilityState={{ selected: !!active, disabled: !!disabled }}
        style={({ pressed }) => [
            styles.button,
            { backgroundColor: active ? color : colors.card, opacity: disabled ? 0.5 : 1 },
            active || pressed ? styles.pressed : chunky(3),
            urgent && !active && { borderColor: color, borderWidth: 3, borderBottomWidth: 6 },
        ]}>
        <Lucide name={icon} size={22} color={colors.ink} />
        <Text style={styles.label}>{label}</Text>
        {badge != null && (
            <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
        )}
        {badge == null && price != null && (
            <View style={[styles.badge, styles.price]}><Text style={[styles.badgeText, styles.priceText]}>{price}</Text></View>
        )}
    </Pressable>
);

const styles = StyleSheet.create({
    button: {
        flex: 1,
        height: 72,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    pressed: { ...outlined, marginTop: 3 },
    label: { fontSize: 13, fontFamily: fonts.heavy, color: colors.ink },
    badge: {
        position: 'absolute',
        top: -9,
        right: -6,
        minWidth: 24,
        height: 24,
        paddingHorizontal: 6,
        borderRadius: 12,
        backgroundColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { fontSize: 12, fontFamily: fonts.heavy, color: colors.white },
    price: { backgroundColor: colors.coin, ...outlined },
    priceText: { color: colors.ink, fontSize: 11 },
});

export default PowerButton;
