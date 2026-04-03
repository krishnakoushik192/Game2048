import { useCallback, useMemo, useState } from 'react';
import { Directions, Gesture } from 'react-native-gesture-handler';

type Direction = 'left' | 'right' | 'up' | 'down';
type MergePosition = { row: number; col: number };

const GRID_SIZE = 4;
const NEW_NUMBER_ARRAY = [2, 4, 8];
const INITIAL_BOARD: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0),
);

export const useMainViewModel = () => {
    const getRandomNumber = useCallback(() => {
        const randomNumber = Math.floor(Math.random() * NEW_NUMBER_ARRAY.length);
        return NEW_NUMBER_ARRAY[randomNumber];
    }, []);

    const transpose = useCallback((grid: number[][]) => {
        return grid[0].map((_, colIndex) => {
            return grid.map(row => row[colIndex]);
        });
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
        return {
            row: filteredRow,
            mergeScore,
            mergedIndices,
        };
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
            const newGrid = transpose(transposedGrid);
            return {
                grid: newGrid,
                mergeScore,
                mergedPositions,
            };
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
            const newGrid = transpose(transposedGrid);
            return {
                grid: newGrid,
                mergeScore,
                mergedPositions,
            };
        },
        [moveRight, transpose],
    );

    const addRandomTile = useCallback(
        (grid: number[][]) => {
            const emptyCells: Array<{ row: number; col: number }> = [];
            for (let row = 0; row < GRID_SIZE; row += 1) {
                for (let col = 0; col < GRID_SIZE; col += 1) {
                    if (grid[row][col] === 0) {
                        emptyCells.push({ row, col });
                    }
                }
            }
            if (emptyCells.length === 0) {
                return grid;
            }
            const randomCell =
                emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const nextGrid = grid.map(row => [...row]);
            nextGrid[randomCell.row][randomCell.col] = getRandomNumber();
            return nextGrid;
        },
        [getRandomNumber],
    );

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
        nextBoard = addRandomTile(nextBoard);
        nextBoard = addRandomTile(nextBoard);
        return nextBoard;
    }, [addRandomTile]);

    const [board, setBoard] = useState<number[][]>(() => initializeBoard());
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [mergedCells, setMergedCells] = useState<string[]>([]);
    const [mergeAnimationTick, setMergeAnimationTick] = useState(0);

    const applyMove = useCallback(
        (direction: Direction) => {
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
                    return currentBoard;
                }

                setMergedCells(mergedPositions.map(({ row, col }) => `${row}-${col}`));
                setMergeAnimationTick(prevTick => prevTick + 1);
                const nextBoard = addRandomTile(movedBoard);
                setScore(prevScore => {
                    const nextScore = prevScore + mergeScore;
                    setBestScore(prevBest => Math.max(prevBest, nextScore));
                    return nextScore;
                });
                return nextBoard;
            });
        },
        [
            addRandomTile,
            isGridEqual,
            moveDown,
            moveLeft,
            moveRight,
            moveUp,
        ],
    );

    const flingRight = useMemo(
        () =>
            Gesture.Fling()
                .direction(Directions.RIGHT)
                .onEnd(() => {
                    applyMove('right');
                }),
        [applyMove],
    );
    const flingLeft = useMemo(
        () =>
            Gesture.Fling()
                .direction(Directions.LEFT)
                .onEnd(() => {
                    applyMove('left');
                }),
        [applyMove],
    );
    const flingUp = useMemo(
        () =>
            Gesture.Fling()
                .direction(Directions.UP)
                .onEnd(() => {
                    applyMove('up');
                }),
        [applyMove],
    );
    const flingDown = useMemo(
        () =>
            Gesture.Fling()
                .direction(Directions.DOWN)
                .onEnd(() => {
                    applyMove('down');
                }),
        [applyMove],
    );

    const gesture = useMemo(
        () => Gesture.Simultaneous(flingLeft, flingRight, flingUp, flingDown),
        [flingDown, flingLeft, flingRight, flingUp],
    );

    return {
        board,
        score,
        bestScore,
        mergedCells,
        mergeAnimationTick,
        gesture,
    };
};
