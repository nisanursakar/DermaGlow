import React, { useState, useRef } from 'react';
import { supabase } from '../../supabase';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoginScreen'>;

type LoginScreenProps = {
  initialMode?: 'login' | 'signup';
};

export default function LoginScreen({ initialMode = 'login' }: LoginScreenProps) {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const getErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes('Invalid login credentials')) return t('authErrorInvalidCredentials');
    if (errorMsg.includes('already registered')) return t('authErrorAlreadyRegistered');
    if (errorMsg.includes('Password should be at least')) return t('resetPasswordErrorShort');
    return errorMsg;
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(t('errorTitle'), t('enterEmailFirst'));
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      Alert.alert(t('errorTitle'), getErrorMessage(error.message));
    } else {
      Alert.alert(t('successTitle'), t('resetMailSent'));
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('errorTitle'), t('enterEmailPassword'));
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert(t('errorTitle'), getErrorMessage(error.message));
    } else {
      navigation.replace('MainTabs');
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      Alert.alert(t('errorTitle'), t('fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('errorTitle'), t('passwordsNotMatch'));
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      Alert.alert(t('errorTitle'), getErrorMessage(error.message));
    } else {
      if (data.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            display_name: fullName,
            skin_type: 'combination',
            sensitivity: 'medium',
            skin_problems: [],
          }
        ]);
      }

      Alert.alert(t('successTitle'), t('accountCreated'));
      navigation.replace('OnboardingSurveyScreen');
    }
  };

  const br = theme.borderRadius;
  const brLarge = theme.borderRadiusLarge ?? 24;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Dil Seçeneği artık ScrollView içinde, sayfayla birlikte hareket edecek */}
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langButton, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '50' }]}
            onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            activeOpacity={0.7}
          >
            <Icon name="globe" size={18} color={theme.primary} />
            <Text style={[styles.langButtonText, { color: theme.primary }]}>
              {language === 'tr' ? 'EN' : 'TR'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.logoSection, { backgroundColor: theme.background }]}>
          <Image
            source={require('../assets/images/logo.png')}
            style={[styles.logo, { backgroundColor: 'transparent' }]}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: theme.primary }]}>{t('appName')}</Text>
        </View>

        <View style={[styles.tabContainer, { backgroundColor: theme.iconBg, borderRadius: br, padding: 4 }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              { borderRadius: br - 4 },
              isLogin && [styles.activeTab, { backgroundColor: theme.cardBg, shadowColor: theme.shadow }]
            ]}
            onPress={() => setIsLogin(true)}
            activeOpacity={1}
          >
            <Text style={[styles.tabText, { color: theme.textSecondary }, isLogin && { color: theme.primary, fontWeight: '700' }]}>
              {t('loginTab')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { borderRadius: br - 4 },
              !isLogin && [styles.activeTab, { backgroundColor: theme.cardBg, shadowColor: theme.shadow }]
            ]}
            onPress={() => setIsLogin(false)}
            activeOpacity={1}
          >
            <Text style={[styles.tabText, { color: theme.textSecondary }, !isLogin && { color: theme.primary, fontWeight: '700' }]}>
              {t('signUpTab')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.cardBg, borderRadius: brLarge, shadowColor: theme.shadow }]}>
          <View style={styles.form}>

            {!isLogin && (
              <View style={styles.nameRow}>
                <TextInput
                  ref={firstNameRef}
                  style={[styles.input, styles.halfInput, { backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
                  placeholder={t('namePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <TextInput
                  ref={lastNameRef}
                  style={[styles.input, styles.halfInput, { backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
                  placeholder={t('surnamePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            )}

            <TextInput
              ref={emailRef}
              style={[styles.input, { backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <View style={[styles.passwordWrap, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '40', borderRadius: br }]}>
              <TextInput
                ref={passwordRef}
                style={[styles.passwordInput, { color: theme.textPrimary }]}
                placeholder={t('passwordPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType={isLogin ? 'done' : 'next'}
                onSubmitEditing={isLogin ? () => { passwordRef.current?.blur(); handleLogin(); } : () => confirmPasswordRef.current?.focus()}
                blurOnSubmit={isLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {isLogin ? (
              <>
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.forgotPasswordText, { color: theme.primaryLight }]}>
                    {t('forgotPassword')}
                  </Text>
                </TouchableOpacity>
                <Pressable
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.primaryButtonElevated,
                    {
                      backgroundColor: theme.primary,
                      borderRadius: br,
                      shadowColor: theme.shadowStrong || theme.primary,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Icon name="log-in" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{t('loginButton')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.passwordWrap, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '40', borderRadius: br }]}>
                  <TextInput
                    ref={confirmPasswordRef}
                    style={[styles.passwordInput, { color: theme.textPrimary }]}
                    placeholder={t('confirmPasswordPlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={() => { confirmPasswordRef.current?.blur(); handleSignUp(); }}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Pressable
                  onPress={handleSignUp}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.primaryButtonElevated,
                    {
                      backgroundColor: theme.primary,
                      borderRadius: br,
                      shadowColor: theme.shadowStrong || theme.primary,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Icon name="user-plus" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{t('signUpButton')}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    paddingTop: 56, // Üstten telefon çentik (notch) mesafesi
    paddingBottom: 16,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  langButtonText: { fontSize: 15, fontWeight: '700' },
  logoSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 24,
  },
  logo: { width: 140, height: 140, marginBottom: 10 },
  appName: { fontSize: 24, fontWeight: '700', letterSpacing: 0.5 },
  tabContainer: { flexDirection: 'row', width: '100%', maxWidth: 320, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  activeTab: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 16, fontWeight: '600', backgroundColor: 'transparent' },
  formCard: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  form: { width: '100%' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12, marginBottom: 12 },
  halfInput: { flex: 1 },
  input: { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, borderWidth: 1, marginBottom: 12 },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 12, paddingHorizontal: 4 },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  eyeButton: { padding: 10 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 14 },
  forgotPasswordText: { fontSize: 14, fontWeight: '600' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 6,
    gap: 10,
  },
  primaryButtonElevated: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', backgroundColor: 'transparent' },
});