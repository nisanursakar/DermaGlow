import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 1. ADIM: Bu satırların başındaki yorum işaretlerini (//) kaldırdık
import RoutineScreen from '../screens/RoutineScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';

export type RootStackParamList = {
  // 2. ADIM: Tipleri aktif ettik
  HomeScreen: undefined;
  RoutineScreen: undefined;
  ChatScreen: undefined;
  ChatDetailScreen: {
    userId: string;
    userName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ChatScreen"
        screenOptions={{ headerShown: false }}
      >
        {/* 3. ADIM: Sayfaları navigasyona tekrar ekledik */}
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="RoutineScreen" component={RoutineScreen} />

        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen
          name="ChatDetailScreen"
          component={ChatDetailScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#EFE8F6',
            },
            headerTintColor: '#4B3B70',
            headerTitleStyle: {
              fontWeight: '700',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}