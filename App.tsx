import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  getStateFromPath,
} from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import AppNavigator, { type RootStackParamList } from './src/navigation/AppNavigator';
import { RoutineProvider } from './src/context/RoutineContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { UserProfileProvider } from './src/context/UserProfileContext';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['com.dermaglow://'], // Supabase Auth redirect URL (scheme) ile aynı olmalı
  config: {
    screens: {
      // Stack name="ResetPasswordScreen" ile eşleşiyor
      ResetPasswordScreen: 'reset-password',
    },
  },
  getStateFromPath(path, options) {
    // Supabase recovery links genellikle şu formdadır:
    // com.dermaglow://reset-password#access_token=...&type=recovery&...
    // React Navigation'a gelen path 'reset-password#access_token=...' olabilir.
    // Hash ve token kısmını atıp sadece 'reset-password' ile eşleştiriyoruz.
    const basePath = path.startsWith('reset-password')
      ? 'reset-password'
      : path.split('#')[0];

    return getStateFromPath(basePath, options);
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <UserProfileProvider>
            <RoutineProvider>
              <NavigationContainer linking={linking}>
                <AppNavigator />
              </NavigationContainer>
            </RoutineProvider>
          </UserProfileProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}