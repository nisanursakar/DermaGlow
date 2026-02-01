import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoutineScreen from '../screens/RoutineScreen';
// import HomeScreen from '../screens/HomeScreen';
// import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Routine"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Routine" component={RoutineScreen} />

        {/* Şimdilik kapalı */}
        {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
        {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
