import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { GRADIENTS, PALETTE, gradientBg, glowShadow } from '../theme';

type GradientButtonProps = {
    label: string;
    onPress: () => void;
    gradient?: string;
    textColor?: string;
    glowColor?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

/** Premium filled CTA button with a rich solid body and a soft glow. */
export function GradientButton({
    label,
    onPress,
    gradient = GRADIENTS.gold,
    textColor = '#241900',
    glowColor,
    disabled,
    style,
}: GradientButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.96 : 1 }], opacity: disabled ? 0.5 : 1 },
                style,
            ]}>
            <View
                className="min-w-[112px] items-center overflow-hidden rounded-[18px] px-5 py-3.5"
                style={[gradientBg(gradient), glowShadow(glowColor ?? PALETTE.gold, 0.4, 14)]}>
                <Text className="text-[15px] font-extrabold tracking-[0.3px]" style={{ color: textColor }}>
                    {label}
                </Text>
            </View>
        </Pressable>
    );
}

type GhostButtonProps = {
    label: string;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
};

/** Secondary translucent glass button used alongside a GradientButton. */
export function GhostButton({ label, onPress, style }: GhostButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }], opacity: pressed ? 0.8 : 1 }, style]}>
            <View
                className="min-w-[112px] items-center rounded-[18px] border-[1.5px] px-5 py-3.5"
                style={{ borderColor: PALETTE.glassBorder, backgroundColor: PALETTE.glassBg }}>
                <Text className="text-[15px] font-bold text-white">{label}</Text>
            </View>
        </Pressable>
    );
}
