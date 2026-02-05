import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
// Yeni oluşturduğun Context'i buraya ekliyoruz
import { RoutineProvider } from './src/context/RoutineContext';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Uygulamanın tamamını veri havuzu ile sarmalıyoruz */}
      <RoutineProvider>
        <AppNavigator />
      </RoutineProvider>
    </SafeAreaProvider>
  );
}