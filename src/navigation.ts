export type RootStackParamList = {
    Welcome: undefined;
    Home: undefined;
    Game: undefined;
    TicTacToe: undefined;
    Memory: undefined;
    ColorRecall: undefined;
    SlidePuzzle: undefined;
    DropFour: undefined;
    Snake: undefined;
    MineFinder: undefined;
};

/** Same key the old 2048 tutorial used, so existing players skip the welcome. */
export const WELCOME_SEEN_KEY = '@game2048_tutorial_seen';
