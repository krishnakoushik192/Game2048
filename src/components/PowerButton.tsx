import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { COLORS } from '../MainView';

type PowerIconName = React.ComponentProps<typeof Lucide>['name'];

interface PowerButtonProps {
    onPress: () => void;
    active: boolean;
    color: string;
    label: string;
    icon: PowerIconName;
    uses: number;
    showTimer?: boolean;
    timerProgress?: Animated.Value;
    timerLabel?: number;
}

const PowerButton = ({ onPress, active, color, label, icon, uses, showTimer, timerProgress, timerLabel }: PowerButtonProps) => {
    const timerScale = timerProgress?.interpolate({
        inputRange: [0, 1],
        outputRange: [0.82, 1.12],
    });
    const timerOpacity = timerProgress?.interpolate({
        inputRange: [0, 0.25, 1],
        outputRange: [0.15, 0.8, 1],
    });

    return (
        <Pressable
            onPress={onPress}
            className="flex-col items-center justify-center rounded-full"
        >
            <View className="relative">
                {showTimer && timerProgress && (
                    <Animated.View
                        pointerEvents="none"
                        className="absolute rounded-full border-[3px]"
                        style={{
                            width: 64,
                            height: 64,
                            left: -5,
                            top: -5,
                            borderColor: color,
                            opacity: timerOpacity,
                            transform: [{ scale: timerScale ?? 1 }],
                        }}
                    />
                )}
                <View className="rounded-full" style={{
                    // Active power: thicker ring and stronger fill so it is obvious it is armed.
                    borderWidth: active ? 3 : 1,
                    backgroundColor: active ? `${color}66` : `${color}24`,
                    borderColor: color,
                    paddingVertical: active ? 13 : 15,
                    paddingHorizontal: active ? 13 : 15,
                }}>
                    <Lucide name={icon} size={24} color={color} />
                </View>
                {showTimer && timerLabel != null && (
                    <View
                        className="absolute items-center justify-center rounded-full"
                        style={{
                            width: 22,
                            height: 22,
                            right: -6,
                            bottom: -4,
                            backgroundColor: color,
                        }}>
                        <Text className="text-[10px] font-black text-[#080c18]">{timerLabel}</Text>
                    </View>
                )}
            </View>
            <Text className="text-[14px] font-extrabold text-white mt-2">{label}</Text>

            <View className="rounded-full" style={{
                backgroundColor: `#777777ff`,
                paddingHorizontal: uses === 0 ? 3 : 4,
                paddingVertical: uses === 0 ? 3 : 2,
                position: 'absolute',
                top: -8,
                right: 2,
            }}>
                {uses === 0 ? (
                    <Lucide name="plus" size={12} color={COLORS.white} />
                ) : (
                    <Text className="text-[10px] text-white">{uses} left</Text>
                )}
            </View>

        </Pressable>
    );
};

export default PowerButton;
