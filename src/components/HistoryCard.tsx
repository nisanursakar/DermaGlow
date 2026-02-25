import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export type HistoryItem = {
  id: string;
  type: 'skin' | 'scalp';
  date: string;
  score: number;
  improvement: number;
  thumbnailUri?: string;
};

type HistoryCardProps = {
  item: HistoryItem;
  onPress: () => void;
};

export default function HistoryCard({ item, onPress }: HistoryCardProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const typeLabel = item.type === 'skin' ? t('skinAnalysisType') : t('scalpAnalysisType');
  const improvementText = item.improvement >= 0 ? `+${item.improvement}` : `${item.improvement}`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderRadius: theme.borderRadius,
          shadowColor: theme.shadowStrong,
        },
      ]}
    >
      <View style={[styles.thumbnail, { backgroundColor: theme.iconBg }]}>
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnailImage} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.lightPurple }]} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.typeText, { color: theme.textPrimary }]}>{typeLabel}</Text>
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>{item.date}</Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreText, { color: theme.primary }]}>{item.score}</Text>
          <View style={styles.improvementBadge}>
            <Text style={styles.improvementText}>{improvementText}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
  },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { flex: 1 },
  content: { flex: 1 },
  typeText: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  dateText: { fontSize: 12, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreText: { fontSize: 20, fontWeight: '800', marginRight: 8 },
  improvementBadge: {
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  improvementText: { fontSize: 12, fontWeight: '700', color: '#4CD964' },
});
