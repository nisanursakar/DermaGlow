import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../../supabase';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPasswordScreen'>;

function parseRecoverySessionFromUrl(url: string | null): boolean {
  if (!url || !url.includes('#')) return false;
  const hash = url.split('#')[1];
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return false;
  return true;
}

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Recovery link'ten gelen token ile oturumu kur (auth session missing hatasını önlemek için)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (!cancelled) setSessionReady(true);
        return;
      }
      const url = await Linking.getInitialURL();
      if (parseRecoverySessionFromUrl(url)) {
        const params = new URLSearchParams(url!.split('#')[1]);
        const { error } = await supabase.auth.setSession({
          access_token: params.get('access_token')!,
          refresh_token: params.get('refresh_token')!,
        });
        if (!cancelled) {
          setSessionReady(true);
          if (error) setSessionError(error.message);
        }
      } else {
        if (!cancelled) setSessionError('session_missing');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpdate = async () => {
    const p = password.trim();
    const cp = confirmPassword.trim();

    if (p.length < 6) {
      Alert.alert(t('resetPasswordErrorShort'));
      return;
    }
    if (p !== cp) {
      Alert.alert(t('resetPasswordErrorMismatch'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: p });
    setLoading(false);

    if (error) {
      Alert.alert(error.message);
    } else {
      Alert.alert(t('resetPasswordSuccess'), '', [
        {
          text: t('ok'),
          onPress: () => navigation.replace('LoginScreen'),
        },
      ]);
    }
  };

  const br = theme.borderRadius;
  const brLarge = theme.borderRadiusLarge ?? 24;

  if (!sessionReady && !sessionError) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (sessionError === 'session_missing') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.replace('LoginScreen')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="arrow-left" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('resetPasswordTitle')}</Text>
        </View>
        <View style={styles.scrollContent}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('resetPasswordUseEmailLink')}</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary, borderRadius: br }]}
            onPress={() => navigation.replace('LoginScreen')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{t('loginButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="arrow-left" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('resetPasswordTitle')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {sessionError ? (
          <Text style={[styles.errorText, { color: theme.primary }]}>{sessionError}</Text>
        ) : null}
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('resetPasswordSubtitle')}</Text>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderRadius: brLarge, shadowColor: theme.shadow }]}>
          <View style={[styles.passwordWrap, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '40', borderRadius: br }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.textPrimary }]}
              placeholder={t('newPasswordPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.passwordWrap, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '40', borderRadius: br }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.textPrimary }]}
              placeholder={t('confirmNewPasswordPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary, borderRadius: br }]}
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('updatePasswordButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  errorText: { fontSize: 14, marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  card: {
    padding: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 16, fontSize: 16 },
  eyeButton: { padding: 10 },
  primaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
