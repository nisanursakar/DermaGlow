import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { CameraMode } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type ModeToggleProps = {
  mode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
};

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const options: { key: CameraMode; label: string }[] = [
    { key: 'skin', label: t('skinPhotoMode') },
    { key: 'scalp', label: t('scalpMode') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.lightPurple, borderRadius: theme.borderRadius }]}>
      {options.map((opt) => {
        const isActive = mode === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={0.8}
            onPress={() => onModeChange(opt.key)}
            style={[
              styles.tab,
              { borderRadius: theme.borderRadius - 4 },
              isActive && { backgroundColor: theme.cardBg, shadowColor: theme.shadowStrong, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.textSecondary },
                isActive && { color: theme.primary, fontWeight: '700' },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
});
