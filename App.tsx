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

const BG = '#080c18';
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
    <GestureHandlerRootView className="flex-1 bg-[#080c18]">
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={BG}
          translucent={false}
        />
        <SafeAreaView
          className="flex-1 border border-[rgba(0,100,255,0.25)] bg-[#080c18]"
          edges={['top', 'bottom']}>
          {initialRoute && (
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: BG },
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
