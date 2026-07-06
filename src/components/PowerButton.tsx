import React from 'react';
import { Pressable, Text, View } from 'react-native';
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
}

const PowerButton = ({ onPress, active, color, label, icon, uses }: PowerButtonProps) => {
    return (
        <Pressable
            onPress={onPress}
            className="flex-col items-center justify-center rounded-full"
        >
            <View className="rounded-full" style={{
                borderWidth: 1,
                backgroundColor: `${color}24`,
                borderColor: color,
                paddingVertical: 15,
                paddingHorizontal: 15,
            }}>
                <Lucide name={icon} size={24} color={color} />
            </View>
            <Text className="text-[14px] font-extrabold text-white mt-2">{label}</Text>

            <View className="rounded-full" style={{
                backgroundColor: "#777777ff",
                paddingHorizontal: 4,
                paddingVertical: 2,
                position: 'absolute',
                top: -8,
                right: 2,
            }}>
                <Text className="text-[10px] text-white">{uses} left</Text>
            </View>

        </Pressable>
    );
};

export default PowerButton;