import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { GRADIENTS, PALETTE, glowShadow, gradientBg } from '../theme';

type PowerIconName = React.ComponentProps<typeof Lucide>['name'];

interface PowerButtonProps {
    onPress: () => void;
    active: boolean;
    color: string;
    gradient: string;
    label: string;
    icon: PowerIconName;
    uses: number;
}

const PowerButton = ({ onPress, active, color, gradient, label, icon, uses }: PowerButtonProps) => {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!active) {
            pulse.setValue(1);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.08, duration: 550, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [active, pulse]);

    const isEmpty = uses <= 0;

    return (
        <Pressable
            onPress={onPress}
            className="flex-col items-center justify-center"
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.94 : 1 }] }]}
            accessibilityLabel={label}
            accessibilityRole="button">
            <Animated.View
                className="overflow-hidden rounded-full border-[2px]"
                style={[
                    isEmpty ? { backgroundColor: 'rgba(255,255,255,0.06)' } : gradientBg(gradient),
                    {
                        borderColor: active ? '#ffffff' : isEmpty ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.4)',
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        transform: [{ scale: pulse }],
                    },
                    active ? glowShadow(color, 0.65, 16) : isEmpty ? {} : glowShadow(color, 0.3, 10),
                ]}>
                <Lucide name={icon} size={24} color={isEmpty ? 'rgba(255,255,255,0.35)' : '#ffffff'} />
            </Animated.View>
            <Text className="mt-2 text-[13px] font-extrabold text-white">{label}</Text>

            <View
                className="overflow-hidden rounded-full border border-[rgba(255,255,255,0.4)]"
                style={{
                    position: 'absolute',
                    top: -6,
                    right: -2,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    ...(isEmpty ? { backgroundColor: PALETTE.rubyDeep } : gradientBg(GRADIENTS.gold)),
                }}>
                <Text
                    className="text-[10px] font-black"
                    style={{ color: isEmpty ? '#ffffff' : '#241900' }}>
                    {isEmpty ? 'GET' : uses}
                </Text>
            </View>
        </Pressable>
    );
};

export default PowerButton;
