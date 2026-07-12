import React, { useState, useRef, useMemo } from 'react';
import { supabase } from '../../supabase';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  GradientBackground,
  GlassCard,
  PremiumButton,
  PremiumInput,
  LogoMark,
  LanguageToggle,
} from '../components/ui';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LoginScreen'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const getErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes('Invalid login credentials')) return t('authErrorInvalidCredentials');
    if (errorMsg.includes('already registered')) return t('authErrorAlreadyRegistered');
    if (errorMsg.includes('Password should be at least')) return t('resetPasswordErrorShort');
    return errorMsg;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('errorTitle'), t('enterEmailPassword'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert(t('errorTitle'), getErrorMessage(error.message));
    } else {
      navigation.replace('MainTabs');
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
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('WelcomeScreen')}>
              <Icon name="arrow-left" size={22} color={theme.primary} />
            </TouchableOpacity>
            <LanguageToggle compact />
          </View>

          <View style={styles.logoWrap}>
            <LogoMark size="md" />
          </View>

          <Text style={styles.heading}>{t('loginTab')}</Text>
          <Text style={styles.subheading}>{t('loginSubtitle')}</Text>

          <GlassCard style={styles.formCard}>
            <PremiumInput
              ref={emailRef}
              label={t('emailPlaceholder')}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <PremiumInput
              ref={passwordRef}
              label={t('passwordPlaceholder')}
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureToggle
              showSecure={showPassword}
              onToggleSecure={() => setShowPassword(!showPassword)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate('ForgotPasswordScreen')}
            >
              <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            <PremiumButton
              label={t('loginButton')}
              icon="log-in"
              onPress={handleLogin}
              loading={loading}
            />
          </GlassCard>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('noAccountYet')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
              <Text style={styles.footerLink}>{t('signUpTab')}</Text>
            </TouchableOpacity>
          </View>
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
      paddingBottom: Math.max(insets.bottom, 32),
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
    },
    logoWrap: { alignItems: 'center', marginBottom: theme.spacing.lg },
    heading: {
      fontSize: theme.typography.h1,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
    },
    subheading: {
      fontSize: theme.typography.body,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    formCard: { marginBottom: theme.spacing.lg },
    forgotLink: { alignSelf: 'flex-end', marginBottom: theme.spacing.md, marginTop: -theme.spacing.sm },
    forgotText: { fontSize: theme.typography.caption, fontWeight: '600', color: theme.primary },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    footerText: { fontSize: theme.typography.body, color: theme.textSecondary },
    footerLink: { fontSize: theme.typography.body, fontWeight: '700', color: theme.primary },
  });
}
