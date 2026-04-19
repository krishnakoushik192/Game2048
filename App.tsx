import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainView from './src/MainView';

const BG = '#080c18';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={BG}
          translucent={false}
        />
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <MainView />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: 'rgba(0,100,255,0.25)',
  },
});

export default App;
