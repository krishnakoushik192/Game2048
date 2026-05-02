# Game2048 🎮

A modern React Native implementation of the classic 2048 puzzle game with swipe controls, score tracking, undo support, onboarding tutorial, and polished animations.

## Project Overview 🧩

This project is a mobile 2048 game built with React Native and TypeScript.

- Platform support: Android and iOS
- Core gameplay: 4x4 grid, swipe to move, equal tiles merge, score increases on merges
- Persistence: best score and tutorial completion are saved with AsyncStorage
- UX features: win modal, game over modal, high-score celebration banner, rotating pro tips, undo, and tutorial overlay

## Tech Stack 🛠️

- React 19
- React Native 0.84.1
- TypeScript
- `react-native-gesture-handler` for swipe/fling gestures
- `react-native-safe-area-context` for safe area handling
- `@react-native-async-storage/async-storage` for local persistence
- Jest for basic rendering tests

## How The App Is Structured 🏗️

- `App.tsx`  
  App root container with `GestureHandlerRootView`, `SafeAreaProvider`, `StatusBar`, and the main game screen.

- `src/MainView.tsx`  
  Presentation/UI layer for:

  - Header and score cards
  - 4x4 board rendering
  - Action buttons (Undo, New Game)
  - Win / Game Over modals
  - High score banner
  - Tutorial/onboarding overlay
  - Pro tip card and tile animations

- `src/MianViewModel.tsx`  
  Game logic and state management layer (hook: `useMainViewModel`) for:

  - Tile movement and merge rules (`left/right/up/down`)
  - Random tile spawning (`2` in most cases, occasional `4`)
  - Score and best-score calculations
  - Undo history
  - Win/game-over detection
  - Gesture handling setup
  - AsyncStorage integration

- `index.js`  
  React Native entry point, registers the app component.

- `__tests__/App.test.tsx`  
  Basic render test to ensure app boots in test environment.

## Gameplay Rules 🎯

- Board size is `4x4`.
- Swipe in any direction to move all tiles.
- Tiles with the same value merge when they collide.
- Each merge adds the merged tile value to your score.
- Reach tile `2048` to trigger the win state.
- Continue after winning or start a new game.
- Game ends when no moves are available.

## Saved Data 💾

The app stores the following values locally:

- `@game2048_best_score` - highest score achieved
- `@game2048_tutorial_seen` - whether onboarding was dismissed

## Development Setup 🚀

### Prerequisites ✅

- Node.js `>= 22.11.0`
- React Native environment configured ([official setup guide](https://reactnative.dev/docs/environment-setup))
- Android Studio (for Android) and/or Xcode (for iOS)

### Install Dependencies 📦

```bash
npm install
```

### Start Metro ▶️

```bash
npm start
```

### Run on Android 🤖

```bash
npm run android
```

### Run on iOS 🍎

```bash
bundle install
bundle exec pod install
npm run ios
```

## Useful Scripts 🧪

- `npm start` - start Metro bundler
- `npm run android` - build and run Android app
- `npm run ios` - build and run iOS app
- `npm run lint` - run ESLint
- `npm test` - run Jest tests

## Android Build Notes 📱

- Application ID: `com.game2048`
- Min SDK: `24`
- Target/Compile SDK: `36`
- Version: `1.0` (`versionCode` 1)
- Hermes is enabled (`android/gradle.properties`)

## Current Status ✅

The project is fully playable with polished UI and game-state persistence.  
Next common improvements could include:

- Better unit/integration test coverage for move/merge logic
- Animations for new tile spawn (a tracked state already exists)
- Release signing configuration for production APK/AAB

## APK Placeholder 📥

APK download link:

- **APK 🚧:** [Download APK](https://drive.google.com/file/d/1B3zUbIT9LSAN-jwff7n-qnFMSNDjKBLb/view?usp=sharing)
