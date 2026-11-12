import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, gameColors, outlined, fonts } from '../../theme';
import { GameShell, useBoardSize } from '../../shared/GameShell';
import { Banner, ChunkyButton, Segmented } from '../../shared/ui';
import { usePlaybox } from '../../shared/playbox';
import { useGameStats } from '../../shared/stats';
import { useTapSound } from '../../shared/input';
import { AiLevel, COLS, Disc, Grid, ROWS, aiMove, drop, emptyGrid, findWin, isFull, opponent } from './logic';

type Mode = AiLevel | 'friend';
const COLOR = gameColors.dropFour;
const DISC_COLORS: Record<Disc, string> = { 1: '#FF6FA8', 2: '#FFC93C' };
const WIN_COINS = 15;
const HINT_COST = 30;
const AI_DELAY = 450;

export default function DropFourScreen() {
    const width = useBoardSize(380);
    const { addCoins, spendCoins, coins } = usePlaybox();
    const { recordResult } = useGameStats('dropFour');
    const tap = useTapSound();
    const [mode, setMode] = useState<Mode>('medium');
    const [grid, setGrid] = useState<Grid>(emptyGrid);
    const [turn, setTurn] = useState<Disc>(1);
    const [starter, setStarter] = useState<Disc>(1);
    const [winCells, setWinCells] = useState<Array<[number, number]> | null>(null);
    const [draw, setDraw] = useState(false);
    const [score, setScore] = useState({ 1: 0, 2: 0 });
    const [hintCol, setHintCol] = useState<number | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const vsAi = mode !== 'friend';
    const finished = !!winCells || draw;

    useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); } }, []);

    const play = useCallback((col: number, disc: Disc) => {
        const result = drop(grid, col, disc);
        if (!result) { return; }
        tap();
        setHintCol(null);
        setGrid(result.grid);
        const win = findWin(result.grid, result.row, col);
        if (win) {
            setWinCells(win);
            setScore(s => ({ ...s, [disc]: s[disc] + 1 }));
            if (vsAi) {
                const youWon = disc === 1;
                recordResult({ won: youWon });
                if (youWon) { addCoins(WIN_COINS); }
            }
            return;
        }
        if (isFull(result.grid)) {
            setDraw(true);
            if (vsAi) { recordResult({ won: false }); }
            return;
        }
        setTurn(opponent(disc));
    }, [addCoins, grid, recordResult, tap, vsAi]);

    // The AI always plays disc 2.
    useEffect(() => {
        if (!vsAi || turn !== 2 || finished) { return; }
        timer.current = setTimeout(() => play(aiMove(grid, 2, mode as AiLevel), 2), AI_DELAY);
        return () => { if (timer.current) { clearTimeout(timer.current); } };
    }, [finished, grid, mode, play, turn, vsAi]);

    const onColumn = (col: number) => {
        if (finished || (vsAi && turn === 2)) { return; }
        play(col, turn);
    };

    const nextRound = () => {
        const nextStarter = opponent(starter);
        setStarter(nextStarter);
        setGrid(emptyGrid());
        setTurn(nextStarter);
        setWinCells(null);
        setDraw(false);
        setHintCol(null);
    };

    const changeMode = (next: Mode) => {
        setMode(next);
        setScore({ 1: 0, 2: 0 });
        setStarter(1);
        setGrid(emptyGrid());
        setTurn(1);
        setWinCells(null);
        setDraw(false);
    };

    const hint = async () => {
        if (finished || (vsAi && turn === 2) || !(await spendCoins(HINT_COST))) { return; }
        setHintCol(aiMove(grid, turn, 'hard'));
    };

    const isWinCell = (r: number, c: number) => !!winCells?.some(([wr, wc]) => wr === r && wc === c);
    const gap = 5;
    const cell = (width - 24 - gap * (COLS - 1)) / COLS;
    const names: Record<Disc, string> = vsAi ? { 1: 'You', 2: 'AI' } : { 1: 'Pink', 2: 'Yellow' };

    const winner = winCells ? (grid[winCells[0][0]][winCells[0][1]] as Disc) : null;
    let status: string;
    if (winner && vsAi) {
        status = winner === 1 ? `You win! +${WIN_COINS} coins` : 'The AI wins this round';
    } else if (winner) {
        status = `${names[winner]} wins!`;
    } else if (draw) {
        status = 'Board full: it’s a draw';
    } else {
        status = vsAi && turn === 2 ? 'AI is thinking…' : `${names[turn]}: tap a column`;
    }

    return (
        <GameShell
            tutorial="dropFour"
            title="Drop Four"
            background={COLOR.tint}
            action={{ icon: 'rotate-ccw', label: 'Restart round', onPress: nextRound }}
            footer={finished ? (
                <ChunkyButton label="Next round" size="lg" color={colors.ink} textColor={colors.white} onPress={nextRound} />
            ) : (
                <ChunkyButton label={`Hint · ${HINT_COST} coins`} icon="lightbulb" disabled={coins < HINT_COST || (vsAi && turn === 2)} onPress={hint} />
            )}>
            <Segmented
                label="Opponent"
                value={mode}
                onChange={changeMode}
                options={[
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                    { value: 'friend', label: '2 players' },
                ]}
            />
            <View style={styles.players}>
                {([1, 2] as Disc[]).map(disc => (
                    <View key={disc} style={[styles.player, turn === disc && !finished && { borderColor: DISC_COLORS[disc], borderWidth: 3 }]}>
                        <View style={[styles.disc, { width: 28, height: 28, backgroundColor: DISC_COLORS[disc] }]} />
                        <Text style={styles.playerName}>{names[disc]}</Text>
                        <Text style={styles.playerScore}>{score[disc]}</Text>
                    </View>
                ))}
            </View>

            <View style={[styles.board, { width }]} accessibilityLabel="Drop Four board">
                {Array.from({ length: COLS }, (_, col) => (
                    <Pressable
                        key={col}
                        onPress={() => onColumn(col)}
                        accessibilityRole="button"
                        accessibilityLabel={`Column ${col + 1}${hintCol === col ? ', suggested' : ''}`}
                        style={[styles.column, { gap }, hintCol === col && styles.hint]}>
                        {Array.from({ length: ROWS }, (__, row) => {
                            const slot = grid[row][col];
                            return (
                                <View
                                    key={row}
                                    style={[
                                        styles.disc,
                                        { width: cell, height: cell, backgroundColor: slot ? DISC_COLORS[slot] : colors.cream },
                                        isWinCell(row, col) && { borderWidth: 4, borderColor: colors.white },
                                    ]}
                                />
                            );
                        })}
                    </Pressable>
                ))}
            </View>

            <Banner color={finished ? colors.coin : colors.card}>
                <Text style={styles.status} accessibilityLiveRegion="polite">{status}</Text>
            </Banner>
        </GameShell>
    );
}

const styles = StyleSheet.create({
    players: { flexDirection: 'row', gap: 10 },
    player: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.card,
        borderRadius: 16,
        ...outlined,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    playerName: { flex: 1, fontSize: 15, fontFamily: fonts.heavy, color: colors.ink },
    playerScore: { fontSize: 22, fontFamily: fonts.display, color: colors.ink },
    board: {
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#3D8BFF',
        borderRadius: 22,
        ...outlined,
        borderBottomWidth: 8,
        padding: 10,
    },
    column: { borderRadius: 999 },
    hint: { backgroundColor: 'rgba(255,255,255,0.45)' },
    disc: { borderRadius: 999, ...outlined },
    status: { flex: 1, fontSize: 16, fontFamily: fonts.heavy, color: colors.ink },
});
