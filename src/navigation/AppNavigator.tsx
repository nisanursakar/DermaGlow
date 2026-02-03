import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// import RoutineScreen from '../screens/RoutineScreen';
// import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
// import LoginScreen from '../screens/LoginScreen';

export type RootStackParamList = {
  // HomeScreen: undefined;
  // RoutineScreen: undefined;
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

        {/* <Stack.Screen name="HomeScreen" component={HomeScreen} /> */}
        {/* <Stack.Screen name="RoutineScreen" component={RoutineScreen} /> */}
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
