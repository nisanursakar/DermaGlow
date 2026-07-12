import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

type LanguageToggleProps = {
  compact?: boolean;
};

export default function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
      activeOpacity={0.7}
    >
      <Icon name="globe" size={compact ? 16 : 18} color={theme.primary} />
      <Text style={styles.text}>{language === 'tr' ? 'EN' : 'TR'}</Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], compact: boolean) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: compact ? 8 : 10,
      paddingHorizontal: compact ? 12 : 16,
      borderRadius: theme.borderRadiusLarge,
      backgroundColor: theme.glassBg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      gap: 6,
    },
    text: {
      fontSize: compact ? 13 : 15,
      fontWeight: '700',
      color: theme.primary,
    },
  });
}
