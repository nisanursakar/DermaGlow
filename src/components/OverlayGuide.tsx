// src/components/OverlayGuide.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { CameraMode } from '../constants/theme';

type OverlayGuideProps = {
  mode: CameraMode;
};

export default function OverlayGuide({ mode }: OverlayGuideProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const isSkin = mode === 'skin';

  // İpuçlarını LanguageContext üzerinden (t fonksiyonu ile) çekiyoruz
  const tips = isSkin
    ? [t('skinTip1'), t('skinTip2'), t('skinTip3')]
    : [t('scalpTip1'), t('scalpTip2'), t('scalpTip3')];

  // Eğer çeviri dosyasında bu kelimeleri bulamazsa, varsayılan Türkçe metinleri gösterir (Uygulamanın çökmesini önler)
  const skinGuidance = t('skinGuidance') === 'skinGuidance'
    ? 'Yüzünüzü çerçevenin ortasına yerleştirin'
    : t('skinGuidance');

  const scalpGuidance = t('scalpGuidance') === 'scalpGuidance'
    ? 'Saç ayrımını çerçevenin ortasına getirin'
    : t('scalpGuidance');

  const guidance = isSkin ? skinGuidance : scalpGuidance;

  return (
    <View
      style={[
        styles.floatingCard,
        {
          // Karanlık moda tam uyumlu dinamik renkler
          backgroundColor: theme.cardBackground || theme.cardBg || 'rgba(255,255,255,0.95)',
          borderColor: theme.lightPurple || 'rgba(75,59,112,0.15)',
          shadowColor: theme.shadowStrong || '#000',
          borderRadius: theme.borderRadius || 16
        }
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.guidanceText, { color: theme.primary }]}>✔ {guidance}</Text>
      <View style={styles.tipsList}>
        {tips.map((tip, i) => (
          <Text key={i} style={[styles.tipText, { color: theme.textSecondary }]}>• {tip}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingCard: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    padding: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  guidanceText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipsList: {
    marginLeft: 4,
  },
  tipText: {
    fontSize: 12,
    marginBottom: 2,
  },
});