import React, { useState, useMemo } from 'react';
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

type Nav = NativeStackNavigationProp<RootStackParamList, 'SignupScreen'>;

export default function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes('already registered')) return t('authErrorAlreadyRegistered');
    if (errorMsg.includes('Password should be at least')) return t('resetPasswordErrorShort');
    return errorMsg;
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !fullName.trim()) {
      Alert.alert(t('errorTitle'), t('fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('errorTitle'), t('passwordsNotMatch'));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);

    if (error) {
      Alert.alert(t('errorTitle'), getErrorMessage(error.message));
      return;
    }

    if (data.user) {
      await supabase.from('profiles').insert([
        {
          id: data.user.id,
          display_name: fullName.trim(),
          skin_type: 'combination',
          sensitivity: 'medium',
          skin_problems: [],
        },
      ]);
    }

    Alert.alert(t('successTitle'), t('accountCreated'));
    navigation.replace('OnboardingSurveyScreen');
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
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={22} color={theme.primary} />
            </TouchableOpacity>
            <LanguageToggle compact />
          </View>

          <View style={styles.logoWrap}>
            <LogoMark size="sm" showText={false} />
          </View>

          <Text style={styles.heading}>{t('createAccountTitle')}</Text>
          <Text style={styles.subheading}>{t('createAccountSubtitle')}</Text>

          <GlassCard style={styles.formCard}>
            <PremiumInput
              label={t('fullNamePlaceholder')}
              placeholder={t('fullNamePlaceholder')}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <PremiumInput
              label={t('emailPlaceholder')}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PremiumInput
              label={t('passwordPlaceholder')}
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureToggle
              showSecure={showPassword}
              onToggleSecure={() => setShowPassword(!showPassword)}
            />
            <PremiumInput
              label={t('confirmPasswordPlaceholder')}
              placeholder={t('confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureToggle
              showSecure={showConfirm}
              onToggleSecure={() => setShowConfirm(!showConfirm)}
            />

            <PremiumButton
              label={t('createAccountButton')}
              icon="user-plus"
              onPress={handleSignUp}
              loading={loading}
            />
          </GlassCard>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('haveAccountAlready')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.footerLink}>{t('loginInstead')}</Text>
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
    logoWrap: { alignItems: 'center', marginBottom: theme.spacing.md },
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
