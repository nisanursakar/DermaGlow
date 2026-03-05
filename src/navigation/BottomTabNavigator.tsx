import React from 'react';
import { View } from 'react-native';
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

// Tab bar arka planı her zaman güncel temayı kullansın (karanlık modda köşe uyumsuzluğu olmasın)
function TabBarBackground() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.cardBg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: theme.textSecondary + '40',
        shadowColor: theme.shadowStrong ?? '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 8,
      }}
    />
  );
}

export default function BottomTabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      key={theme.cardBg}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 24,
          height: 70,
          elevation: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () => <TabBarBackground />,
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
