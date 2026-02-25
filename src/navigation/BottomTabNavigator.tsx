import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import HomeScreen from '../screens/HomeScreen';
import RoutineScreen from '../screens/RoutineScreen';
import CameraScreen from '../screens/CameraScreen';
import ChatScreen from '../screens/ChatScreen';
import MoreScreen from '../screens/MoreScreen';

export type MainTabParamList = {
  HomeScreen: undefined;
  RoutineScreen: undefined;
  CameraScreen: undefined;
  ChatScreen: undefined;
  MoreScreen: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function BottomTabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.cardBg,
          borderTopWidth: 1,
          borderTopColor: theme.textSecondary + '40',
          paddingTop: 8,
          paddingBottom: 24,
          height: 70,
          shadowColor: theme.shadow as string,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabHome'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RoutineScreen"
        component={RoutineScreen}
        options={{
          tabBarLabel: t('tabRoutine'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{
          tabBarLabel: t('tabCamera'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="camera" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          tabBarLabel: t('tabChat'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="message-circle" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MoreScreen"
        component={MoreScreen}
        options={{
          tabBarLabel: t('tabMore'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="more-horizontal" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
