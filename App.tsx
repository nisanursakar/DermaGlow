import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
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
import { supabase } from './supabase';

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

/** Recovery link'teki #access_token ve refresh_token ile Supabase oturumunu kurar. */
function parseRecoverySessionFromUrl(url: string | null): void {
  if (!url || !url.includes('reset-password') || !url.includes('#')) return;
  const hash = url.split('#')[1];
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token }).catch(() => {});
  }
}

export default function App() {
  useEffect(() => {
    Linking.getInitialURL().then(parseRecoverySessionFromUrl);
    const sub = Linking.addEventListener('url', (event) => parseRecoverySessionFromUrl(event.url));
    return () => sub.remove();
  }, []);

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