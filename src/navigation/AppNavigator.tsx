import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '../context/ThemeContext';
import BottomTabNavigator from './BottomTabNavigator';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import AnalysisDetailScreen from '../screens/AnalysisDetailScreen';
import LanguageScreen from '../screens/LanguageScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import ContactScreen from '../screens/ContactScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfUseScreen from '../screens/TermsOfUseScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ProfileScreen: undefined;
  ChatDetailScreen: {
    userId: string;
    userName: string;
  };
  AnalysisDetailScreen: {
    analysisId: string;
    type: 'skin' | 'scalp';
    score: number;
    previousScore?: number;
  };
  LanguageScreen: undefined;
  HelpCenterScreen: undefined;
  AboutUsScreen: undefined;
  ContactScreen: undefined;
  PrivacyPolicyScreen: undefined;
  TermsOfUseScreen: undefined;
  LoginScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme } = useTheme();

  const headerOptions = {
    headerStyle: { backgroundColor: theme.headerBg },
    headerTintColor: theme.primary,
    headerTitleStyle: { fontWeight: '700' as const },
  };

  return (
    <Stack.Navigator
        initialRouteName="LoginScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatDetailScreen"
          component={ChatDetailScreen}
          options={{ headerShown: true, ...headerOptions }}
        />
        <Stack.Screen
          name="AnalysisDetailScreen"
          component={AnalysisDetailScreen}
          options={{ headerShown: true, title: 'Analiz Detayı', ...headerOptions }}
        />
        <Stack.Screen
          name="LanguageScreen"
          component={LanguageScreen}
          options={{ headerShown: true, title: 'Dil', ...headerOptions }}
        />
        <Stack.Screen
          name="HelpCenterScreen"
          component={HelpCenterScreen}
          options={{ headerShown: true, title: 'Yardım Merkezi', ...headerOptions }}
        />
        <Stack.Screen
          name="AboutUsScreen"
          component={AboutUsScreen}
          options={{ headerShown: true, title: 'Hakkımızda', ...headerOptions }}
        />
        <Stack.Screen
          name="ContactScreen"
          component={ContactScreen}
          options={{ headerShown: true, title: 'İletişim', ...headerOptions }}
        />
        <Stack.Screen
          name="PrivacyPolicyScreen"
          component={PrivacyPolicyScreen}
          options={{ headerShown: true, title: 'Gizlilik Politikası', ...headerOptions }}
        />
        <Stack.Screen
          name="TermsOfUseScreen"
          component={TermsOfUseScreen}
          options={{ headerShown: true, title: 'Kullanım Koşulları', ...headerOptions }}
        />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
  );
}