import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';

const COLORS = {
  background: '#FFF5F7',
  surface: '#FFFFFF',
  primary: '#E8A0B5',
  primaryDark: '#D4899E',
  text: '#5C4A4F',
  textMuted: '#8B7378',
  border: '#F0D4DB',
  tabActive: '#E8A0B5',
  tabInactive: '#F5E1E6',
};

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.tabActive]}
            onPress={() => setIsLogin(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.tabActive]}
            onPress={() => setIsLogin(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isLogin ? (
            <>
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {}}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {}}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.tabInactive,
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
    width: '100%',
    maxWidth: 320,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  form: {
    width: '100%',
    maxWidth: 320,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
