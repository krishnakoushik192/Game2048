import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainView from './src/MainView';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#faf8ef"
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
    backgroundColor: '#faf8ef',
  },
  container: {
    flex: 1,
    backgroundColor: '#faf8ef',
  },
});

export default App;
