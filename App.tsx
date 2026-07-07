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
import { RootStackParamList, TUTORIAL_SEEN_KEY } from './src/navigation';
import { PALETTE } from './src/theme';
import AmbientGlow from './src/components/AmbientGlow';

const BG = PALETTE.bg;
const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const loadInitialRoute = async () => {
      try {
        const seen = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
        setInitialRoute(seen === 'true' ? 'Game' : 'Tutorial');
      } catch {
        setInitialRoute('Tutorial');
      }
    };

    loadInitialRoute();
  }, []);

  return (
    // NOTE: keep the background as part of `className` (not a separate `style`
    // prop) on GestureHandlerRootView — combining `style` with `className` on
    // this component causes NativeWind to drop the className styles entirely
    // (including `flex-1`), which collapses the whole app to a blank screen.
    <GestureHandlerRootView className="flex-1 bg-[#050505]">
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={BG}
          translucent={false}
        />
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <AmbientGlow />
          {initialRoute && (
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                }}>
                <Stack.Screen name="Tutorial" component={TutorialView} />
                <Stack.Screen name="Game" component={MainView} />
              </Stack.Navigator>
            </NavigationContainer>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
