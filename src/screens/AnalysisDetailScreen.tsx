import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type AnalysisDetailRouteProp = RouteProp<RootStackParamList, 'AnalysisDetailScreen'>;

const DUMMY_CHART_DATA = {
  labels: ['6 Oca', '13 Oca', '20 Oca'],
  datasets: [{ data: [80, 78, 85] }],
};

type FilterType = 'weekly' | 'monthly';

export default function AnalysisDetailScreen() {
  const route = useRoute<AnalysisDetailRouteProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { type, score, previousScore } = route.params;

  const [dateFilter, setDateFilter] = useState<FilterType>('weekly');

  const improved = previousScore != null && score > previousScore;

  const aiComment = useMemo(() => {
    if (improved) return t('aiCommentImproved');
    if (previousScore != null && score < previousScore) return t('aiCommentDecreased');
    return t('aiCommentStable');
  }, [improved, previousScore, score, t]);

  const chartConfig = useMemo(
    () => ({
      backgroundColor: theme.cardBg,
      backgroundGradientFrom: theme.cardBg,
      backgroundGradientTo: theme.cardBg,
      decimalPlaces: 0,
      color: (opacity: number) => `rgba(75, 59, 112, ${opacity})`,
      labelColor: () => theme.textSecondary,
      style: { borderRadius: theme.borderRadius, padding: 16 },
      propsForDots: { r: '4', strokeWidth: '2', stroke: theme.primary },
    }),
    [theme]
  );

  const screenWidth = Dimensions.get('window').width - 48;

  const scoreLabel = type === 'skin' ? t('skinScore') : t('scalpScore');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.scoreCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadowStrong }]}>
        <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>{scoreLabel}</Text>
        <Text style={[styles.scoreValue, { color: theme.primary }]}>{score}</Text>
        {previousScore != null && (
          <View style={styles.trendRow}>
            <Icon name={improved ? 'trending-up' : 'trending-down'} size={18} color={improved ? theme.success : theme.textSecondary} />
            <Text style={[styles.trendText, { color: improved ? theme.success : theme.textSecondary }]}>
              {improved ? '+' : ''}{score - previousScore}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.cardBg, borderRadius: theme.borderRadius }, dateFilter === 'weekly' && { backgroundColor: theme.primary }]}
          onPress={() => setDateFilter('weekly')}
        >
          <Text style={[styles.filterButtonText, { color: theme.textSecondary }, dateFilter === 'weekly' && styles.filterButtonTextActive]}>{t('weekly')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.cardBg, borderRadius: theme.borderRadius }, dateFilter === 'monthly' && { backgroundColor: theme.primary }]}
          onPress={() => setDateFilter('monthly')}
        >
          <Text style={[styles.filterButtonText, { color: theme.textSecondary }, dateFilter === 'monthly' && styles.filterButtonTextActive]}>{t('monthly')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.chartCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadowStrong }]}>
        <Text style={[styles.chartTitle, { color: theme.primary }]}>{scoreLabel}</Text>
        <LineChart
          data={DUMMY_CHART_DATA}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={[styles.chart, { borderRadius: theme.borderRadius }]}
          withDots
          withInnerLines
          withVerticalLabels
          withHorizontalLabels
          fromZero
          yAxisSuffix=""
        />
      </View>

      <View style={[styles.aiCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadowStrong }]}>
        <View style={styles.aiCardHeader}>
          <Icon name="message-circle" size={20} color={theme.primary} />
          <Text style={[styles.aiCardTitle, { color: theme.primary }]}>AI</Text>
        </View>
        <Text style={[styles.aiComment, { color: theme.textPrimary }]}>{aiComment}</Text>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  scoreCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  scoreLabel: { fontSize: 14, marginBottom: 8 },
  scoreValue: { fontSize: 42, fontWeight: '800' },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  trendText: { fontSize: 13, fontWeight: '600', marginLeft: 6 },
  filterRow: { flexDirection: 'row', marginBottom: 16 },
  filterButton: { paddingVertical: 10, paddingHorizontal: 20, marginRight: 10 },
  filterButtonText: { fontSize: 14, fontWeight: '600' },
  filterButtonTextActive: { color: '#FFF' },
  chartCard: { borderRadius: 24, padding: 16, marginBottom: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  chart: {},
  aiCard: { borderRadius: 24, padding: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiCardTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  aiComment: { fontSize: 14, lineHeight: 22 },
  bottomSpacing: { height: 24 },
});
