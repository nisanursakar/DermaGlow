import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import type { MainTabParamList } from '../navigation/BottomTabNavigator';
import type { CameraMode } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ModeToggle from '../components/ModeToggle';
import OverlayGuide from '../components/OverlayGuide';
import CameraOverlay from '../components/CameraOverlay';
import GradientButton from '../components/GradientButton';
import HistoryCard, { type HistoryItem } from '../components/HistoryCard';

type NavigationProp = BottomTabNavigationProp<MainTabParamList, 'CameraScreen'>;

const INITIAL_HISTORY: HistoryItem[] = [
  { id: '1', type: 'skin', date: '20 Ocak 2026', score: 85, improvement: 5 },
  { id: '2', type: 'scalp', date: '13 Ocak 2026', score: 78, improvement: 3 },
  { id: '3', type: 'skin', date: '6 Ocak 2026', score: 80, improvement: 8 },
];

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mode, setMode] = useState<CameraMode>('skin');

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: t('cameraPermissionTitle'),
          message: t('cameraPermissionMessage'),
          buttonNeutral: t('later'),
          buttonNegative: t('cancel'),
          buttonPositive: t('ok'),
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }, [t]);

  const [history] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  const navigateToAnalysis = useCallback(
    (params: { analysisId: string; type: 'skin' | 'scalp'; score: number; previousScore?: number }) => {
      navigation.getParent?.()?.navigate('AnalysisDetailScreen', params);
    },
    [navigation]
  );

  const handleCapture = useCallback(async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      setCameraPermissionDenied(true);
      Alert.alert(
        t('cameraPermissionTitle'),
        t('cameraPermissionMessage'),
        [{ text: t('ok') }, { text: t('settings'), onPress: () => Linking.openSettings() }]
      );
      return;
    }
    setCameraPermissionDenied(false);
    try {
      setAnalyzing(true);
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
        saveToPhotos: false,
      });
      if (result.didCancel || !result.assets?.[0]?.uri) {
        setAnalyzing(false);
        return;
      }
      navigateToAnalysis({
        analysisId: `new-${Date.now()}`,
        type: mode,
        score: 70 + Math.floor(Math.random() * 20),
        previousScore: history[0]?.score,
      });
    } catch (e) {
      Alert.alert(t('cameraPermissionTitle'), 'Fotoğraf çekilemedi.');
    } finally {
      setAnalyzing(false);
    }
  }, [mode, history, navigateToAnalysis, requestCameraPermission, t]);

  const handleGalleryPick = useCallback(async () => {
    try {
      setAnalyzing(true);
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      if (result.didCancel || !result.assets?.[0]?.uri) {
        setAnalyzing(false);
        return;
      }
      setTimeout(() => {
        setAnalyzing(false);
        navigateToAnalysis({
          analysisId: `gallery-${Date.now()}`,
          type: mode,
          score: 72 + Math.floor(Math.random() * 18),
          previousScore: history[0]?.score,
        });
      }, 600);
    } catch (e) {
      setAnalyzing(false);
      Alert.alert(t('cameraPermissionTitle'), 'Galeri açılamadı.');
    }
  }, [mode, history, navigateToAnalysis, t]);

  const handleHistoryItemPress = useCallback(
    (item: HistoryItem) => {
      navigation.getParent?.()?.navigate('AnalysisDetailScreen', {
        analysisId: item.id,
        type: item.type,
        score: item.score,
        previousScore: item.score - item.improvement,
      });
    },
    [navigation]
  );

  const handleSeeAllHistory = useCallback(() => {
    if (history.length > 0) handleHistoryItemPress(history[0]);
  }, [history, handleHistoryItemPress]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        scrollContent: { paddingBottom: 100 },
        header: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.headerBg, paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16 },
        headerTextBlock: { marginLeft: 12, flex: 1 },
        headerTitle: { fontSize: 20, fontWeight: '700' as const, color: theme.textPrimary, marginBottom: 4 },
        headerSubtitle: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
        previewWrapper: { marginHorizontal: 20, marginTop: 20 },
        cameraContainer: { width: '100%', aspectRatio: 3 / 4, borderRadius: theme.borderRadiusLarge, overflow: 'hidden' as const, backgroundColor: theme.lightPurple, marginBottom: 12 },
        previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        previewPlaceholderText: { fontSize: 16, color: theme.textSecondary, marginTop: 12 },
        previewHint: { fontSize: 12, color: theme.textSecondary, marginTop: 6 },
        captureSection: { marginHorizontal: 20, marginTop: 16 },
        tipsCard: { marginHorizontal: 20, marginTop: 20, padding: 16, backgroundColor: theme.cardBg, borderRadius: theme.borderRadiusLarge, shadowColor: theme.shadowStrong, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
        tipsTitle: { fontSize: 16, fontWeight: '700' as const, color: theme.primary, marginTop: 8, marginBottom: 10 },
        tipItem: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
        historyCard: { marginHorizontal: 20, marginTop: 20, padding: 16, backgroundColor: theme.cardBg, borderRadius: theme.borderRadiusLarge, shadowColor: theme.shadowStrong, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
        historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
        historyTitle: { flex: 1, fontSize: 16, fontWeight: '700' as const, color: theme.primary, marginLeft: 8 },
        seeAllText: { fontSize: 13, fontWeight: '600' as const, color: theme.secondary },
        galleryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 20, paddingVertical: 14, backgroundColor: theme.cardBg, borderRadius: theme.borderRadius, borderWidth: 1, borderColor: theme.lightPurple },
        galleryButtonText: { fontSize: 14, color: theme.textSecondary, marginLeft: 8 },
        loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
        loadingText: { marginTop: 12, fontSize: 14, color: theme.primary, fontWeight: '600' as const },
        bottomSpacing: { height: 24 },
        deniedCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
        deniedTitle: { fontSize: 18, fontWeight: '700' as const, color: theme.textPrimary, marginTop: 16, marginBottom: 8 },
        deniedText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' as const, marginBottom: 24 },
        settingsButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.primary, borderRadius: theme.borderRadius },
        settingsButtonText: { color: '#FFF', fontWeight: '700' as const },
      }),
    [theme]
  );

  if (cameraPermissionDenied) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="camera" size={24} color={theme.primary} />
          <Text style={styles.headerTitle}>{t('skinAnalysis')}</Text>
        </View>
        <View style={styles.deniedCard}>
          <Icon name="camera-off" size={48} color={theme.secondary} />
          <Text style={styles.deniedTitle}>{t('cameraPermissionTitle')}</Text>
          <Text style={styles.deniedText}>{t('cameraPermissionMessage')}</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>{t('settings')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const tipItems = mode === 'skin' ? [t('skinTip1'), t('skinTip2'), t('skinTip3')] : [t('scalpTip1'), t('scalpTip2'), t('scalpTip3')];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Icon name="camera" size={24} color={theme.primary} />
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>{t('skinAnalysis')}</Text>
            <Text style={styles.headerSubtitle}>{t('cameraSubtitle')}</Text>
          </View>
        </View>

        <View style={styles.previewWrapper}>
          <View style={styles.cameraContainer}>
            <View style={styles.previewPlaceholder}>
              <CameraOverlay mode={mode} />
              <OverlayGuide mode={mode} />
              <Icon name="camera" size={64} color={theme.lightPurple} />
              <Text style={styles.previewPlaceholderText}>{t('cameraPreview')}</Text>
              <Text style={styles.previewHint}>{t('takePhoto')}</Text>
            </View>
          </View>
          <ModeToggle mode={mode} onModeChange={setMode} />
        </View>

        <View style={styles.captureSection}>
          <GradientButton title={t('takePhoto')} icon={<Icon name="camera" size={22} color="#FFF" />} onPress={handleCapture} disabled={analyzing} />
        </View>

        <View style={styles.tipsCard}>
          <Icon name="star" size={18} color={theme.primary} />
          <Text style={styles.tipsTitle}>{t('skinTipsTitle')}</Text>
          {tipItems.map((item, i) => (
            <Text key={i} style={styles.tipItem}>• {item}</Text>
          ))}
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Icon name="image" size={20} color={theme.primary} />
            <Text style={styles.historyTitle}>{t('analysisHistory')}</Text>
            <TouchableOpacity onPress={handleSeeAllHistory}>
              <Text style={styles.seeAllText}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} onPress={() => handleHistoryItemPress(item)} />
          ))}
        </View>

        <TouchableOpacity style={styles.galleryButton} onPress={handleGalleryPick} disabled={analyzing}>
          <Icon name="image" size={20} color={theme.textSecondary} />
          <Text style={styles.galleryButtonText}>{t('selectFromGallery')}</Text>
        </TouchableOpacity>

        {analyzing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>...</Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

