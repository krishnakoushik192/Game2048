import { NativeModules } from 'react-native';

type GameAudioModule = {
    startBackgroundMusic?: () => void;
    stopBackgroundMusic?: () => void;
    playMoveEffect?: () => void;
};

const GameAudio = NativeModules.GameAudio as GameAudioModule | undefined;

export const startBackgroundMusic = () => {
    GameAudio?.startBackgroundMusic?.();
};

export const stopBackgroundMusic = () => {
    GameAudio?.stopBackgroundMusic?.();
};

export const playMoveEffect = () => {
    GameAudio?.playMoveEffect?.();
};
