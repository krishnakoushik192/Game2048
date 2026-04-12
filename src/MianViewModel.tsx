import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directions, Gesture } from 'react-native-gesture-handler';

type Direction = 'left' | 'right' | 'up' | 'down';
type MergePosition = { row: number; col: number };

const GRID_SIZE = 4;
const BEST_SCORE_STORAGE_KEY = '@game2048_best_score';
const TUTORIAL_SEEN_KEY = '@game2048_tutorial_seen';
const INITIAL_BOARD: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0),
);

export const useMainViewModel = () => {
    const transpose = useCallback((grid: number[][]) => {
        return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
    }, []);

    const moveLeft = useCallback((row: number[]) => {
        let filteredRow = row.filter(num => num !== 0);
        let mergeScore = 0;
        const mergedIndices: number[] = [];
        for (let index = 0; index < filteredRow.length; index += 1) {
            if (filteredRow[index] === filteredRow[index + 1]) {
                filteredRow[index] *= 2;
                mergeScore += filteredRow[index];
                filteredRow[index + 1] = 0;
                mergedIndices.push(index);
            }
        }
        filteredRow = filteredRow.filter(num => num !== 0);
        while (row.length !== filteredRow.length) {
            filteredRow.push(0);
        }
        return { row: filteredRow, mergeScore, mergedIndices };
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
                mergedIndices,
            };
        },
        [moveLeft],
    );

    const moveUp = useCallback(
        (grid: number[][]) => {
            let transposedGrid = transpose(grid);
            let mergeScore = 0;
            const mergedPositions: MergePosition[] = [];
            transposedGrid = transposedGrid.map((row, colIndex) => {
                const movedRow = moveLeft(row);
                mergeScore += movedRow.mergeScore;
                movedRow.mergedIndices.forEach(rowIndex => {
                    mergedPositions.push({ row: rowIndex, col: colIndex });
                });
                return movedRow.row;
            });
            return { grid: transpose(transposedGrid), mergeScore, mergedPositions };
        },
        [moveLeft, transpose],
    );

    const moveDown = useCallback(
        (grid: number[][]) => {
            let transposedGrid = transpose(grid);
            let mergeScore = 0;
            const mergedPositions: MergePosition[] = [];
            transposedGrid = transposedGrid.map((row, rowIndex) => {
                const movedRow = moveRight(row);
                mergeScore += movedRow.mergeScore;
                movedRow.mergedIndices.forEach(colIndex => {
                    mergedPositions.push({ row: colIndex, col: rowIndex });
                });
                return movedRow.row;
            });
            return { grid: transpose(transposedGrid), mergeScore, mergedPositions };
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

    const initial = useMemo(() => initializeBoard(), [initializeBoard]);
    const [board, setBoard] = useState<number[][]>(initial.board);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [isBestScoreLoaded, setIsBestScoreLoaded] = useState(false);
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

    // Undo history
    const [history, setHistory] = useState<Array<{ board: number[][]; score: number }>>([]);
    const canUndo = history.length > 0;

    // Tutorial
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialLoaded, setTutorialLoaded] = useState(false);

    useEffect(() => {
        const loadTutorial = async () => {
            try {
                const seen = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
                if (seen !== 'true') {
                    setShowTutorial(true);
                }
            } catch {
                // Ignore errors
            }
            setTutorialLoaded(true);
        };
        loadTutorial();
    }, []);

    const dismissTutorial = useCallback(async () => {
        setShowTutorial(false);
        try {
            await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
        } catch {
            // Ignore errors
        }
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
        if (!isBestScoreLoaded) { return; }
        AsyncStorage.setItem(BEST_SCORE_STORAGE_KEY, String(bestScore)).catch(error => {
            console.warn('Failed to save best score', error);
        });
    }, [bestScore, isBestScoreLoaded]);

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

    const applyMove = useCallback(
        (direction: Direction) => {
            if (isGameOver) { return; }
            setBoard(currentBoard => {
                let movedBoard = currentBoard;
                let mergeScore = 0;
                let mergedPositions: MergePosition[] = [];

                if (direction === 'left') {
                    movedBoard = currentBoard.map((row, rowIndex) => {
                        const movedRow = moveLeft(row);
                        mergeScore += movedRow.mergeScore;
                        movedRow.mergedIndices.forEach(colIndex => {
                            mergedPositions.push({ row: rowIndex, col: colIndex });
                        });
                        return movedRow.row;
                    });
                } else if (direction === 'right') {
                    movedBoard = currentBoard.map((row, rowIndex) => {
                        const movedRow = moveRight(row);
                        mergeScore += movedRow.mergeScore;
                        movedRow.mergedIndices.forEach(colIndex => {
                            mergedPositions.push({ row: rowIndex, col: colIndex });
                        });
                        return movedRow.row;
                    });
                } else if (direction === 'up') {
                    const movedUp = moveUp(currentBoard);
                    movedBoard = movedUp.grid;
                    mergeScore = movedUp.mergeScore;
                    mergedPositions = movedUp.mergedPositions;
                } else if (direction === 'down') {
                    const movedDown = moveDown(currentBoard);
                    movedBoard = movedDown.grid;
                    mergeScore = movedDown.mergeScore;
                    mergedPositions = movedDown.mergedPositions;
                }

                if (isGridEqual(currentBoard, movedBoard)) {
                    if (!hasMovesAvailable(currentBoard)) {
                        setIsGameOver(true);
                    }
                    return currentBoard;
                }

                setHistory(prev => {
                    const snap = { board: currentBoard.map(r => [...r]), score: 0 };
                    return [...prev, snap];
                });
                setScore(prevScore => {
                    setHistory(prev => {
                        if (prev.length > 0) {
                            const last = prev[prev.length - 1];
                            last.score = prevScore;
                        }
                        return prev;
                    });
                    return prevScore;
                });

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
        ],
    );

    const undoMove = useCallback(() => {
        if (history.length === 0 || isGameOver) { return; }
        const last = history[history.length - 1];
        setBoard(last.board);
        setScore(last.score);
        setHistory(prev => prev.slice(0, -1));
        setMergedCells([]);
        setNewTileCells([]);
    }, [history, isGameOver]);

    const keepPlaying = useCallback(() => {
        setShowWinModal(false);
        setKeepPlayingAfterWin(true);
    }, []);

    const flingRight = useMemo(
        () => Gesture.Fling().direction(Directions.RIGHT).onEnd(() => applyMove('right')),
        [applyMove],
    );
    const flingLeft = useMemo(
        () => Gesture.Fling().direction(Directions.LEFT).onEnd(() => applyMove('left')),
        [applyMove],
    );
    const flingUp = useMemo(
        () => Gesture.Fling().direction(Directions.UP).onEnd(() => applyMove('up')),
        [applyMove],
    );
    const flingDown = useMemo(
        () => Gesture.Fling().direction(Directions.DOWN).onEnd(() => applyMove('down')),
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
        prevBestScoreRef.current = bestScore;
    }, [bestScore, initializeBoard]);

    return {
        board,
        score,
        bestScore,
        scoreAdded,
        scoreBumpTick,
        showHighScoreAnimation,
        showGameOverModal,
        showWinModal,
        mergedCells,
        newTileCells,
        mergeAnimationTick,
        spawnAnimationTick,
        gesture,
        canUndo,
        showTutorial,
        tutorialLoaded,
        retryGame,
        undoMove,
        keepPlaying,
        dismissTutorial,
    };
};
