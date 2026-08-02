import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  GradientBackground,
  LogoMark,
  PremiumButton,
  LanguageToggle,
  GlassCard,
} from '../components/ui';

type Nav = NativeStackNavigationProp<RootStackParamList, 'WelcomeScreen'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.langRow}>
          <LanguageToggle />
        </View>

        <View style={styles.hero}>
          <LogoMark size="lg" />
          <Text style={styles.tagline}>{t('welcomeTagline')}</Text>
          <Text style={styles.subtitle}>{t('welcomeSubtitle')}</Text>
        </View>

        <GlassCard style={styles.ctaCard} padding={24}>
          <PremiumButton
            label={t('signInButton')}
            icon="log-in"
            onPress={() => navigation.navigate('LoginScreen')}
          />
          <View style={styles.spacer} />
          <PremiumButton
            label={t('signUpButton')}
            variant="outline"
            icon="user-plus"
            onPress={() => navigation.navigate('SignupScreen')}
          />
        </GlassCard>

        <Text style={styles.footer}>{t('welcomeFooter')}</Text>
      </View>
    </GradientBackground>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  insets: { top: number; bottom: number },
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: Math.max(insets.top, 16),
      paddingBottom: Math.max(insets.bottom, 24),
    },
    langRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: theme.spacing.lg,
    },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    tagline: {
      fontSize: theme.typography.h2,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginTop: theme.spacing.lg,
      lineHeight: 30,
    },
    subtitle: {
      fontSize: theme.typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
      lineHeight: 24,
      maxWidth: 300,
    },
    ctaCard: {
      marginBottom: theme.spacing.lg,
    },
    spacer: { height: theme.spacing.md },
    footer: {
      fontSize: theme.typography.caption,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
}
