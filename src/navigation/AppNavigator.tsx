import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoutineScreen from '../screens/RoutineScreen';
import HomeScreen from '../screens/HomeScreen';
// import LoginScreen from '../screens/LoginScreen';

export type RootStackParamList = {
  HomeScreen: undefined;
  RoutineScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="HomeScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="RoutineScreen" component={RoutineScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
