import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import type { CameraMode } from '../constants/theme';

type OverlayGuideProps = {
  mode: CameraMode;
};

const SKIN_TIPS = [
  'Doğal ışık kullanın',
  'Yüzünüz tam karşıdan görünsün',
  'Makyajsız çekim yapın',
];

const SCALP_TIPS = [
  'Saç ayrımını net gösterin',
  'Saç derisi görünür olsun',
  'Parlak / iyi ışık kullanın',
];

const SKIN_GUIDANCE = 'Yüzünüzü çerçevenin ortasına yerleştirin';
const SCALP_GUIDANCE = 'Saç ayrımını çerçevenin ortasına getirin';

export default function OverlayGuide({ mode }: OverlayGuideProps) {
  const isSkin = mode === 'skin';
  const tips = isSkin ? SKIN_TIPS : SCALP_TIPS;
  const guidance = isSkin ? SKIN_GUIDANCE : SCALP_GUIDANCE;

  return (
    <View style={styles.floatingCard} pointerEvents="none">
      <Text style={styles.guidanceText}>✔ {guidance}</Text>
      <View style={styles.tipsList}>
        {tips.map((tip, i) => (
          <Text key={i} style={styles.tipText}>• {tip}</Text>
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.borderRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(75,59,112,0.15)',
    shadowColor: theme.shadowStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  guidanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 8,
  },
  tipsList: {
    marginLeft: 4,
  },
  tipText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
});
