import { useCallback, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { playMoveEffect } from '../audio';
import { usePlaybox } from './playbox';

export type Direction = 'up' | 'down' | 'left' | 'right';

/** Pure helper: picks the dominant axis of a drag. Returns null for tiny drags. */
export function directionFromDrag(dx: number, dy: number, threshold = 20): Direction | null {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) {
        return null;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
}

/**
 * One pan gesture that reports a swipe direction. More forgiving than four
 * separate fling gestures for short or slightly diagonal swipes.
 */
export function useSwipe(onSwipe: (direction: Direction) => void) {
    return useMemo(
        () =>
            Gesture.Pan()
                .runOnJS(true)
                .minDistance(12)
                .onEnd(event => {
                    const direction = directionFromDrag(event.translationX, event.translationY);
                    if (direction) {
                        onSwipe(direction);
                    }
                }),
        [onSwipe],
    );
}

/** Short tap/move sound that respects the shared sound setting. */
export function useTapSound() {
    const { soundEnabled } = usePlaybox();
    return useCallback(() => {
        if (soundEnabled) {
            playMoveEffect();
        }
    }, [soundEnabled]);
}
