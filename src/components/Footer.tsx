import React from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';

const SCREEN_WIDTH = Dimensions.get('window').width;

type FooterProps = {
    canUndo: boolean;
    onUndo: () => void;
    onRetry: () => void;
    onHelp: () => void;
    onShop: () => void;
};

const Footer = ({ canUndo, onUndo, onRetry, onHelp, onShop }: FooterProps) => {
    const footerItems = [
        { label: 'UNDO', icon: 'undo-variant', onPress: onUndo, disabled: !canUndo, color: '#8be9ff' },
        { label: 'RESET', icon: 'refresh', onPress: onRetry, disabled: false, color: '#8be9ff' },
        { label: 'HELP', icon: 'help-circle-outline', onPress: onHelp, disabled: false, color: '#8be9ff' },
        { label: 'SHOP', icon: 'cart-outline', onPress: onShop, disabled: false, color: '#8be9ff' },
    ] as const;

    return (
        <View
            className="mt-3 flex-row items-center justify-around rounded-t-[14px] border-t border-[rgba(126,205,255,0.18)] bg-[rgba(5,14,28,0.96)] px-4 pb-3.5 pt-3.5"
            style={{
                width: SCREEN_WIDTH,
            }}>
            {footerItems.map(item => (
                <View key={item.label} className="min-w-[54px] items-center space-y-1">
                    <Pressable
                        onPress={item.onPress}
                        disabled={item.disabled}
                        className="items-center justify-center"
                        style={({ pressed }) => [
                            {
                                backgroundColor: item.disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.10)',
                            },
                            pressed && { opacity: 0.65 },
                            item.disabled && { opacity: 0.8 },
                        ]}
                        accessibilityLabel={item.label}
                        accessibilityRole="button">
                        <MaterialDesignIcons
                            name={item.icon}
                            size={28}
                            color={item.disabled ? `${item.color}aa` : item.color}
                            style={{
                                textShadowColor: item.disabled ? 'transparent' : `${item.color}44`,
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 5,
                            }}
                        />
                    </Pressable>
                    <Text
                        className="text-sm font-black tracking-[0.7px]"
                        style={{
                            color: item.disabled ? `${item.color}88` : `${item.color}cc`,
                            textShadowColor: item.disabled ? 'transparent' : `${item.color}33`,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 4,
                        }}>
                        {item.label}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export default Footer;