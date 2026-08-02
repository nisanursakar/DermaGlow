import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { supabase } from '../../supabase';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  GradientBackground,
  GlassCard,
  PremiumButton,
  PremiumInput,
} from '../components/ui';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ForgotPasswordScreen'>;
type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setStatus('error');
      setErrorMsg(t('enterEmailFirst'));
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('success');
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color={theme.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.mint }]}>
              <Icon name="mail" size={28} color={theme.primary} />
            </View>
            <Text style={styles.title}>{t('forgotPasswordTitle')}</Text>
            <Text style={styles.subtitle}>{t('forgotPasswordSubtitle')}</Text>
          </View>

          {status === 'success' ? (
            <GlassCard style={styles.statusCard}>
              <View style={[styles.statusIcon, { backgroundColor: theme.mint }]}>
                <Icon name="check-circle" size={32} color={theme.success} />
              </View>
              <Text style={styles.statusTitle}>{t('successTitle')}</Text>
              <Text style={styles.statusText}>{t('resetMailSent')}</Text>
              <PremiumButton
                label={t('backToLogin')}
                onPress={() => navigation.navigate('LoginScreen')}
                style={{ marginTop: theme.spacing.lg }}
              />
            </GlassCard>
          ) : (
            <GlassCard>
              <PremiumInput
                label={t('emailPlaceholder')}
                placeholder={t('emailPlaceholder')}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (status === 'error') setStatus('idle');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={status === 'error' ? errorMsg : undefined}
              />
              <PremiumButton
                label={t('sendResetLink')}
                icon="send"
                onPress={handleSubmit}
                loading={status === 'loading'}
              />
              <PremiumButton
                label={t('backToLogin')}
                variant="ghost"
                onPress={() => navigation.navigate('LoginScreen')}
                style={{ marginTop: theme.spacing.sm }}
              />
            </GlassCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  insets: { top: number; bottom: number },
) {
  return StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: Math.max(insets.top, 16),
      paddingBottom: Math.max(insets.bottom, 24),
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.glassBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.glassBorder,
      marginBottom: theme.spacing.lg,
    },
    header: { alignItems: 'center', marginBottom: theme.spacing.xl },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.h2,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 300,
    },
    statusCard: { alignItems: 'center' },
    statusIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    statusTitle: {
      fontSize: theme.typography.h3,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    statusText: {
      fontSize: theme.typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
}
