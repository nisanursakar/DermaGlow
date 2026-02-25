import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { RoutineProvider } from './src/context/RoutineContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { UserProfileProvider } from './src/context/UserProfileContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <UserProfileProvider>
          <RoutineProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </RoutineProvider>
          </UserProfileProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}