import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameId } from '../theme';

const keyFor = (id: GameId) => `@playbox_tutorial_seen_${id}`;

/**
 * Shows a game's tutorial automatically the first time the game opens,
 * and lets the "?" button open it again later.
 */
export function useTutorial(id: GameId | undefined) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!id) { return; }
        let alive = true;
        AsyncStorage.getItem(keyFor(id))
            .then(value => { if (alive && value !== 'true') { setVisible(true); } })
            .catch(() => undefined);
        return () => { alive = false; };
    }, [id]);

    const open = useCallback(() => setVisible(true), []);
    const close = useCallback(() => {
        setVisible(false);
        if (id) {
            AsyncStorage.setItem(keyFor(id), 'true').catch(() => undefined);
        }
    }, [id]);

    return { visible, open, close };
}
