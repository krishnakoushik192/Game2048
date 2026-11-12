import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, gameColors, outlined, fonts } from '../../theme';
import { GameShell, useBoardSize } from '../../shared/GameShell';
import { Banner, ChunkyButton, Segmented, StatChip } from '../../shared/ui';
import { usePlaybox } from '../../shared/playbox';
import { useGameStats } from '../../shared/stats';
import { useTapSound } from '../../shared/input';
import { Board, Mark, bestMove, emptyBoard, getWinner, isFull, play, randomMove } from './logic';

type Mode = 'easy' | 'smart' | 'friend';
const COLOR = gameColors.tictactoe;
const AI_DELAY = 400;
const WIN_COINS = 10;
const DRAW_COINS = 3;

export default function TicTacToeScreen() {
    const size = useBoardSize(360);
    const { addCoins } = usePlaybox();
    const { recordResult } = useGameStats('tictactoe');
    const tap = useTapSound();
    const [mode, setMode] = useState<Mode>('smart');
    const [board, setBoard] = useState<Board>(emptyBoard);
    const [turn, setTurn] = useState<Mark>('X');
    const [starter, setStarter] = useState<Mark>('X');
    const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
    const [message, setMessage] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const winner = getWinner(board);
    const finished = !!winner || isFull(board);
    const vsAi = mode !== 'friend';

    useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); } }, []);

    const finish = useCallback((next: Board) => {
        const result = getWinner(next);
        if (!result && !isFull(next)) { return; }
        if (result) {
            setScore(s => ({ ...s, [result.winner]: s[result.winner] + 1 }));
        } else {
            setScore(s => ({ ...s, draws: s.draws + 1 }));
        }
        if (!vsAi) {
            setMessage(result ? `${result.winner} wins this round!` : 'It’s a draw!');
            return;
        }
        const youWon = result?.winner === 'X';
        const coins = youWon ? WIN_COINS : result ? 0 : DRAW_COINS;
        recordResult({ won: youWon });
        if (coins) { addCoins(coins); }
        setMessage(
            youWon ? `You win this round! +${coins} coins`
                : result ? 'The AI wins this round'
                    : `It’s a draw · +${coins} coins`,
        );
    }, [addCoins, recordResult, vsAi]);

    // Side effects stay out of state updaters so they never run twice.
    const place = useCallback((index: number, mark: Mark) => {
        const next = play(board, index, mark);
        if (!next) { return; }
        tap();
        setBoard(next);
        setTurn(mark === 'X' ? 'O' : 'X');
        finish(next);
    }, [board, finish, tap]);

    // The AI always plays O.
    useEffect(() => {
        if (!vsAi || turn !== 'O' || finished) { return; }
        timer.current = setTimeout(() => {
            const index = mode === 'smart' ? bestMove(board, 'O') : randomMove(board);
            place(index, 'O');
        }, AI_DELAY);
        return () => { if (timer.current) { clearTimeout(timer.current); } };
    }, [board, finished, mode, place, turn, vsAi]);

    const onCellPress = (index: number) => {
        if (finished || board[index] || (vsAi && turn === 'O')) { return; }
        place(index, turn);
    };

    const nextRound = () => {
        const nextStarter: Mark = starter === 'X' ? 'O' : 'X';
        setStarter(nextStarter);
        setBoard(emptyBoard());
        setTurn(nextStarter);
        setMessage(null);
    };

    const changeMode = (next: Mode) => {
        setMode(next);
        setScore({ X: 0, O: 0, draws: 0 });
        setStarter('X');
        setBoard(emptyBoard());
        setTurn('X');
        setMessage(null);
    };

    const status = finished
        ? message
        : vsAi
            ? turn === 'X' ? 'Your turn · you are X' : 'AI is thinking…'
            : `${turn}’s turn`;

    return (
        <GameShell
            tutorial="tictactoe"
            title="Tic-Tac-Toe"
            background={COLOR.tint}
            action={{ icon: 'rotate-ccw', label: 'Restart round', onPress: nextRound }}
            footer={finished ? (
                <ChunkyButton label="Next round" size="lg" color={colors.ink} textColor={colors.white} onPress={nextRound} />
            ) : null}>
            <Segmented
                label="Opponent"
                value={mode}
                onChange={changeMode}
                options={[
                    { value: 'easy', label: 'Easy AI' },
                    { value: 'smart', label: 'Smart AI' },
                    { value: 'friend', label: '2 players' },
                ]}
            />
            <View style={styles.row}>
                <StatChip label={vsAi ? 'YOU · X' : 'X'} value={score.X} highlight={COLOR.main} />
                <StatChip label="DRAWS" value={score.draws} />
                <StatChip label={vsAi ? 'AI · O' : 'O'} value={score.O} />
            </View>

            <View style={[styles.board, { width: size, height: size }]} accessibilityLabel="Tic-Tac-Toe board">
                {board.map((cell, index) => {
                    const winning = winner?.line.includes(index);
                    return (
                        <Pressable
                            key={index}
                            onPress={() => onCellPress(index)}
                            accessibilityRole="button"
                            accessibilityLabel={`Square ${index + 1}, ${cell ?? 'empty'}`}
                            style={[styles.cell, winning && { backgroundColor: colors.coin }]}>
                            <Text style={[styles.mark, { color: cell === 'X' ? colors.ink : colors.danger, fontSize: size / 5 }]}>
                                {cell ?? ''}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {status && (
                <Banner color={finished ? colors.coin : colors.card}>
                    <Text style={styles.status}>{status}</Text>
                </Banner>
            )}
        </GameShell>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    board: {
        alignSelf: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: colors.ink,
        borderRadius: 26,
        ...outlined,
        padding: 6,
        gap: 6,
    },
    cell: {
        width: '31.5%',
        height: '31.5%',
        backgroundColor: colors.card,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mark: { fontFamily: fonts.display },
    status: { flex: 1, fontSize: 16, fontFamily: fonts.heavy, color: colors.ink },
});
