import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same key the 2048 view model uses, so coins are shared across every game. */
export const COINS_KEY = '@game2048_coins';
const SOUND_KEY = '@playbox_sound';

type PlayboxValue = {
    coins: number;
    soundEnabled: boolean;
    /** Adds coins and returns the new balance. */
    addCoins: (amount: number) => Promise<number>;
    /** Spends coins if the balance allows it; returns whether it succeeded. */
    spendCoins: (amount: number) => Promise<boolean>;
    /** Re-reads the balance (2048 still writes coins itself). */
    reloadCoins: () => Promise<void>;
    toggleSound: () => void;
};

const PlayboxContext = createContext<PlayboxValue | null>(null);

const readCoins = async () => {
    try {
        const raw = await AsyncStorage.getItem(COINS_KEY);
        const parsed = Number(raw);
        return raw != null && Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
        return 0;
    }
};

const writeCoins = async (value: number) => {
    try {
        await AsyncStorage.setItem(COINS_KEY, String(value));
    } catch (error) {
        console.warn('Failed to save coins', error);
    }
};

export function PlayboxProvider({ children }: { children: React.ReactNode }) {
    const [coins, setCoins] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        readCoins().then(setCoins);
        AsyncStorage.getItem(SOUND_KEY)
            .then(value => { if (value === 'false') { setSoundEnabled(false); } })
            .catch(() => undefined);
    }, []);

    const reloadCoins = useCallback(async () => {
        setCoins(await readCoins());
    }, []);

    // Always start from the stored balance so a write from the 2048 screen is never lost.
    const addCoins = useCallback(async (amount: number) => {
        const next = (await readCoins()) + Math.max(0, Math.floor(amount));
        await writeCoins(next);
        setCoins(next);
        return next;
    }, []);

    const spendCoins = useCallback(async (amount: number) => {
        const current = await readCoins();
        if (current < amount) {
            setCoins(current);
            return false;
        }
        const next = current - amount;
        await writeCoins(next);
        setCoins(next);
        return true;
    }, []);

    const toggleSound = useCallback(() => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        AsyncStorage.setItem(SOUND_KEY, String(next)).catch(() => undefined);
    }, [soundEnabled]);

    const value = useMemo(
        () => ({ coins, soundEnabled, addCoins, spendCoins, reloadCoins, toggleSound }),
        [addCoins, coins, reloadCoins, soundEnabled, spendCoins, toggleSound],
    );

    return <PlayboxContext.Provider value={value}>{children}</PlayboxContext.Provider>;
}

export function usePlaybox() {
    const value = useContext(PlayboxContext);
    if (!value) {
        throw new Error('usePlaybox must be used inside PlayboxProvider');
    }
    return value;
}
