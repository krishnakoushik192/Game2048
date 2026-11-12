import React, { useEffect, useState } from 'react';
import './global.css';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainView from './src/MainView';
import TutorialView from './src/TutorialView';
import HomeScreen from './src/HomeScreen';
import TicTacToeScreen from './src/games/tictactoe/TicTacToeScreen';
import MemoryScreen from './src/games/memory/MemoryScreen';
import ColorRecallScreen from './src/games/colorRecall/ColorRecallScreen';
import SlidePuzzleScreen from './src/games/slide/SlidePuzzleScreen';
import DropFourScreen from './src/games/dropFour/DropFourScreen';
import SnakeScreen from './src/games/snake/SnakeScreen';
import MineFinderScreen from './src/games/mines/MineFinderScreen';
import { PlayboxProvider } from './src/shared/playbox';
import { colors } from './src/theme';
import { RootStackParamList, TUTORIAL_SEEN_KEY } from './src/navigation';

const LEGACY_BG = '#080c18';
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The tutorial still uses the dark look and expects the safe area to be
 * handled for it. Every other screen handles its own insets.
 */
function withLegacyFrame<P extends object>(Screen: React.ComponentType<P>) {
  return function LegacyScreen(props: P) {
    return (
      <SafeAreaView
        className="flex-1 border-t-2 border-r-2 border-l-2 border-[rgba(0,100,255,0.25)] bg-[#080c18]"
        edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={LEGACY_BG} />
        <Screen {...props} />
      </SafeAreaView>
    );
  };
}

const LegacyTutorial = withLegacyFrame(TutorialView);

function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const loadInitialRoute = async () => {
      try {
        const seen = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
        setInitialRoute(seen === 'true' ? 'Home' : 'Tutorial');
      } catch {
        setInitialRoute('Tutorial');
      }
    };

    loadInitialRoute();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaProvider>
        <PlayboxProvider>
          {initialRoute && (
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.cream },
                }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Tutorial" component={LegacyTutorial} />
                <Stack.Screen name="Game" component={MainView} />
                <Stack.Screen name="TicTacToe" component={TicTacToeScreen} />
                <Stack.Screen name="Memory" component={MemoryScreen} />
                <Stack.Screen name="ColorRecall" component={ColorRecallScreen} />
                <Stack.Screen name="SlidePuzzle" component={SlidePuzzleScreen} />
                <Stack.Screen name="DropFour" component={DropFourScreen} />
                <Stack.Screen name="Snake" component={SnakeScreen} />
                <Stack.Screen name="MineFinder" component={MineFinderScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          )}
        </PlayboxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
