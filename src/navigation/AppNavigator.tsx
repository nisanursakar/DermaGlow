// src/navigation/AppNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
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
import SignupScreen from '../screens/SignupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ProductSearchScreen from '../screens/ProductSearchScreen';
import OnboardingSurveyScreen from '../screens/OnboardingSurveyScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import SplashScreen from '../screens/SplashScreen';
import AIFab from '../components/AIFab';

export type RootStackParamList = {
  SplashScreen: undefined;
  OnboardingSurveyScreen: undefined;
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
  SignupScreen: undefined;
  ResetPasswordScreen: undefined;
  ProductSearchScreen: undefined;
  BarcodeScannerScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const headerOptions = {
    headerStyle: { backgroundColor: theme.headerBg },
    headerTintColor: theme.primary,
    headerTitleStyle: { fontWeight: '700' as const },
  };

  return (
    <>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ResetPasswordScreen"
          component={ResetPasswordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OnboardingSurveyScreen"
          component={OnboardingSurveyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen
          name="ProductSearchScreen"
          component={ProductSearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BarcodeScannerScreen"
          component={BarcodeScannerScreen}
          options={{ headerShown: false }}
        />
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
          options={{ headerShown: true, title: t('analysisDetailTitle'), ...headerOptions }}
        />
        <Stack.Screen
          name="LanguageScreen"
          component={LanguageScreen}
          options={{ headerShown: true, title: t('selectLanguage'), ...headerOptions }}
        />
        <Stack.Screen
          name="HelpCenterScreen"
          component={HelpCenterScreen}
          options={{ headerShown: true, title: t('helpCenterTitle'), ...headerOptions }}
        />
        <Stack.Screen
          name="AboutUsScreen"
          component={AboutUsScreen}
          options={{ headerShown: true, title: t('aboutUsTitle'), ...headerOptions }}
        />
        <Stack.Screen
          name="ContactScreen"
          component={ContactScreen}
          options={{ headerShown: true, title: t('contactTitle'), ...headerOptions }}
        />
        <Stack.Screen
          name="PrivacyPolicyScreen"
          component={PrivacyPolicyScreen}
          options={{ headerShown: true, title: t('privacyPolicyTitle'), ...headerOptions }}
        />
        <Stack.Screen
          name="TermsOfUseScreen"
          component={TermsOfUseScreen}
          options={{ headerShown: true, title: t('termsTitle'), ...headerOptions }}
        />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignupScreen"
          component={SignupScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <AIFab />
    </>
  );
}