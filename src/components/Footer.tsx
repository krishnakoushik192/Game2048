import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { PALETTE, cardShadow } from '../theme';

type FooterProps = {
    canUndo: boolean;
    onUndo: () => void;
    onRetry: () => void;
    onHelp: () => void;
    onShop: () => void;
};

const Footer = ({ canUndo, onUndo, onRetry, onHelp, onShop }: FooterProps) => {
    const footerItems = [
        { label: 'Undo', icon: 'undo-variant', onPress: onUndo, disabled: !canUndo, color: PALETTE.sapphire },
        { label: 'Reset', icon: 'refresh', onPress: onRetry, disabled: false, color: PALETTE.sapphire },
        { label: 'Help', icon: 'help-circle-outline', onPress: onHelp, disabled: false, color: PALETTE.sapphire },
        { label: 'Shop', icon: 'cart-outline', onPress: onShop, disabled: false, color: PALETTE.gold },
    ] as const;

    return (
        <View
            className="mb-2 mt-3 w-full max-w-[400px] flex-row items-center justify-around overflow-hidden rounded-[24px] border-[1.5px] px-2 py-2.5"
            style={[
                { borderColor: PALETTE.glassBorder, backgroundColor: PALETTE.surfaceAlt },
                cardShadow('#000000', 0.35, 18),
            ]}>
            {footerItems.map(item => (
                <Pressable
                    key={item.label}
                    onPress={item.onPress}
                    disabled={item.disabled}
                    className="min-w-[64px] items-center rounded-2xl py-2"
                    style={({ pressed }) => [
                        { transform: [{ scale: pressed ? 0.93 : 1 }] },
                        pressed && !item.disabled && { backgroundColor: 'rgba(255,255,255,0.06)' },
                    ]}
                    accessibilityLabel={item.label}
                    accessibilityRole="button">
                    <View
                        className="items-center justify-center rounded-full"
                        style={{
                            width: 42,
                            height: 42,
                            backgroundColor: item.disabled ? 'rgba(255,255,255,0.04)' : `${item.color}1f`,
                            borderWidth: 1,
                            borderColor: item.disabled ? 'rgba(255,255,255,0.08)' : `${item.color}55`,
                        }}>
                        <MaterialDesignIcons
                            name={item.icon}
                            size={22}
                            color={item.disabled ? 'rgba(255,255,255,0.28)' : item.color}
                        />
                    </View>
                    <Text
                        className="mt-1.5 text-[11px] font-bold tracking-[0.4px]"
                        style={{ color: item.disabled ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.85)' }}>
                        {item.label}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
};

export default Footer;
