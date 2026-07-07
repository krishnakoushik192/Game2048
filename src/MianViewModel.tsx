import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directions, Gesture } from 'react-native-gesture-handler';

type Direction = 'left' | 'right' | 'up' | 'down';
type MergePosition = { row: number; col: number };
export type PowerMode = 'destroy' | 'blast' | null;
export type PowerKind = 'destroy' | 'blast';
export type PowerPurchaseKind = PowerKind | 'shop';

const GRID_SIZE = 4;
const SCORE_STORAGE_KEY = '@game2048_score';
const BEST_SCORE_STORAGE_KEY = '@game2048_best_score';
const COINS_STORAGE_KEY = '@game2048_coins';
const DESTROY_POWER_STORAGE_KEY = '@game2048_destroy_power';
const BLAST_POWER_STORAGE_KEY = '@game2048_blast_power';
const INITIAL_POWER_USES = 3;
const DESTROY_POWER_COST = 50;
const BLAST_POWER_COST = 100;
const INITIAL_BOARD: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0),
);

type HistorySnapshot = {
    board: number[][];
    score: number;
    coins: number;
    destroyUses: number;
    blastUses: number;
};

const calculateMergeCoinsForValue = (tileValue: number) => {
    if (tileValue === 256) { return 25; }
    if (tileValue === 512) { return 75; }
    if (tileValue === 1024) { return 125; }
    if (tileValue >= 2048) { return 200; }
    return 0;
};

export const useMainViewModel = () => {
    const transpose = useCallback((grid: number[][]) => {
        return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
    }, []);

    const moveLeft = useCallback((row: number[]) => {
        let filteredRow = row.filter(num => num !== 0);
        let mergeScore = 0;
        let mergeCoins = 0;
        const mergedIndices: number[] = [];
        for (let index = 0; index < filteredRow.length; index += 1) {
            if (filteredRow[index] === filteredRow[index + 1]) {
                filteredRow[index] *= 2;
                mergeScore += filteredRow[index];
                mergeCoins += calculateMergeCoinsForValue(filteredRow[index]);
                filteredRow[index + 1] = 0;
                mergedIndices.push(index);
            }
        }
        filteredRow = filteredRow.filter(num => num !== 0);
        while (row.length !== filteredRow.length) {
            filteredRow.push(0);
        }
        return { row: filteredRow, mergeScore, mergeCoins, mergedIndices };
    }, []);

    const moveRight = useCallback(
        (row: number[]) => {
            const movedRight = moveLeft([...row].reverse());
            const mergedIndices = movedRight.mergedIndices.map(
                index => row.length - 1 - index,
            );
            return {
                row: movedRight.row.reverse(),
                mergeScore: movedRight.mergeScore,
                mergeCoins: movedRight.mergeCoins,
                mergedIndices,
            };
        },
        [moveLeft],
    );

    const moveUp = useCallback(
        (grid: number[][]) => {
            let transposedGrid = transpose(grid);
            let mergeScore = 0;
            let mergeCoins = 0;
            const mergedPositions: MergePosition[] = [];
            transposedGrid = transposedGrid.map((row, colIndex) => {
                const movedRow = moveLeft(row);
                mergeScore += movedRow.mergeScore;
                mergeCoins += movedRow.mergeCoins;
                movedRow.mergedIndices.forEach(rowIndex => {
                    mergedPositions.push({ row: rowIndex, col: colIndex });
                });
                return movedRow.row;
            });
            return { grid: transpose(transposedGrid), mergeScore, mergeCoins, mergedPositions };
        },
        [moveLeft, transpose],
    );

    const moveDown = useCallback(
        (grid: number[][]) => {
            let transposedGrid = transpose(grid);
            let mergeScore = 0;
            let mergeCoins = 0;
            const mergedPositions: MergePosition[] = [];
            transposedGrid = transposedGrid.map((row, rowIndex) => {
                const movedRow = moveRight(row);
                mergeScore += movedRow.mergeScore;
                mergeCoins += movedRow.mergeCoins;
                movedRow.mergedIndices.forEach(colIndex => {
                    mergedPositions.push({ row: colIndex, col: rowIndex });
                });
                return movedRow.row;
            });
            return { grid: transpose(transposedGrid), mergeScore, mergeCoins, mergedPositions };
        },
        [moveRight, transpose],
    );

    const addRandomTile = useCallback((grid: number[][]) => {
        const emptyCells: Array<{ row: number; col: number }> = [];
        for (let row = 0; row < GRID_SIZE; row += 1) {
            for (let col = 0; col < GRID_SIZE; col += 1) {
                if (grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        if (emptyCells.length === 0) {
            return { grid, newTile: null };
        }
        const randomCell =
            emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const nextGrid = grid.map(row => [...row]);
        const value = Math.random() < 0.9 ? 2 : 4;
        nextGrid[randomCell.row][randomCell.col] = value;
        return {
            grid: nextGrid,
            newTile: `${randomCell.row}-${randomCell.col}`,
        };
    }, []);

    const isGridEqual = useCallback((a: number[][], b: number[][]) => {
        for (let row = 0; row < GRID_SIZE; row += 1) {
            for (let col = 0; col < GRID_SIZE; col += 1) {
                if (a[row][col] !== b[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }, []);

    const initializeBoard = useCallback(() => {
        let nextBoard = INITIAL_BOARD.map(row => [...row]);
        const first = addRandomTile(nextBoard);
        nextBoard = first.grid;
        const second = addRandomTile(nextBoard);
        nextBoard = second.grid;
        const newTiles: string[] = [];
        if (first.newTile) { newTiles.push(first.newTile); }
        if (second.newTile) { newTiles.push(second.newTile); }
        return { board: nextBoard, newTiles };
    }, [addRandomTile]);

    const hasMovesAvailable = useCallback((grid: number[][]) => {
        for (let row = 0; row < GRID_SIZE; row += 1) {
            for (let col = 0; col < GRID_SIZE; col += 1) {
                const value = grid[row][col];
                if (value === 0) { return true; }
                if (col + 1 < GRID_SIZE && value === grid[row][col + 1]) { return true; }
                if (row + 1 < GRID_SIZE && value === grid[row + 1][col]) { return true; }
            }
        }
        return false;
    }, []);

    const hasReached2048 = useCallback((grid: number[][]) => {
        for (let row = 0; row < GRID_SIZE; row += 1) {
            for (let col = 0; col < GRID_SIZE; col += 1) {
                if (grid[row][col] >= 2048) { return true; }
            }
        }
        return false;
    }, []);

    const hasTiles = useCallback((grid: number[][]) => {
        return grid.some(row => row.some(value => value > 0));
    }, []);

    const countTiles = useCallback((grid: number[][]) => {
        return grid.reduce((total, row) => total + row.filter(value => value > 0).length, 0);
    }, []);

    const initial = useMemo(() => initializeBoard(), [initializeBoard]);
    const [board, setBoard] = useState<number[][]>(initial.board);
    const [score, setScore] = useState(0);
    const [isScoreLoaded, setIsScoreLoaded] = useState(false);
    const [bestScore, setBestScore] = useState(0);
    const [isBestScoreLoaded, setIsBestScoreLoaded] = useState(false);
    const [coins, setCoins] = useState(0);
    const [destroyUses, setDestroyUses] = useState(INITIAL_POWER_USES);
    const [blastUses, setBlastUses] = useState(INITIAL_POWER_USES);
    const [isPowerStateLoaded, setIsPowerStateLoaded] = useState(false);
    const [activePowerMode, setActivePowerMode] = useState<PowerMode>(null);
    const [pendingPurchasePower, setPendingPurchasePower] = useState<PowerPurchaseKind | null>(null);
    const [showInsufficientCoinsModal, setShowInsufficientCoinsModal] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [hasWon, setHasWon] = useState(false);
    const [showWinModal, setShowWinModal] = useState(false);
    const [keepPlayingAfterWin, setKeepPlayingAfterWin] = useState(false);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [showHighScoreAnimation, setShowHighScoreAnimation] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevBestScoreRef = useRef(0);
    const [mergedCells, setMergedCells] = useState<string[]>([]);
    const [newTileCells, setNewTileCells] = useState<string[]>(initial.newTiles);
    const [mergeAnimationTick, setMergeAnimationTick] = useState(0);
    const [spawnAnimationTick, setSpawnAnimationTick] = useState(0);
    const [scoreAdded, setScoreAdded] = useState(0);
    const [scoreBumpTick, setScoreBumpTick] = useState(0);
    const [coinsAdded, setCoinsAdded] = useState(0);
    const [coinsBumpTick, setCoinsBumpTick] = useState(0);
    const [powerActionCells, setPowerActionCells] = useState<string[]>([]);
    const [powerAnimationTick, setPowerAnimationTick] = useState(0);

    // Undo history
    const [history, setHistory] = useState<HistorySnapshot[]>([]);
    const canUndo = history.length > 0;
    const scoreRef = useRef(score);
    const coinsRef = useRef(coins);
    const destroyUsesRef = useRef(destroyUses);
    const blastUsesRef = useRef(blastUses);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { coinsRef.current = coins; }, [coins]);
    useEffect(() => { destroyUsesRef.current = destroyUses; }, [destroyUses]);
    useEffect(() => { blastUsesRef.current = blastUses; }, [blastUses]);

    useEffect(() => {
        const loadScore = async () => {
            try {
                const storedValue = await AsyncStorage.getItem(SCORE_STORAGE_KEY);
                if (storedValue == null) {
                    setIsScoreLoaded(true);
                    return;
                }
                const parsed = Number(storedValue);
                if (!Number.isNaN(parsed) && parsed >= 0) {
                    setScore(parsed);
                }
                setIsScoreLoaded(true);
            } catch (error) {
                console.warn('Failed to load score', error);
                setIsScoreLoaded(true);
            }
        };
        loadScore();
    }, []);

    useEffect(() => {
        const loadBestScore = async () => {
            try {
                const storedValue = await AsyncStorage.getItem(BEST_SCORE_STORAGE_KEY);
                if (storedValue == null) {
                    setIsBestScoreLoaded(true);
                    return;
                }
                const parsed = Number(storedValue);
                if (!Number.isNaN(parsed) && parsed >= 0) {
                    setBestScore(parsed);
                    prevBestScoreRef.current = parsed;
                }
                setIsBestScoreLoaded(true);
            } catch (error) {
                console.warn('Failed to load best score', error);
                setIsBestScoreLoaded(true);
            }
        };
        loadBestScore();
    }, []);

    useEffect(() => {
        if (!isScoreLoaded) { return; }
        AsyncStorage.setItem(SCORE_STORAGE_KEY, String(score)).catch(error => {
            console.warn('Failed to save score', error);
        });
    }, [score, isScoreLoaded]);

    useEffect(() => {
        const loadPowerState = async () => {
            try {
                const [storedCoins, storedDestroyUses, storedBlastUses] = await Promise.all([
                    AsyncStorage.getItem(COINS_STORAGE_KEY),
                    AsyncStorage.getItem(DESTROY_POWER_STORAGE_KEY),
                    AsyncStorage.getItem(BLAST_POWER_STORAGE_KEY),
                ]);
                const parsedCoins = Number(storedCoins);
                const parsedDestroyUses = Number(storedDestroyUses);
                const parsedBlastUses = Number(storedBlastUses);
                if (storedCoins != null && !Number.isNaN(parsedCoins) && parsedCoins >= 0) {
                    setCoins(parsedCoins);
                }
                if (storedDestroyUses != null && !Number.isNaN(parsedDestroyUses) && parsedDestroyUses >= 0) {
                    setDestroyUses(parsedDestroyUses);
                }
                if (storedBlastUses != null && !Number.isNaN(parsedBlastUses) && parsedBlastUses >= 0) {
                    setBlastUses(parsedBlastUses);
                }
            } catch (error) {
                console.warn('Failed to load power state', error);
            } finally {
                setIsPowerStateLoaded(true);
            }
        };
        loadPowerState();
    }, []);

    useEffect(() => {
        if (!isBestScoreLoaded) { return; }
        AsyncStorage.setItem(BEST_SCORE_STORAGE_KEY, String(bestScore)).catch(error => {
            console.warn('Failed to save best score', error);
        });
    }, [bestScore, isBestScoreLoaded]);

    useEffect(() => {
        if (!isPowerStateLoaded) { return; }
        AsyncStorage.setItem(COINS_STORAGE_KEY, String(coins)).catch(error => {
            console.warn('Failed to save coins', error);
        });
    }, [coins, isPowerStateLoaded]);

    useEffect(() => {
        if (!isPowerStateLoaded) { return; }
        AsyncStorage.setItem(DESTROY_POWER_STORAGE_KEY, String(destroyUses)).catch(error => {
            console.warn('Failed to save destroy power', error);
        });
    }, [destroyUses, isPowerStateLoaded]);

    useEffect(() => {
        if (!isPowerStateLoaded) { return; }
        AsyncStorage.setItem(BLAST_POWER_STORAGE_KEY, String(blastUses)).catch(error => {
            console.warn('Failed to save blast power', error);
        });
    }, [blastUses, isPowerStateLoaded]);

    useEffect(() => {
        if (!isGameOver) { return; }
        if (isNewHighScore) {
            setShowHighScoreAnimation(true);
            gameOverTimerRef.current = setTimeout(() => {
                setShowHighScoreAnimation(false);
                setShowGameOverModal(true);
            }, 3000);
        } else {
            gameOverTimerRef.current = setTimeout(() => {
                setShowGameOverModal(true);
            }, 2000);
        }
        return () => {
            if (gameOverTimerRef.current) {
                clearTimeout(gameOverTimerRef.current);
                gameOverTimerRef.current = null;
            }
        };
    }, [isGameOver, isNewHighScore]);

    const pushHistorySnapshot = useCallback((currentBoard: number[][]) => {
        setHistory(prev => [
            ...prev,
            {
                board: currentBoard.map(row => [...row]),
                score: scoreRef.current,
                coins: coinsRef.current,
                destroyUses: destroyUsesRef.current,
                blastUses: blastUsesRef.current,
            },
        ]);
    }, []);

    const applyMove = useCallback(
        (direction: Direction) => {
            if (isGameOver || activePowerMode) { return; }
            setBoard(currentBoard => {
                let movedBoard = currentBoard;
                let mergeScore = 0;
                let mergeCoins = 0;
                let mergedPositions: MergePosition[] = [];

                if (direction === 'left') {
                    movedBoard = currentBoard.map((row, rowIndex) => {
                        const movedRow = moveLeft(row);
                        mergeScore += movedRow.mergeScore;
                        mergeCoins += movedRow.mergeCoins;
                        movedRow.mergedIndices.forEach(colIndex => {
                            mergedPositions.push({ row: rowIndex, col: colIndex });
                        });
                        return movedRow.row;
                    });
                } else if (direction === 'right') {
                    movedBoard = currentBoard.map((row, rowIndex) => {
                        const movedRow = moveRight(row);
                        mergeScore += movedRow.mergeScore;
                        mergeCoins += movedRow.mergeCoins;
                        movedRow.mergedIndices.forEach(colIndex => {
                            mergedPositions.push({ row: rowIndex, col: colIndex });
                        });
                        return movedRow.row;
                    });
                } else if (direction === 'up') {
                    const movedUp = moveUp(currentBoard);
                    movedBoard = movedUp.grid;
                    mergeScore = movedUp.mergeScore;
                    mergeCoins = movedUp.mergeCoins;
                    mergedPositions = movedUp.mergedPositions;
                } else if (direction === 'down') {
                    const movedDown = moveDown(currentBoard);
                    movedBoard = movedDown.grid;
                    mergeScore = movedDown.mergeScore;
                    mergeCoins = movedDown.mergeCoins;
                    mergedPositions = movedDown.mergedPositions;
                }

                if (isGridEqual(currentBoard, movedBoard)) {
                    if (!hasMovesAvailable(currentBoard)) {
                        setIsGameOver(true);
                    }
                    return currentBoard;
                }

                pushHistorySnapshot(currentBoard);

                setMergedCells(mergedPositions.map(({ row, col }) => `${row}-${col}`));
                setMergeAnimationTick(prevTick => prevTick + 1);

                const result = addRandomTile(movedBoard);
                const nextBoard = result.grid;
                if (result.newTile) {
                    setNewTileCells([result.newTile]);
                    setSpawnAnimationTick(prevTick => prevTick + 1);
                }

                if (!hasMovesAvailable(nextBoard)) {
                    setIsGameOver(true);
                }

                if (mergeScore > 0) {
                    setScoreAdded(mergeScore);
                    setScoreBumpTick(prev => prev + 1);
                }

                if (mergeCoins > 0) {
                    setCoinsAdded(mergeCoins);
                    setCoinsBumpTick(prev => prev + 1);
                    setCoins(prevCoins => prevCoins + mergeCoins);
                }

                setScore(prevScore => {
                    const nextScore = prevScore + mergeScore;
                    setBestScore(prevBest => {
                        const newBest = Math.max(prevBest, nextScore);
                        if (newBest > prevBestScoreRef.current) {
                            setIsNewHighScore(true);
                        }
                        return newBest;
                    });
                    return nextScore;
                });

                if (!hasWon && !keepPlayingAfterWin && hasReached2048(nextBoard)) {
                    setHasWon(true);
                    setShowWinModal(true);
                }

                return nextBoard;
            });
        },
        [
            addRandomTile,
            activePowerMode,
            hasMovesAvailable,
            hasReached2048,
            hasWon,
            isGameOver,
            isGridEqual,
            keepPlayingAfterWin,
            moveDown,
            moveLeft,
            moveRight,
            moveUp,
            pushHistorySnapshot,
        ],
    );

    const undoMove = useCallback(() => {
        if (history.length === 0 || isGameOver) { return; }
        const last = history[history.length - 1];
        setBoard(last.board);
        setScore(last.score);
        setCoins(last.coins);
        setDestroyUses(last.destroyUses);
        setBlastUses(last.blastUses);
        setHistory(prev => prev.slice(0, -1));
        setMergedCells([]);
        setNewTileCells([]);
        setPowerActionCells([]);
        setActivePowerMode(null);
    }, [history, isGameOver]);

    const cancelPowerMode = useCallback(() => {
        if (powerActionCells.length > 0) { return; }
        setActivePowerMode(null);
        setPowerActionCells([]);
    }, [powerActionCells.length]);

    const activateDestroyMode = useCallback(() => {
        if (isGameOver || powerActionCells.length > 0 || !hasTiles(board)) { return; }
        if (destroyUses <= 0) {
            setPendingPurchasePower('destroy');
            return;
        }
        setActivePowerMode(prev => (prev === 'destroy' ? null : 'destroy'));
    }, [board, destroyUses, hasTiles, isGameOver, powerActionCells.length]);

    const activateBlastMode = useCallback(() => {
        if (isGameOver || powerActionCells.length > 0 || !hasTiles(board)) { return; }
        if (blastUses <= 0) {
            setPendingPurchasePower('blast');
            return;
        }
        setActivePowerMode(prev => (prev === 'blast' ? null : 'blast'));
    }, [blastUses, board, hasTiles, isGameOver, powerActionCells.length]);

    const destroyTile = useCallback((row: number, col: number) => {
        if (activePowerMode !== 'destroy' || isGameOver || powerActionCells.length > 0) { return; }
        const value = board[row]?.[col] ?? 0;
        if (value <= 0) { return; }
        if (countTiles(board) <= 1) { return; }
        const cellKey = `${row}-${col}`;
        pushHistorySnapshot(board);
        setPowerActionCells([cellKey]);
        setPowerAnimationTick(prev => prev + 1);
        setDestroyUses(prev => Math.max(0, prev - 1));
        setTimeout(() => {
            setBoard(currentBoard => currentBoard.map((boardRow, rowIndex) =>
                boardRow.map((cell, colIndex) => (rowIndex === row && colIndex === col ? 0 : cell)),
            ));
            setPowerActionCells([]);
            setActivePowerMode(null);
            setIsGameOver(false);
            setShowGameOverModal(false);
        }, 260);
    }, [activePowerMode, board, countTiles, isGameOver, powerActionCells.length, pushHistorySnapshot]);

    const blastNumber = useCallback((value: number) => {
        if (activePowerMode !== 'blast' || isGameOver || powerActionCells.length > 0 || value <= 0) { return; }
        const matchingCells: string[] = [];
        board.forEach((boardRow, rowIndex) => {
            boardRow.forEach((cell, colIndex) => {
                if (cell === value) {
                    matchingCells.push(`${rowIndex}-${colIndex}`);
                }
            });
        });
        if (matchingCells.length === 0) { return; }
        if (matchingCells.length >= countTiles(board)) { return; }
        pushHistorySnapshot(board);
        setPowerActionCells(matchingCells);
        setPowerAnimationTick(prev => prev + 1);
        setBlastUses(prev => Math.max(0, prev - 1));
        setTimeout(() => {
            setBoard(currentBoard => currentBoard.map(boardRow =>
                boardRow.map(cell => (cell === value ? 0 : cell)),
            ));
            setPowerActionCells([]);
            setActivePowerMode(null);
            setIsGameOver(false);
            setShowGameOverModal(false);
        }, 320);
    }, [activePowerMode, board, countTiles, isGameOver, powerActionCells.length, pushHistorySnapshot]);

    const selectPowerTile = useCallback((row: number, col: number) => {
        if (activePowerMode === 'destroy') {
            destroyTile(row, col);
            return;
        }
        if (activePowerMode === 'blast') {
            blastNumber(board[row]?.[col] ?? 0);
        }
    }, [activePowerMode, blastNumber, board, destroyTile]);

    const closePowerModal = useCallback(() => {
        setPendingPurchasePower(null);
        setShowInsufficientCoinsModal(false);
    }, []);

    const openPowerShop = useCallback(() => {
        setPendingPurchasePower('shop');
    }, []);

    const buyDestroyPower = useCallback(() => {
        if (coinsRef.current < DESTROY_POWER_COST) {
            setPendingPurchasePower(null);
            setShowInsufficientCoinsModal(true);
            return;
        }
        setCoins(prev => prev - DESTROY_POWER_COST);
        setDestroyUses(prev => prev + 1);
        setPendingPurchasePower(null);
    }, []);

    const buyBlastPower = useCallback(() => {
        if (coinsRef.current < BLAST_POWER_COST) {
            setPendingPurchasePower(null);
            setShowInsufficientCoinsModal(true);
            return;
        }
        setCoins(prev => prev - BLAST_POWER_COST);
        setBlastUses(prev => prev + 1);
        setPendingPurchasePower(null);
    }, []);

    const keepPlaying = useCallback(() => {
        setShowWinModal(false);
        setKeepPlayingAfterWin(true);
    }, []);

    const flingRight = useMemo(
        () =>
            Gesture.Fling()
                .runOnJS(true)
                .direction(Directions.RIGHT)
                .onEnd(() => applyMove('right')),
        [applyMove],
    );
    const flingLeft = useMemo(
        () =>
            Gesture.Fling()
                .runOnJS(true)
                .direction(Directions.LEFT)
                .onEnd(() => applyMove('left')),
        [applyMove],
    );
    const flingUp = useMemo(
        () =>
            Gesture.Fling()
                .runOnJS(true)
                .direction(Directions.UP)
                .onEnd(() => applyMove('up')),
        [applyMove],
    );
    const flingDown = useMemo(
        () =>
            Gesture.Fling()
                .runOnJS(true)
                .direction(Directions.DOWN)
                .onEnd(() => applyMove('down')),
        [applyMove],
    );

    const gesture = useMemo(
        () => Gesture.Simultaneous(flingLeft, flingRight, flingUp, flingDown),
        [flingDown, flingLeft, flingRight, flingUp],
    );

    const retryGame = useCallback(() => {
        const init = initializeBoard();
        setBoard(init.board);
        setNewTileCells(init.newTiles);
        setSpawnAnimationTick(prev => prev + 1);
        setScore(0);
        setMergedCells([]);
        setMergeAnimationTick(0);
        setHistory([]);
        setIsGameOver(false);
        setHasWon(false);
        setShowWinModal(false);
        setKeepPlayingAfterWin(false);
        setIsNewHighScore(false);
        setShowHighScoreAnimation(false);
        setShowGameOverModal(false);
        setScoreAdded(0);
        setCoinsAdded(0);
        setPowerActionCells([]);
        setActivePowerMode(null);
        prevBestScoreRef.current = bestScore;
    }, [bestScore, initializeBoard]);

    return {
        board,
        score,
        bestScore,
        coins,
        coinsAdded,
        coinsBumpTick,
        destroyUses,
        blastUses,
        activePowerMode,
        pendingPurchasePower,
        showInsufficientCoinsModal,
        destroyPowerCost: DESTROY_POWER_COST,
        blastPowerCost: BLAST_POWER_COST,
        scoreAdded,
        scoreBumpTick,
        showHighScoreAnimation,
        showGameOverModal,
        showWinModal,
        mergedCells,
        newTileCells,
        powerActionCells,
        powerAnimationTick,
        mergeAnimationTick,
        spawnAnimationTick,
        gesture,
        canUndo,
        retryGame,
        undoMove,
        keepPlaying,
        activateDestroyMode,
        destroyTile,
        activateBlastMode,
        blastNumber,
        selectPowerTile,
        cancelPowerMode,
        calculateMergeCoins: calculateMergeCoinsForValue,
        buyDestroyPower,
        buyBlastPower,
        closePowerModal,
        openPowerShop,
    };
};
