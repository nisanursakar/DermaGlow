import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, Language } from '../context/LanguageContext';

export default function LanguageScreen() {
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const options: { value: Language; label: string }[] = [
    { value: 'tr', label: t('turkish') },
    { value: 'en', label: t('english') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {t('selectLanguage')}
      </Text>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.option, { backgroundColor: theme.cardBg }]}
          onPress={() => setLanguage(opt.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>
            {opt.label}
          </Text>
          {language === opt.value && (
            <Icon name="check" size={22} color={theme.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 16,
  },
});
