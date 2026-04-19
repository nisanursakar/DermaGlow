import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type AnalysisDetailRouteProp = RouteProp<RootStackParamList, 'AnalysisDetailScreen'>;

type FilterType = 'weekly' | 'monthly';

export default function AnalysisDetailScreen() {
  const route = useRoute<AnalysisDetailRouteProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const { type, score, previousScore, imageUri, issues, aiComment: customAiComment } = route.params as any;

  const [dateFilter, setDateFilter] = useState<FilterType>('weekly');

  const [chartData, setChartData] = useState<{labels: string[], data: number[]}>({
    labels: ['Bugün'],
    data: [score || 0]
  });
  const [loadingChart, setLoadingChart] = useState(true);

  const improved = previousScore != null && score >= previousScore;

  const displayAiComment = useMemo(() => {
    if (customAiComment) return customAiComment;
    if (improved) return t('aiCommentImproved');
    if (previousScore != null && score < previousScore) return t('aiCommentDecreased');
    return t('aiCommentStable');
  }, [improved, previousScore, score, t, customAiComment]);

  const scoreLabel = type === 'skin' ? t('skinScore') : t('scalpScore');

  const fetchChartData = useCallback(async () => {
    try {
      setLoadingChart(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const limit = dateFilter === 'weekly' ? 7 : 30;

      const { data, error } = await supabase
        .from('analysis_results')
        .select('created_at, ai_feedback')
        .eq('user_id', user.id)
        .eq('analysis_type', type)
        .order('created_at', { ascending: false })
        .limit(limit * 3);

      if (error) throw error;

      if (data && data.length > 0) {
        let validData = data.filter(item => {
            const fbScore = Number(item.ai_feedback?.score);
            return fbScore > 0 && fbScore <= 100;
        });

        if (validData.length === 0) {
            setChartData({ labels: ['Bugün'], data: [score || 70] });
            return;
        }

        const reversedData = [...validData].reverse();

        const dailyMap = new Map<string, number>();

        reversedData.forEach(item => {
          const d = new Date(item.created_at);
          const dateLabel = `${d.getDate()} ${d.toLocaleDateString('tr-TR', { month: 'short' })}`;
          dailyMap.set(dateLabel, Number(item.ai_feedback.score));
        });

        let labels = Array.from(dailyMap.keys());
        let dataPoints = Array.from(dailyMap.values());

        if (labels.length > limit) {
          labels = labels.slice(-limit);
          dataPoints = dataPoints.slice(-limit);
        }

        setChartData({ labels, data: dataPoints });
      }
    } catch (err) {
      console.error("Grafik veri çekme hatası:", err);
    } finally {
      setLoadingChart(false);
    }
  }, [type, dateFilter, score]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // --- KUSURSUZ GRAFİK DEĞERLERİ ---
  const MAX_BAR_HEIGHT = 160;
  const Y_AXIS_VALUES = [100, 75, 50, 25, 0];

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
        {previousScore != null && previousScore !== score && (
          <View style={styles.trendRow}>
            <Icon name={improved ? 'trending-up' : 'trending-down'} size={18} color={improved ? theme.success : theme.error || '#FF3B30'} />
            <Text style={[styles.trendText, { color: improved ? theme.success : theme.error || '#FF3B30' }]}>
              {improved ? '+' : ''}{score - previousScore}
            </Text>
          </View>
        )}
      </View>

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

        {loadingChart ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.customChartContainer}>

            {/* Sol Y-Ekseni */}
            <View style={styles.yAxisContainer}>
              <View style={styles.yAxis}>
                {Y_AXIS_VALUES.map(val => (
                  <Text key={`y-${val}`} style={[styles.yAxisText, { color: theme.textSecondary }]}>{val}</Text>
                ))}
              </View>
            </View>

            {/* Yatay Kaydırılabilir Sütun Alanı */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chartScrollArea}
              contentContainerStyle={styles.chartScrollContent}
            >
              <View style={styles.chartInner}>

                {/* Arka Plan Kılavuz Çizgileri */}
                <View style={styles.gridLinesContainer}>
                  {Y_AXIS_VALUES.map(val => (
                    <View key={`grid-${val}`} style={[styles.gridLine, { backgroundColor: theme.textSecondary + '30' }]} />
                  ))}
                </View>

                {/* Sütunların Kendisi */}
                {chartData.data.map((val: number, idx: number) => {
                  const barHeight = (val / 100) * MAX_BAR_HEIGHT;

                  return (
                    <View key={`bar-${idx}`} style={styles.barWrapper}>
                      <Text style={[styles.barValueText, { color: theme.primary }]}>{val}</Text>
                      <View style={[styles.bar, { height: barHeight, backgroundColor: theme.primary }]} />
                      <Text style={[styles.barLabelText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {chartData.labels[idx]}
                      </Text>
                    </View>
                  );
                })}

              </View>
            </ScrollView>
          </View>
        )}
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

  chartCard: { borderRadius: 24, padding: 20, marginBottom: 20, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  // YENİ KAYDIRILABİLİR KUSURSUZ GRAFİK STİLLERİ
  customChartContainer: { flexDirection: 'row', height: 250, paddingTop: 10 },

  // Y-Ekseni (184 = 160 grafik boyu + 24 puan yazısı için tavan boşluğu)
  yAxisContainer: { width: 34, paddingRight: 8, height: 184, justifyContent: 'flex-end' },
  yAxis: { height: 170, justifyContent: 'space-between', alignItems: 'flex-end' },
  yAxisText: { fontSize: 12, fontWeight: '700' },

  chartScrollArea: { flex: 1 },
  // Tarihlerin kesilmesini engellemek için alta 30px boşluk
  chartScrollContent: { flexGrow: 1, paddingBottom: 30 },

  // Sütunların oturduğu asıl kutu. borderBottom (Zemin çizgisi) buraya eklendi.
  chartInner: { height: 184, flexDirection: 'row', alignItems: 'flex-end', minWidth: '100%', paddingHorizontal: 10, borderBottomWidth: 2, borderBottomColor: 'rgba(0,0,0,0.15)' },

  // Kılavuz çizgileri, tavan boşluğundan sonra başlar (top: 24)
  gridLinesContainer: { position: 'absolute', top: 24, bottom: 0, left: 0, right: 0, justifyContent: 'space-between', zIndex: -1 },
  gridLine: { height: 1, width: '100%' },

  barWrapper: { alignItems: 'center', width: 44, marginHorizontal: 10, justifyContent: 'flex-end' },
  barValueText: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  bar: { width: 30, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barLabelText: { position: 'absolute', bottom: -24, fontSize: 11, fontWeight: '600', width: 64, textAlign: 'center' },

  bottomSpacing: { height: 24 },
});