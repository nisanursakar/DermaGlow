import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function ContactScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {t('contactTitle')}
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {t('contactContent')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 22 },
});
