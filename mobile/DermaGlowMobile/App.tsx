import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  return  <LoginScreen />; (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
