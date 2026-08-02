import React, { useEffect } from 'react';
import { View, Platform, StatusBar, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import HomeScreen from '../screens/HomeScreen';
import RoutineScreen from '../screens/RoutineScreen';
import CameraScreen from '../screens/CameraScreen';
import PremiumScreen from '../screens/PremiumScreen';
import MoreScreen from '../screens/MoreScreen';

export type MainTabParamList = {
  HomeScreen: undefined;
  RoutineScreen: undefined;
  CameraScreen: undefined;
  PremiumScreen: undefined;
  MoreScreen: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const isColorDark = (color: string) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
};

function TabBarBackground() {
  const { theme } = useTheme();
  return (
    <View
      style={[
        tabBarStyles.bg,
        {
          backgroundColor: theme.glassBg,
          borderTopColor: theme.glassBorder,
          shadowColor: theme.shadowStrong,
        },
      ]}
    />
  );
}

const tabBarStyles = StyleSheet.create({
  bg: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
});

export default function BottomTabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const isLightMode = !isColorDark(theme.background);

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        changeNavigationBarColor(theme.background, isLightMode, true);
      } catch {
        // ignore
      }
    }
  }, [theme.background, isLightMode]);

  return (
    <>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={isLightMode ? 'dark-content' : 'light-content'}
        animated
      />
      <Tab.Navigator
        key={theme.cardBg}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: Math.max(10, insets.bottom + 6),
            height: 64 + insets.bottom,
            elevation: 0,
          },
          tabBarBackground: () => <TabBarBackground />,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tab.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{
            tabBarLabel: t('tabHome'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[iconStyles.wrap, focused && { backgroundColor: theme.mint }]}>
                <Icon name="home" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="RoutineScreen"
          component={RoutineScreen}
          options={{
            tabBarLabel: t('tabRoutine'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[iconStyles.wrap, focused && { backgroundColor: theme.mint }]}>
                <Icon name="calendar" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="CameraScreen"
          component={CameraScreen}
          options={{
            tabBarLabel: t('tabCamera'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[iconStyles.cameraWrap, { backgroundColor: focused ? theme.primary : theme.mint }]}>
                <Icon name="camera" size={24} color={focused ? theme.textOnPrimary : theme.primary} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="PremiumScreen"
          component={PremiumScreen}
          options={{
            tabBarLabel: t('tabPremium'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[iconStyles.wrap, focused && { backgroundColor: theme.mint }]}>
                <Icon name="star" size={22} color={focused ? theme.accent : color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="MoreScreen"
          component={MoreScreen}
          options={{
            tabBarLabel: t('tabProfile'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[iconStyles.wrap, focused && { backgroundColor: theme.mint }]}>
                <Icon name="user" size={22} color={color} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
