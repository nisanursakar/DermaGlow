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

type NavigationProp = BottomTabNavigationProp<MainTabParamList, 'CameraScreen'>;

export interface ExtendedHistoryItem extends HistoryItem {
  imageUri?: string;
}

// Sahte verileri tamamen sildik, artık ilk açılışta liste tertemiz (boş) gelecek
const INITIAL_HISTORY: ExtendedHistoryItem[] = [];

// Tarihi Türkçe formatta almak için yardımcı fonksiyon
const getTodayDateString = () => {
  const today = new Date();
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
};

// Base64 -> ArrayBuffer çevirici (Supabase Storage için)
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const cleaned = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
  const binaryString = global.atob ? global.atob(cleaned) : atob(cleaned);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();

  // 1. Veritabanından geçmiş analizleri çekme
  const fetchHistory = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('analysis_results')
        .select('id, image_url, analysis_type, ai_feedback, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedHistory: ExtendedHistoryItem[] = data.map((item: any) => {
          // image_url Supabase Storage path'idir (ör: "<user_id>/123456.jpg")
          let storagePath: string = item.image_url;
          // Eğer yanlışlıkla bucket adıyla başlıyorsa, onu temizle
          if (storagePath.startsWith('user_analysis_photos/')) {
            storagePath = storagePath.replace('user_analysis_photos/', '');
          }

          const {
            data: { publicUrl },
          } = supabase.storage
            .from('user_analysis_photos')
            .getPublicUrl(storagePath);

          return {
            id: String(item.id),
            type: item.analysis_type as CameraMode,
            date: new Date(item.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
            score: item.ai_feedback?.score ?? 0,
            improvement: 0,
            imageUri: publicUrl,
          };
        });

        console.log('Fetched History:', formattedHistory);
        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Geçmiş yükleme hatası:', error);
    }
  }, []);

  // 2. Uygulama açıldığında geçmişi çek
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 3. Fotoğrafı Supabase'e yükleme fonksiyonu
  const uploadToSupabase = useCallback(
    async (
      file: { uri: string; base64?: string | null },
      analysisMode: CameraMode
    ): Promise<{ publicUrl: string; path: string } | null> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const fileName = `${Date.now()}.jpg`;
        const filePath = `${user.id}/${fileName}`;

        // 1. Dosya içeriğini hazırlama
        let uploadBody: ArrayBuffer | Blob;

        if (file.base64) {
          // Image Picker'dan gelen base64 verisini kullan
          try {
            uploadBody = base64ToArrayBuffer(file.base64);
          } catch (e) {
            console.error('Base64 dönüştürme hatası:', e);
            Alert.alert('Hata', 'Fotoğraf verisi işlenemedi.');
            return;
          }
        } else {
          // Yedek yol: URI üzerinden fetch ile blob alma (hala mümkünse)
          let normalizedUri = file.uri;
          if (!normalizedUri.startsWith('file://') && !normalizedUri.startsWith('http')) {
            normalizedUri = `file://${normalizedUri}`;
          }

          try {
            const response = await fetch(normalizedUri);
            const blob = await response.blob();
            uploadBody = blob;
          } catch (networkError) {
            console.error('Network / fetch hatası:', networkError, 'URI:', normalizedUri);
            Alert.alert('Hata', 'Fotoğraf okunurken bir ağ hatası oluştu.');
            return;
          }
        }

        // 1. Storage'a yükle (user_analysis_photos/<user_id>/<timestamp>.jpg)
        const { data: storageData, error: storageError } = await supabase.storage
          .from('user_analysis_photos')
          .upload(filePath, uploadBody, { contentType: 'image/jpeg' });

        if (storageError || !storageData) {
          console.error('Storage yükleme hatası:', storageError);
          Alert.alert('Hata', 'Fotoğraf buluta yüklenemedi.');
          return null;
        }

        // 2. Veritabanına (analysis_results) kaydet
        const { error: dbError } = await supabase.from('analysis_results').insert({
          user_id: user.id,
          image_url: storageData.path,
          analysis_type: analysisMode,
        });

        if (dbError) {
          console.error('Veritabanı kayıt hatası:', dbError);
          Alert.alert('Hata', 'Analiz kaydı oluşturulamadı.');
          return null;
        }

        const publicUrl = supabase.storage
          .from('user_analysis_photos')
          .getPublicUrl(storageData.path).data.publicUrl;

        // 3. Geçmişi yenile ki tarihçede görünsün
        fetchHistory();

        return { publicUrl, path: storageData.path };
      } catch (error) {
        console.error('Yükleme hatası:', error);
        Alert.alert('Hata', 'Fotoğraf kaydedilemedi.');
        return null;
      }
    },
    [fetchHistory]
  );
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mode, setMode] = useState<CameraMode>('skin');

  const [history, setHistory] = useState<ExtendedHistoryItem[]>(INITIAL_HISTORY);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

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

  const navigateToAnalysis = useCallback(
    (params: { analysisId: string; type: 'skin' | 'scalp'; score: number; previousScore?: number; imageUri?: string }) => {
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
      const result = await launchCamera(
        {
          mediaType: 'photo',
          cameraType: 'back',
          quality: 0.8,
          saveToPhotos: false,
          includeBase64: true,
        }
      );
      if (result.didCancel || !result.assets?.[0]?.uri) {
        setAnalyzing(false);
        return;
      }

      const asset = result.assets[0];
      const photoUri = asset.uri!;
      const uploadResult = await uploadToSupabase(
        { uri: photoUri, base64: asset.base64 },
        mode
      );

      const imagePublicUrl = uploadResult?.publicUrl ?? photoUri;
      const newScore = 70 + Math.floor(Math.random() * 20);
      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: `new-${Date.now()}`,
        type: mode,
        date: getTodayDateString(),
        score: newScore,
        improvement: newScore - previousScore,
        imageUri: imagePublicUrl,
      };

      setHistory(prev => [newItem, ...prev]);

      navigateToAnalysis({
        analysisId: newItem.id,
        type: newItem.type,
        score: newItem.score,
        previousScore: previousScore,
        imageUri: imagePublicUrl,
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
        includeBase64: true,
      });
      if (result.didCancel || !result.assets?.[0]?.uri) {
        setAnalyzing(false);
        return;
      }

      const asset = result.assets[0];
      const selectedImageUri = asset.uri!;
      const uploadResult = await uploadToSupabase(
        { uri: selectedImageUri, base64: asset.base64 },
        mode
      );

      const imagePublicUrl = uploadResult?.publicUrl ?? selectedImageUri;

      const newScore = 72 + Math.floor(Math.random() * 18);
      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: `gallery-${Date.now()}`,
        type: mode,
        date: getTodayDateString(),
        score: newScore,
        improvement: newScore - previousScore,
        imageUri: imagePublicUrl,
      };

      setHistory(prev => [newItem, ...prev]);

      setTimeout(() => {
        setAnalyzing(false);
        navigateToAnalysis({
          analysisId: newItem.id,
          type: newItem.type,
          score: newItem.score,
          previousScore: previousScore,
          imageUri: imagePublicUrl,
        });
      }, 600);
    } catch (e) {
      setAnalyzing(false);
      Alert.alert(t('cameraPermissionTitle'), 'Galeri açılamadı.');
    }
  }, [mode, history, navigateToAnalysis, t]);

  const handleHistoryItemPress = useCallback(
    (item: ExtendedHistoryItem) => {
      navigation.getParent?.()?.navigate('AnalysisDetailScreen', {
        analysisId: item.id,
        type: item.type,
        score: item.score,
        previousScore: item.score - (item.improvement || 0),
        imageUri: item.imageUri,
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

        // Yeni eklenen Boş Durum (Empty State) tasarımları
        emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 },
        emptyStateText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' as const, lineHeight: 22 },

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

            {/* Eğer geçmiş boşsa "Tümünü Gör" butonunu saklıyoruz */}
            {history.length > 0 && (
              <TouchableOpacity onPress={handleSeeAllHistory}>
                <Text style={styles.seeAllText}>{t('seeAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Akıllı Liste: Boşsa mesaj göster, doluysa kartları göster */}
          {history.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Icon name="camera" size={36} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={styles.emptyStateText}>
                Henüz analiz geçmişin yok.{'\n'}Hadi ilk analiz için hemen bir görsel yükle!
              </Text>
            </View>
          ) : (
            history.map((item) => (
              <HistoryCard key={item.id} item={item as HistoryItem} onPress={() => handleHistoryItemPress(item)} />
            ))
          )}
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