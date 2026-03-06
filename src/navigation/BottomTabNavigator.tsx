import React, { useEffect } from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// ÇÖZÜM BURADA: Arka plan renginin parlaklığını ölçen akıllı formül!
// Renk koyuysa "true", açıksa "false" döndürür. Böylece renk kodlarını ezberlememize gerek kalmaz.
const isColorDark = (color: string) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Renk parlaklık algoritması
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128; // 128'den küçükse renk koyudur
};

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
  const insets = useSafeAreaInsets();

  // Artık akıllı formülümüzü kullanıyoruz
  const isDarkMode = isColorDark(theme.background);
  const isLightMode = !isDarkMode;

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        changeNavigationBarColor(theme.background, isLightMode, true);
      } catch (e) {
        console.log("Navigasyon bar rengi değiştirilemedi:", e);
      }
    }
  }, [theme.background, isLightMode]);

  return (
    <>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={isLightMode ? 'dark-content' : 'light-content'}
        animated={true}
      />

      <Tab.Navigator
        key={theme.cardBg}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: Math.max(12, insets.bottom + 8),
            height: 65 + insets.bottom,
            elevation: 0,
          },
          tabBarBackground: () => <TabBarBackground />,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen name="HomeScreen" component={HomeScreen} options={{ tabBarLabel: t('tabHome'), tabBarIcon: ({ color, size }) => (<Icon name="home" size={size ?? 22} color={color} />) }} />
        <Tab.Screen name="RoutineScreen" component={RoutineScreen} options={{ tabBarLabel: t('tabRoutine'), tabBarIcon: ({ color, size }) => (<Icon name="calendar" size={size ?? 22} color={color} />) }} />
        <Tab.Screen name="CameraScreen" component={CameraScreen} options={{ tabBarLabel: t('tabCamera'), tabBarIcon: ({ color, size }) => (<Icon name="camera" size={size ?? 22} color={color} />) }} />
        <Tab.Screen name="ChatScreen" component={ChatScreen} options={{ tabBarLabel: t('tabChat'), tabBarIcon: ({ color, size }) => (<Icon name="message-circle" size={size ?? 22} color={color} />) }} />
        <Tab.Screen name="MoreScreen" component={MoreScreen} options={{ tabBarLabel: t('tabMore'), tabBarIcon: ({ color, size }) => (<Icon name="more-horizontal" size={size ?? 22} color={color} />) }} />
      </Tab.Navigator>
    </>
  );
}