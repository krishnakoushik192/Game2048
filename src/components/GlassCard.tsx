import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { PALETTE, cardShadow } from '../theme';

type GlassCardProps = {
    children: React.ReactNode;
    glowColor?: string;
    className?: string;
    style?: StyleProp<ViewStyle>;
};

/** Frosted, gently glowing surface used for modal dialogs and elevated panels. */
export default function GlassCard({ children, glowColor = PALETTE.gold, className, style }: GlassCardProps) {
    return (
        <View
            className={`w-full max-w-[340px] items-center overflow-hidden rounded-[28px] border-[1.5px] px-7 py-8 ${className ?? ''}`}
            style={[
                { borderColor: PALETTE.glassBorder, backgroundColor: PALETTE.glassBgStrong },
                cardShadow(glowColor, 0.35, 24),
                style,
            ]}>
            {children}
        </View>
    );
}
