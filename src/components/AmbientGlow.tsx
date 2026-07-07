import React from 'react';
import { View } from 'react-native';

/**
 * Soft, out-of-focus color orbs that sit behind the UI to give every screen
 * a premium, lit-from-within atmosphere. Purely decorative + non-interactive.
 *
 * These use plain translucent solid colors (not CSS radial-gradient strings)
 * because RN's experimental gradient background support renders as a blank
 * screen on some real devices.
 */
export default function AmbientGlow() {
    return (
        <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
            <View
                className="absolute -left-24 -top-20 h-[300px] w-[300px] rounded-full"
                style={{ backgroundColor: 'rgba(212,175,55,0.09)' }}
            />
            <View
                className="absolute -right-28 top-16 h-[260px] w-[260px] rounded-full"
                style={{ backgroundColor: 'rgba(59,130,246,0.05)' }}
            />
            <View
                className="absolute -bottom-24 -left-16 h-[320px] w-[320px] rounded-full"
                style={{ backgroundColor: 'rgba(225,29,72,0.045)' }}
            />
            <View
                className="absolute -bottom-10 -right-20 h-[240px] w-[240px] rounded-full"
                style={{ backgroundColor: 'rgba(212,175,55,0.06)' }}
            />
        </View>
    );
}
