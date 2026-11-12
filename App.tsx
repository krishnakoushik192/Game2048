import React, { useEffect, useState } from 'react';
import './global.css';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainView from './src/MainView';
import HomeScreen from './src/HomeScreen';
import WelcomeScreen from './src/WelcomeScreen';
import TicTacToeScreen from './src/games/tictactoe/TicTacToeScreen';
import MemoryScreen from './src/games/memory/MemoryScreen';
import ColorRecallScreen from './src/games/colorRecall/ColorRecallScreen';
import SlidePuzzleScreen from './src/games/slide/SlidePuzzleScreen';
import DropFourScreen from './src/games/dropFour/DropFourScreen';
import SnakeScreen from './src/games/snake/SnakeScreen';
import MineFinderScreen from './src/games/mines/MineFinderScreen';
import { PlayboxProvider } from './src/shared/playbox';
import { colors } from './src/theme';
import { RootStackParamList, WELCOME_SEEN_KEY } from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SEEN_KEY)
      .then(seen => setInitialRoute(seen === 'true' ? 'Home' : 'Welcome'))
      .catch(() => setInitialRoute('Welcome'));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
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
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
});

export default App;
