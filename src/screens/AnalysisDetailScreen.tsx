import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type AnalysisDetailRouteProp = RouteProp<RootStackParamList, 'AnalysisDetailScreen'>;

const DUMMY_CHART_DATA = {
  labels: ['6 Oca', '13 Oca', '20 Oca', 'Bugün'],
  datasets: [{ data: [65, 70, 78, 85] }],
};

type FilterType = 'weekly' | 'monthly';

export default function AnalysisDetailScreen() {
  const route = useRoute<AnalysisDetailRouteProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();

  // CameraScreen'den gelen yeni yapay zeka verilerini (issues, aiComment) alıyoruz
  const { type, score, previousScore, imageUri, issues, aiComment: customAiComment } = route.params as any;

  const [dateFilter, setDateFilter] = useState<FilterType>('weekly');

  const improved = previousScore != null && score >= previousScore;

  // Eğer CameraScreen özel bir AI yorumu yolladıysa onu kullan, yoksa eskileri kullan
  const displayAiComment = useMemo(() => {
    if (customAiComment) return customAiComment;
    if (improved) return t('aiCommentImproved');
    if (previousScore != null && score < previousScore) return t('aiCommentDecreased');
    return t('aiCommentStable');
  }, [improved, previousScore, score, t, customAiComment]);

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

  // Grafik verisini son skora göre dinamik güncelliyoruz
  const dynamicChartData = {
    ...DUMMY_CHART_DATA,
    datasets: [{ data: [...DUMMY_CHART_DATA.datasets[0].data.slice(0, 3), score] }]
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {imageUri && (
        <View style={[styles.imageContainer, { shadowColor: theme.shadowStrong }]}>
          <Image source={{ uri: imageUri }} style={styles.analysisImage} />
        </View>
      )}

      <View style={[styles.scoreCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadowStrong }]}>
        <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>{scoreLabel}</Text>
        <Text style={[styles.scoreValue, { color: theme.primary }]}>{score}</Text>
        {previousScore != null && (
          <View style={styles.trendRow}>
            <Icon name={improved ? 'trending-up' : 'trending-down'} size={18} color={improved ? theme.success : theme.error || '#FF3B30'} />
            <Text style={[styles.trendText, { color: improved ? theme.success : theme.error || '#FF3B30' }]}>
              {improved ? '+' : ''}{score - previousScore}
            </Text>
          </View>
        )}
      </View>

      {/* YENİ EKLENEN BÖLÜM: YAPAY ZEKA TESPİTLERİ (Yüzdelik Barlar) */}
      {issues && issues.length > 0 && (
        <View style={[styles.issuesCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadowStrong }]}>
          <View style={styles.issuesHeader}>
            <Icon name="search" size={18} color={theme.primary} />
            <Text style={[styles.issuesTitle, { color: theme.primary }]}>Tespit Edilen Durumlar</Text>
          </View>

          {issues.map((issue: any, index: number) => (
            <View key={index} style={styles.issueItem}>
              <View style={styles.issueRow}>
                <Text style={[styles.issueName, { color: theme.textPrimary }]}>{issue.name}</Text>
                <Text style={[styles.issuePercentage, { color: theme.textSecondary }]}>%{issue.impact}</Text>
              </View>
              {/* İlerleme Çubuğu */}
              <View style={[styles.progressBarBg, { backgroundColor: theme.iconBg }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${issue.impact}%`,
                      backgroundColor: issue.impact > 30 ? (theme.error || '#FF6B6B') : (theme.warning || '#FFC107')
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.aiCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadowStrong }]}>
        <View style={styles.aiCardHeader}>
          <Icon name="cpu" size={20} color={theme.primary} />
          <Text style={[styles.aiCardTitle, { color: theme.primary }]}>DermAI Analizi</Text>
        </View>
        <Text style={[styles.aiComment, { color: theme.textPrimary }]}>{displayAiComment}</Text>
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
        <Text style={[styles.chartTitle, { color: theme.primary }]}>Gelişim Grafiği</Text>
        <LineChart
          data={dynamicChartData}
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

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  imageContainer: { width: '100%', height: 220, borderRadius: 24, overflow: 'hidden', marginBottom: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  analysisImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  scoreCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  scoreLabel: { fontSize: 14, marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: '800' },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  trendText: { fontSize: 14, fontWeight: '700', marginLeft: 6 },

  // Yeni Sorunlar Kartı Stilleri
  issuesCard: { borderRadius: 24, padding: 20, marginBottom: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  issuesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  issuesTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  issueItem: { marginBottom: 16 },
  issueRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  issueName: { fontSize: 14, fontWeight: '500' },
  issuePercentage: { fontSize: 14, fontWeight: '700' },
  progressBarBg: { height: 8, width: '100%', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  aiCard: { borderRadius: 24, padding: 20, marginBottom: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiCardTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  aiComment: { fontSize: 14, lineHeight: 22 },

  filterRow: { flexDirection: 'row', marginBottom: 16 },
  filterButton: { paddingVertical: 10, paddingHorizontal: 20, marginRight: 10 },
  filterButtonText: { fontSize: 14, fontWeight: '600' },
  filterButtonTextActive: { color: '#FFF' },
  chartCard: { borderRadius: 24, padding: 16, marginBottom: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  chart: {},
  bottomSpacing: { height: 24 },
});