import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide/static';
import { colors, gameColors, outlined, fonts } from '../../theme';
import { GameShell, useBoardSize } from '../../shared/GameShell';
import { ChunkyButton, Segmented, StatChip } from '../../shared/ui';
import { ResultModal } from '../../shared/ResultModal';
import type { ResultInfo } from '../../shared/ResultModal';
import { usePlaybox } from '../../shared/playbox';
import { useGameStats } from '../../shared/stats';
import { useTapSound } from '../../shared/input';
import { Field, LEVELS, Level, createField, flagsLeft, isCleared, reveal, safeHint, toggleFlag } from './logic';

const COLOR = gameColors.mines;
const CLEAR_COINS = 25;
const HINT_COST = 30;
const NUMBER_COLORS = ['', '#1F5FD6', '#1E8A47', '#C42B2B', '#5A3BC8', '#8A3B12', '#0E7C7B', colors.ink, colors.muted];
type Tool = 'dig' | 'flag';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const newField = (level: Level) => {
    const { rows, cols, mines } = LEVELS[level];
    return createField(rows, cols, mines);
};

export default function MineFinderScreen() {
    const size = useBoardSize(380);
    const { addCoins, spendCoins, coins } = usePlaybox();
    const { stats, recordResult } = useGameStats('mines', { lowerIsBetter: true });
    const tap = useTapSound();
    const [level, setLevel] = useState<Level>('easy');
    const [field, setField] = useState<Field>(() => newField('easy'));
    const [tool, setTool] = useState<Tool>('dig');
    const [seconds, setSeconds] = useState(0);
    const [over, setOver] = useState<'won' | 'lost' | null>(null);
    const [result, setResult] = useState<ResultInfo | null>(null);

    useEffect(() => {
        if (!field.placed || over) { return; }
        const id = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, [field.placed, over]);

    const reset = useCallback((nextLevel: Level = level) => {
        setField(newField(nextLevel));
        setSeconds(0);
        setOver(null);
        setResult(null);
        setTool('dig');
    }, [level]);

    const bestAfter = (won: boolean) => {
        const best = won ? Math.min(stats.best ?? seconds, seconds) : stats.best;
        return best != null ? formatTime(best) : '–';
    };

    const endGame = (won: boolean, finalField: Field) => {
        setOver(won ? 'won' : 'lost');
        const { isNewBest } = recordResult({ score: seconds, won });
        if (won) { addCoins(CLEAR_COINS); }
        setTimeout(() => setResult({
            won,
            title: won ? 'Field cleared!' : 'Boom!',
            subtitle: `Mine Finder · ${finalField.rows}×${finalField.cols}`,
            scoreLabel: won ? 'TIME' : 'SAFE SQUARES OPENED',
            score: won ? formatTime(seconds) : String(finalField.cells.filter(c => c.open && !c.mine).length),
            isNewBest: won && isNewBest,
            coins: won ? CLEAR_COINS : 0,
            stats: [
                { label: 'Mines', value: String(finalField.mines) },
                { label: 'Best', value: bestAfter(won) },
            ],
        }), won ? 400 : 900);
    };

    const dig = (index: number) => {
        const { field: next, hitMine } = reveal(field, index);
        if (next === field) { return; }
        tap();
        setField(next);
        if (hitMine) {
            endGame(false, next);
        } else if (isCleared(next)) {
            endGame(true, next);
        }
    };

    const onCell = (index: number, longPress = false) => {
        if (over) { return; }
        const cell = field.cells[index];
        if (cell.open) { return; }
        if (tool === 'flag' || longPress) {
            if (!field.placed) { return; }
            tap();
            setField(toggleFlag(field, index));
            return;
        }
        if (!cell.flag) { dig(index); }
    };

    const hint = async () => {
        if (over || !field.placed) { return; }
        const index = safeHint(field);
        if (index < 0 || !(await spendCoins(HINT_COST))) { return; }
        dig(index);
    };

    const gap = 3;
    const cellSize = (size - 20 - gap * (field.cols - 1)) / field.cols;

    return (
        <GameShell
            title="Mine Finder"
            background={COLOR.tint}
            action={{ icon: 'rotate-ccw', label: 'New field', onPress: () => reset() }}
            footer={
                <View style={styles.footerRow}>
                    <ChunkyButton
                        label={`Safe hint · ${HINT_COST}`}
                        icon="lightbulb"
                        style={styles.flex}
                        disabled={!field.placed || !!over || coins < HINT_COST}
                        onPress={hint}
                    />
                    <View style={styles.flex}>
                        <Segmented
                            label="Field size"
                            value={level}
                            onChange={next => { setLevel(next); reset(next); }}
                            options={[{ value: 'easy', label: '9×9' }, { value: 'medium', label: '12×12' }]}
                        />
                    </View>
                </View>
            }>
            <View style={styles.row}>
                <StatChip label="MINES LEFT" value={flagsLeft(field)} highlight={COLOR.main} />
                <StatChip label="TIME" value={formatTime(seconds)} />
                <StatChip label="BEST" value={stats.best != null ? formatTime(stats.best) : '–'} />
            </View>

            <View style={[styles.field, { width: size, gap }]} accessibilityLabel={`Mine field, ${field.rows} by ${field.cols}`}>
                {field.cells.map((cell, index) => {
                    let content: React.ReactNode = null;
                    let background: string = colors.card;
                    let label = 'Hidden';
                    if (cell.open && cell.mine) {
                        background = COLOR.main;
                        label = 'Mine';
                        content = <Lucide name="bomb" size={cellSize * 0.55} color={colors.ink} />;
                    } else if (cell.open) {
                        background = colors.sand;
                        label = cell.near ? `${cell.near} mines near` : 'Empty';
                        content = cell.near ? (
                            <Text style={[styles.number, { color: NUMBER_COLORS[cell.near], fontSize: cellSize * 0.55 }]}>{cell.near}</Text>
                        ) : null;
                    } else if (cell.flag) {
                        background = COLOR.main;
                        label = 'Flagged';
                        content = <Lucide name="flag" size={cellSize * 0.5} color={colors.ink} />;
                    }
                    return (
                        <Pressable
                            key={index}
                            onPress={() => onCell(index)}
                            onLongPress={() => onCell(index, true)}
                            delayLongPress={300}
                            accessibilityRole="button"
                            accessibilityLabel={`Row ${Math.floor(index / field.cols) + 1}, column ${(index % field.cols) + 1}, ${label}`}
                            style={[
                                styles.cell,
                                { width: cellSize, height: cellSize, backgroundColor: background },
                                !cell.open && styles.raised,
                            ]}>
                            {content}
                        </Pressable>
                    );
                })}
            </View>

            <Segmented
                label="Tap mode"
                value={tool}
                onChange={setTool}
                options={[{ value: 'dig', label: 'Dig' }, { value: 'flag', label: 'Flag' }]}
            />
            <Text style={styles.hint}>Numbers show how many mines touch a square. Long-press to flag.</Text>

            <ResultModal result={result} onPlayAgain={() => reset()} />
        </GameShell>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    field: {
        alignSelf: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: colors.ink,
        borderRadius: 20,
        ...outlined,
        padding: 8,
    },
    cell: { borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    raised: { borderBottomWidth: 3, borderBottomColor: 'rgba(43,33,64,0.25)' },
    number: { fontFamily: fonts.display },
    hint: { fontSize: 14, fontFamily: fonts.bold, color: colors.muted, textAlign: 'center' },
    footerRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    flex: { flex: 1 },
});
