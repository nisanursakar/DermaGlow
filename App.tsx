import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return  <HomeScreen />; (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
