import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type Nav = { getParent?: () => { navigate: (name: string) => void } };

export default function MoreScreen({ navigation }: { navigation: Nav }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const rootNav = navigation.getParent?.();

  const navigate = (screen: string) => {
    rootNav?.navigate(screen);
  };

  const renderRow = (
    icon: string,
    label: string,
    subtitle?: string,
    onPress?: () => void,
    right?: React.ReactNode
  ) => (
    <TouchableOpacity
      key={label}
      style={[styles.row, { backgroundColor: theme.cardBg }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !right}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.iconBg }]}>
        <Icon name={icon as any} size={20} color={theme.primary} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
          {label}
        </Text>
        {subtitle !== undefined && (
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={20} color={theme.textSecondary} /> : null)}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerIconWrap}>
          <Icon name="settings" size={28} color={theme.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('settingsTitle')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {t('settingsSubtitle')}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t('general')}
      </Text>
      {renderRow(
        'globe',
        t('language'),
        language === 'tr' ? t('turkish') : t('english'),
        () => navigate('LanguageScreen')
      )}
      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.cardBg }]}
        activeOpacity={1}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.iconBg }]}>
          <Icon name="bell" size={20} color={theme.primary} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
            {t('notifications')}
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: theme.textSecondary, true: theme.lightPurple }}
          thumbColor="#FFF"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.cardBg }]}
        activeOpacity={1}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.iconBg }]}>
          <Icon name="sun" size={20} color={theme.primary} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
            {t('darkMode')}
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: theme.textSecondary, true: theme.lightPurple }}
          thumbColor="#FFF"
        />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t('support')}
      </Text>
      {renderRow('help-circle', t('helpCenter'), undefined, () => navigate('HelpCenterScreen'))}
      {renderRow('info', t('aboutUs'), undefined, () => navigate('AboutUsScreen'))}
      {renderRow('mail', t('contact'), undefined, () => navigate('ContactScreen'))}

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {t('privacy')}
      </Text>
      {renderRow('shield', t('privacyPolicy'), undefined, () => navigate('PrivacyPolicyScreen'))}
      {renderRow('file-text', t('termsOfUse'), undefined, () => navigate('TermsOfUseScreen'))}

      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: theme.cardBg }]}
        onPress={() => rootNav?.navigate('LoginScreen')}
        activeOpacity={0.8}
      >
        <Icon name="log-out" size={20} color="#D32F2F" />
        <Text style={styles.logoutText}>{t('logOut')}</Text>
      </TouchableOpacity>

      <Text style={[styles.footerVersion, { color: theme.textSecondary }]}>
        {t('version')}
      </Text>
      <Text style={[styles.footerCopyright, { color: theme.textSecondary }]}>
        {t('copyright')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  headerIconWrap: { marginBottom: 8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginHorizontal: 20,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 6,
    borderRadius: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTextWrap: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  rowSubtitle: { fontSize: 13, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D32F2F',
    backgroundColor: '#FFF',
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#D32F2F' },
  footerVersion: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
  footerCopyright: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 4,
  },
});
