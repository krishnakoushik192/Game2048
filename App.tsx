import React from 'react';
import './global.css';
import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainView from './src/MainView';

const BG = '#080c18';

function App() {
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
          <MainView />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
