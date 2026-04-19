import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../supabase';
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

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

type NavigationProp = BottomTabNavigationProp<MainTabParamList, 'CameraScreen'>;

export interface IssueType {
  name: string;
  impact: number;
}

export interface ExtendedHistoryItem extends HistoryItem {
  imageUri?: string;
  issues?: IssueType[];
  aiComment?: string;
}

const INITIAL_HISTORY: ExtendedHistoryItem[] = [];

const getTodayDateString = () => {
  const today = new Date();
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
};

 

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mode, setMode] = useState<CameraMode>('skin');

  const [history, setHistory] = useState<ExtendedHistoryItem[]>(INITIAL_HISTORY);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  // --- 1. VERİTABANINDAN GEÇMİŞİ ÇEKME (FastAPI Üzerinden) ---
  const fetchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${API_URL}/analysis-results/${user.id}`);
      if (!response.ok) throw new Error('Geçmiş yüklenemedi');
      
      const data = await response.json();
      
      const formattedHistory: ExtendedHistoryItem[] = data.map((item: any) => ({
        id: item.id,
        type: item.type as CameraMode,
        date: new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        score: item.score ?? 0,
        issues: item.issues ?? [],
        aiComment: item.aiComment ?? '',
        improvement: 0,
        imageUri: item.imageUri,
      }));

      setHistory(formattedHistory);
    } catch (error) {
      console.error('Geçmiş yükleme hatası:', error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // --- 2. YAPAY ZEKA VE YÜKLEME (FastAPI Üzerinden) ---
  const analyzeAndSaveWithBackend = async (base64Image: string, currentMode: CameraMode) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Kullanıcı bulunamadı");

    const payload = {
      user_id: user.id,
      base64_image: base64Image,
      mode: currentMode
    };

    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("FastAPI Analiz Hatası");
    }

    return await response.json();
  };

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch { return false; }
  }, []);

  const navigateToAnalysis = useCallback((params: any) => {
    navigation.getParent?.()?.navigate('AnalysisDetailScreen', params);
  }, [navigation]);

  const handleCapture = useCallback(async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      setCameraPermissionDenied(true);
      return;
    }
    setCameraPermissionDenied(false);

    try {
      const result = await launchCamera({ mediaType: 'photo', cameraType: 'back', quality: 0.8, saveToPhotos: false, includeBase64: true });
      if (result.didCancel || !result.assets?.[0]?.uri || !result.assets?.[0]?.base64) return;

      setAnalyzing(true);
      const asset = result.assets[0];

      // Artık FastAPI backend API'imizi çağırıyoruz
      const backendResult = await analyzeAndSaveWithBackend(asset.base64, mode);

      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: backendResult.id,
        type: mode,
        date: getTodayDateString(),
        score: backendResult.score,
        improvement: backendResult.score - previousScore,
        imageUri: backendResult.imageUri,
        issues: backendResult.issues,
        aiComment: backendResult.aiComment
      };

      setHistory(prev => [newItem, ...prev]);
      setAnalyzing(false);

      navigateToAnalysis({
        analysisId: newItem.id, type: newItem.type, score: newItem.score, previousScore,
        imageUri: imagePublicUrl, issues: newItem.issues, aiComment: newItem.aiComment
      });
    } catch (e) { console.error(e); setAnalyzing(false); Alert.alert('Hata', 'Fotoğraf çekilemedi veya analiz esnasında sorun oluştu.'); }
  }, [mode, history, navigateToAnalysis, requestCameraPermission]);

  const handleGalleryPick = useCallback(async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, includeBase64: true });
      if (result.didCancel || !result.assets?.[0]?.uri || !result.assets?.[0]?.base64) return;

      setAnalyzing(true);
      const asset = result.assets[0];

      // Artık FastAPI backend API'imizi çağırıyoruz
      const backendResult = await analyzeAndSaveWithBackend(asset.base64, mode);

      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: backendResult.id,
        type: mode,
        date: getTodayDateString(),
        score: backendResult.score,
        improvement: backendResult.score - previousScore,
        imageUri: backendResult.imageUri,
        issues: backendResult.issues,
        aiComment: backendResult.aiComment
      };

      setHistory(prev => [newItem, ...prev]);
      setAnalyzing(false);

      navigateToAnalysis({
        analysisId: newItem.id, type: newItem.type, score: newItem.score, previousScore,
        imageUri: imagePublicUrl, issues: newItem.issues, aiComment: newItem.aiComment
      });
    } catch (e) { console.error(e); setAnalyzing(false); Alert.alert('Hata', 'Galeri açılamadı veya analiz esnasında sorun oluştu.'); }
  }, [mode, history, navigateToAnalysis]);

  const handleHistoryItemPress = useCallback((item: ExtendedHistoryItem) => {
    navigation.getParent?.()?.navigate('AnalysisDetailScreen', {
      analysisId: item.id, type: item.type, score: item.score, previousScore: item.score - (item.improvement || 0),
      imageUri: item.imageUri, issues: item.issues, aiComment: item.aiComment
    });
  }, [navigation]);

  const handleSeeAllHistory = useCallback(() => { if (history.length > 0) handleHistoryItemPress(history[0]); }, [history, handleHistoryItemPress]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.headerBg, paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16 },
    headerTextBlock: { marginLeft: 12, flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
    headerSubtitle: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
    previewWrapper: { marginHorizontal: 20, marginTop: 20 },
    cameraContainer: { width: '100%', aspectRatio: 3 / 4, borderRadius: theme.borderRadiusLarge, overflow: 'hidden', backgroundColor: theme.lightPurple, marginBottom: 12 },
    previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    previewPlaceholderText: { fontSize: 16, color: theme.textSecondary, marginTop: 12 },
    previewHint: { fontSize: 12, color: theme.textSecondary, marginTop: 6 },
    captureSection: { marginHorizontal: 20, marginTop: 16 },
    tipsCard: { marginHorizontal: 20, marginTop: 20, padding: 16, backgroundColor: theme.cardBg, borderRadius: theme.borderRadiusLarge, shadowColor: theme.shadowStrong, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    tipsTitle: { fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 8, marginBottom: 10 },
    tipItem: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
    historyCard: { marginHorizontal: 20, marginTop: 20, padding: 16, backgroundColor: theme.cardBg, borderRadius: theme.borderRadiusLarge, shadowColor: theme.shadowStrong, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    historyTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.primary, marginLeft: 8 },
    seeAllText: { fontSize: 13, fontWeight: '600', color: theme.secondary },
    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 },
    emptyStateText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },
    galleryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 20, paddingVertical: 14, backgroundColor: theme.cardBg, borderRadius: theme.borderRadius, borderWidth: 1, borderColor: theme.lightPurple },
    galleryButtonText: { fontSize: 14, color: theme.textSecondary, marginLeft: 8 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', borderRadius: theme.borderRadiusLarge },
    loadingText: { marginTop: 16, fontSize: 16, color: '#FFF', fontWeight: '600' },
    bottomSpacing: { height: 24 },
    deniedCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    deniedTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginTop: 16, marginBottom: 8 },
    deniedText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 24 },
    settingsButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.primary, borderRadius: theme.borderRadius },
    settingsButtonText: { color: '#FFF', fontWeight: '700' },
  }), [theme]);

  if (cameraPermissionDenied) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Icon name="camera" size={24} color={theme.primary} /><Text style={styles.headerTitle}>{t('skinAnalysis')}</Text></View>
        <View style={styles.deniedCard}>
          <Icon name="camera-off" size={48} color={theme.secondary} />
          <Text style={styles.deniedTitle}>{t('cameraPermissionTitle')}</Text>
          <Text style={styles.deniedText}>{t('cameraPermissionMessage')}</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}><Text style={styles.settingsButtonText}>{t('settings')}</Text></TouchableOpacity>
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
          <View style={styles.headerTextBlock}><Text style={styles.headerTitle}>{t('skinAnalysis')}</Text><Text style={styles.headerSubtitle}>{t('cameraSubtitle')}</Text></View>
        </View>

        <View style={styles.previewWrapper}>
          <View style={styles.cameraContainer}>
            <View style={styles.previewPlaceholder}>
              <CameraOverlay mode={mode} /><OverlayGuide mode={mode} />
              <Icon name="camera" size={64} color={theme.lightPurple} />
              <Text style={styles.previewPlaceholderText}>{t('cameraPreview')}</Text><Text style={styles.previewHint}>{t('takePhoto')}</Text>
            </View>
            {analyzing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Yapay Zeka Analiz Ediyor...</Text>
              </View>
            )}
          </View>
          <ModeToggle mode={mode} onModeChange={setMode} />
        </View>

        <View style={styles.captureSection}>
          <GradientButton title={t('takePhoto')} icon={<Icon name="camera" size={22} color="#FFF" />} onPress={handleCapture} disabled={analyzing} />
        </View>

        <View style={styles.tipsCard}>
          <Icon name="star" size={18} color={theme.primary} /><Text style={styles.tipsTitle}>{t('skinTipsTitle')}</Text>
          {tipItems.map((item, i) => <Text key={i} style={styles.tipItem}>• {item}</Text>)}
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Icon name="image" size={20} color={theme.primary} /><Text style={styles.historyTitle}>{t('analysisHistory')}</Text>
            {history.length > 0 && <TouchableOpacity onPress={handleSeeAllHistory}><Text style={styles.seeAllText}>{t('seeAll')}</Text></TouchableOpacity>}
          </View>
          {history.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Icon name="camera" size={36} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={styles.emptyStateText}>Henüz analiz geçmişin yok.{'\n'}Hadi ilk analiz için hemen bir görsel yükle!</Text>
            </View>
          ) : (
            history.map((item) => <HistoryCard key={item.id} item={item as HistoryItem} onPress={() => handleHistoryItemPress(item)} />)
          )}
        </View>

        <TouchableOpacity style={styles.galleryButton} onPress={handleGalleryPick} disabled={analyzing}>
          <Icon name="image" size={20} color={theme.textSecondary} /><Text style={styles.galleryButtonText}>{t('selectFromGallery')}</Text>
        </TouchableOpacity>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}