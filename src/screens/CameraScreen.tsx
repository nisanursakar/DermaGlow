import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import type { MainTabParamList } from '../navigation/BottomTabNavigator';
import type { CameraMode } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ModeToggle from '../components/ModeToggle';
import CameraOverlay from '../components/CameraOverlay';
import GradientButton from '../components/GradientButton';
import HistoryCard, { type HistoryItem } from '../components/HistoryCard';

// 1. DÜZELTME: Sabit IP silindi, doğru adres secret dosyasından çekiliyor.
import { API_URL } from '../../secret';

import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { launchImageLibrary } from 'react-native-image-picker';

type NavigationProp = BottomTabNavigationProp<MainTabParamList, 'CameraScreen'>;

export interface IssueType {
  name: string;
  impact: number;
}

export interface ExtendedHistoryItem extends HistoryItem {
  imageUri?: string;
  issues?: IssueType[];
  aiComment?: string;
  timestamp: number;
  yolo_condition?: string;
  yolo_treatments?: any;
}

const INITIAL_HISTORY: ExtendedHistoryItem[] = [];

const getTodayDateString = () => {
  const today = new Date();
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
};

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
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mode, setMode] = useState<CameraMode>('skin');

  const [history, setHistory] = useState<ExtendedHistoryItem[]>(INITIAL_HISTORY);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterRange, setFilterRange] = useState<'all' | '7days' | '30days' | 'custom'>('all');
  const [sortType, setSortType] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc');
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [customStartDate, setCustomStartDate] = useState<number | null>(null);
  const [customEndDate, setCustomEndDate] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const device = useCameraDevice(cameraPosition);
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // --- 1. VERİTABANINDAN GEÇMİŞİ ÇEKME (FastAPI Üzerinden) ---
  const fetchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${API_URL}/analysis-results/${user.id}`);
      if (!response.ok) throw new Error('Geçmiş yüklenemedi');

      const data = await response.json();

      const formattedHistory: ExtendedHistoryItem[] = data.map((item: any, index: number) => {
        const currentScore = Number(item.score) || 0;
        let improvement = 0;
        if (index < data.length - 1) {
          const prevScore = Number(data[index + 1].score) || 0;
          improvement = currentScore - prevScore;
        }

        return {
          id: String(item.id),
          type: item.type as CameraMode,
          date: new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          timestamp: new Date(item.created_at).getTime(),
          score: currentScore,
          issues: item.issues ?? [],
          aiComment: item.aiComment ?? '',
          improvement: improvement,
          imageUri: item.imageUri,
        };
      });

      setHistory(formattedHistory);
    } catch (error) {
      console.error('Geçmiş yükleme hatası:', error);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const processedHistory = useMemo(() => {
    let result = [...history];
    const now = Date.now();

    if (filterRange === '7days') {
      result = result.filter(item => (now - item.timestamp) <= 7 * 24 * 60 * 60 * 1000);
    } else if (filterRange === '30days') {
      result = result.filter(item => (now - item.timestamp) <= 30 * 24 * 60 * 60 * 1000);
    } else if (filterRange === 'custom' && customStartDate && customEndDate) {
      const endOfDay = new Date(customEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(item => item.timestamp >= customStartDate && item.timestamp <= endOfDay.getTime());
    }

    result.sort((a, b) => {
      if (sortType === 'date_desc') return b.timestamp - a.timestamp;
      if (sortType === 'date_asc') return a.timestamp - b.timestamp;
      if (sortType === 'score_desc') return b.score - a.score;
      if (sortType === 'score_asc') return a.score - b.score;
      return 0;
    });

    return result;
  }, [history, sortType, filterRange, customStartDate, customEndDate]);

  const totalPages = Math.max(1, Math.ceil(processedHistory.length / itemsPerPage));
  const paginatedHistory = processedHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [sortType, filterRange, itemsPerPage, customStartDate, customEndDate]);

  const changeMonth = (offset: number) => {
    setCalendarMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return next;
    });
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i).getTime());
    return days;
  }, [calendarMonth]);

  const handleDayPress = (timestamp: number) => {
    if (!customStartDate || (customStartDate && customEndDate)) {
      setCustomStartDate(timestamp);
      setCustomEndDate(null);
    } else if (timestamp < customStartDate) {
      setCustomStartDate(timestamp);
      setCustomEndDate(null);
    } else {
      setCustomEndDate(timestamp);
    }
  };

  // --- 2. YAPAY ZEKA VE YÜKLEME (FastAPI Üzerinden) ---
  const analyzeAndSaveWithBackend = async (base64Image: string, currentMode: CameraMode) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Kullanıcı bulunamadı");

    const payload = {
      user_id: user.id,
      base64_image: base64Image,
      mode: currentMode
    };

    // TAM BURAYA DA EKLİYORUZ: Her ihtimale karşı bu API'ye de URL'den user_id veriyoruz
    const response = await fetch(`${API_URL}/analyze?user_id=${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // EĞER BACKEND LIMIT DOLDU DERSE BİZZAT BURADA YAKALIYORUZ!
    if (response.status === 403) {
      throw new Error("403_LIMIT");
    }

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorText.includes("429") || errorText.includes("quota") || errorText.includes("RESOURCE_EXHAUSTED")) {
          throw new Error("Yapay zeka günlük/dakikalık limitine ulaşıldı. Lütfen 1 dakika bekleyip tekrar deneyin.");
        }
        throw new Error(errorJson.detail || errorText);
      } catch (e) {
        if (errorText.includes("429") || errorText.includes("quota") || errorText.includes("RESOURCE_EXHAUSTED")) {
          throw new Error("Yapay zeka günlük/dakikalık limitine ulaşıldı. Lütfen 1 dakika bekleyip tekrar deneyin.");
        }
        throw new Error(`FastAPI Analiz Hatası (${response.status}): ${errorText}`);
      }
    }

    return await response.json();
  };

  const navigateToAnalysis = useCallback((params: any) => {
    navigation.getParent?.()?.navigate('AnalysisDetailScreen', params);
  }, [navigation]);

  const handleCapture = useCallback(async () => {
    if (!hasPermission || !cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
      });
      setAnalyzing(true);
      const photoPath = Platform.OS === 'android' && !photo.path.startsWith('file://') ? `file://${photo.path}` : photo.path;
      const resizedImage = await ImageResizer.createResizedImage(photoPath, 800, 800, 'JPEG', 50);
      const compressedUri = resizedImage.uri;

      // --- YENİ FASTAPI ENTEGRASYONU BAŞLANGICI ---
      setLoading(true);
      setResult(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const formData = new FormData();

          // 1. FastAPI'nin asıl analiz fonksiyonu için Form içine ekliyoruz:
          formData.append('user_id', user.id);

          const fileName = compressedUri.split('/').pop() || 'photo.jpg';
          const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

          formData.append('image', {
            uri: Platform.OS === 'android' && !compressedUri.startsWith('file://') ? `file://${compressedUri}` : compressedUri,
            name: fileName,
            type: fileType,
          } as any);

          // URL'NİN SONUNA ?user_id= EKLENDİ!
          const apiResponse = await fetch(`${API_URL}/api/analyze-skin?user_id=${user.id}`, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' },
          });

          if (apiResponse.ok) {
            const responseData = await apiResponse.json();
            setResult(responseData);
            console.log("Yeni API Başarılı:", responseData);
          } else if (apiResponse.status === 403) {
            // LİMİT DOLDU YAKALANIYOR!
            Alert.alert(
              "Limit Doldu",
              "Günlük ücretsiz analiz limitinize ulaştınız! Sınırsız analiz için Premium'a geçin.",
              [
                { text: "İptal", style: "cancel" },
                {
                  text: "Premium'a Geç",
                  onPress: () => {
                    const parentNav = navigation.getParent();
                    if (parentNav) {
                      parentNav.navigate('Premium' as any); // Adı 'PremiumScreen' ise burayı değiştir
                    } else {
                      (navigation as any).navigate('Premium');
                    }
                  }
                }
              ]
            );
            setLoading(false);
            setAnalyzing(false);
            return; // LİMİT DOLDUYSA İŞLEMİ BURADA KES, DEVAM ETME!
          } else {
            console.error("Yeni API Hatası:", await apiResponse.text());
          }
        }
      } catch (err) {
        console.error("Yeni API İstek Hatası:", err);
      } finally {
        setLoading(false);
      }
      // --- YENİ FASTAPI ENTEGRASYONU BİTİŞİ ---

      let cleanPath = compressedUri;
      if (Platform.OS === 'android' && cleanPath.startsWith('file://')) cleanPath = cleanPath.replace('file://', '');

      const base64Data = await RNFS.readFile(cleanPath, 'base64');

      // FastAPI backend API'sini çağırıyoruz
      const backendResult = await analyzeAndSaveWithBackend(base64Data, mode);

      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: backendResult.id,
        type: mode,
        date: getTodayDateString(),
        timestamp: Date.now(),
        score: backendResult.score,
        improvement: backendResult.score - previousScore,
        imageUri: backendResult.imageUri,
        issues: backendResult.issues,
        aiComment: backendResult.aiComment,
        yolo_condition: backendResult?.yolo_condition ?? null,
        yolo_treatments: backendResult?.yolo_treatments ?? null
      };

      setHistory(prev => [newItem, ...prev]);
      setAnalyzing(false);

      navigateToAnalysis({
        analysisId: newItem.id, type: newItem.type, score: newItem.score, previousScore,
        imageUri: newItem.imageUri, issues: newItem.issues, aiComment: newItem.aiComment,
        yolo_condition: newItem.yolo_condition, yolo_treatments: newItem.yolo_treatments
      });
    } catch (e: any) {
      console.error(e);
      setAnalyzing(false);

      // EĞER İÇERİDEKİ FONKSİYONDAN 403 PATLARSA ONU DA BURADA YAKALIYORUZ!
      if (e.message === "403_LIMIT") {
        Alert.alert(
          "Limit Doldu",
          "Günlük ücretsiz analiz limitinize ulaştınız! Sınırsız analiz için Premium'a geçin.",
          [
            { text: "İptal", style: "cancel" },
            {
              text: "Premium'a Geç",
              onPress: () => {
                const parentNav = navigation.getParent();
                if (parentNav) {
                  parentNav.navigate('Premium' as any);
                } else {
                  (navigation as any).navigate('Premium');
                }
              }
            }
          ]
        );
        return;
      }

      Alert.alert('İşlem Başarısız', `Fotoğraf işlenemedi. Detay: ${e?.message || JSON.stringify(e)}`);
    }
  }, [mode, history, hasPermission, navigateToAnalysis, navigation]);

  // ÇÖZÜM BURADA: Galeriden seçilen fotoğraf artık kamerayla aynı kompresyon ve okuma süzgecinden geçiyor
  const handleGalleryPick = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1, // Kendi kompresörümüzü kullanacağımız için burada sıkıştırmıyoruz
        selectionLimit: 1
      });

      // Kullanıcı iptal ettiyse veya fotoğraf gelmediyse dur
      if (result.didCancel || !result.assets?.[0]?.uri) return;

      setAnalyzing(true);
      const assetUri = result.assets[0].uri;

      // 1. Tıpkı kamerada olduğu gibi kendi güvenli kompresörümüzden geçiriyoruz
      let photoPath = Platform.OS === 'android' && !assetUri.startsWith('content://') && !assetUri.startsWith('file://') ? `file://${assetUri}` : assetUri;
      const resizedImage = await ImageResizer.createResizedImage(photoPath, 800, 800, 'JPEG', 50);
      const compressedUri = resizedImage.uri;

      let cleanPath = compressedUri;
      if (Platform.OS === 'android' && cleanPath.startsWith('file://')) cleanPath = cleanPath.replace('file://', '');

      // 2. Tıpkı kamerada olduğu gibi RNFS ile çok temiz bir Base64 okuması yapıyoruz
      const base64Data = await RNFS.readFile(cleanPath, 'base64');

      // 3. FastAPI backend API'sini çağırıyoruz (Artık kamera ile %100 aynı formatta!)
      const backendResult = await analyzeAndSaveWithBackend(base64Data, mode);

      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: backendResult.id,
        type: mode,
        date: getTodayDateString(),
        timestamp: Date.now(),
        score: backendResult.score,
        improvement: backendResult.score - previousScore,
        imageUri: backendResult.imageUri,
        issues: backendResult.issues,
        aiComment: backendResult.aiComment,
        yolo_condition: backendResult?.yolo_condition ?? null,
        yolo_treatments: backendResult?.yolo_treatments ?? null
      };

      setHistory(prev => [newItem, ...prev]);
      setAnalyzing(false);

      navigateToAnalysis({
        analysisId: newItem.id, type: newItem.type, score: newItem.score, previousScore,
        imageUri: newItem.imageUri, issues: newItem.issues, aiComment: newItem.aiComment,
        yolo_condition: newItem.yolo_condition, yolo_treatments: newItem.yolo_treatments
      });
    } catch (e: any) {
      console.error(e);
      setAnalyzing(false);

      // GALERİ İÇİN 403 KONTROLÜ!
      if (e.message === "403_LIMIT") {
        Alert.alert(
          "Limit Doldu",
          "Günlük ücretsiz analiz limitinize ulaştınız! Sınırsız analiz için Premium'a geçin.",
          [
            { text: "İptal", style: "cancel" },
            {
              text: "Premium'a Geç",
              // GÜNCELLENEN KISIM: Yönlendiriciyi parent (ana) dizine çıkartarak sayfayı bulmasını sağlıyoruz
              onPress: () => {
                const parentNav = navigation.getParent();
                if (parentNav) {
                  parentNav.navigate('Premium' as any); // Adı 'PremiumScreen' ise burayı 'PremiumScreen' yapabilirsin
                } else {
                  (navigation as any).navigate('Premium');
                }
              }
            }
          ]
        );
        return;
      }

      Alert.alert('Hata', 'Galeri açılamadı veya analiz yapılamadı. Detay: ' + (e?.message || 'Bilinmeyen hata'));
    }
  }, [mode, history, navigateToAnalysis, navigation]);

  const handleHistoryItemPress = useCallback((item: ExtendedHistoryItem) => {
    navigateToAnalysis({
      analysisId: item.id, type: item.type, score: item.score, previousScore: item.score - (item.improvement || 0),
      imageUri: item.imageUri, issues: item.issues, aiComment: item.aiComment,
      yolo_condition: item.yolo_condition ?? null, yolo_treatments: item.yolo_treatments ?? null
    });
  }, [navigateToAnalysis]);

  const toggleCameraPosition = useCallback(() => {
    setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.headerBg, paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16 },
    headerTextBlock: { marginLeft: 12, flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
    headerSubtitle: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
    previewWrapper: { marginHorizontal: 20, marginTop: 20 },
    cameraContainer: { width: '100%', aspectRatio: 3 / 4, borderRadius: theme.borderRadiusLarge, overflow: 'hidden', backgroundColor: theme.lightPurple, marginBottom: 12, position: 'relative' },
    previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    previewPlaceholderText: { fontSize: 16, color: theme.textSecondary, marginTop: 12 },
    flipButton: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
    captureSection: { marginHorizontal: 20, marginTop: 16 },
    galleryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 14, backgroundColor: theme.cardBg, borderRadius: theme.borderRadius, borderWidth: 1, borderColor: theme.lightPurple },
    galleryButtonText: { fontSize: 14, color: theme.textSecondary, marginLeft: 8 },
    tipsCard: { marginHorizontal: 20, marginTop: 20, padding: 16, backgroundColor: theme.cardBg, borderRadius: theme.borderRadiusLarge, shadowColor: theme.shadowStrong, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    tipsTitle: { fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 8, marginBottom: 10 },
    tipItem: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
    historyCard: { marginHorizontal: 20, marginTop: 20, padding: 16, backgroundColor: theme.cardBg, borderRadius: theme.borderRadiusLarge, shadowColor: theme.shadowStrong, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    historyTitleWrap: { flexDirection: 'row', alignItems: 'center' },
    historyTitle: { fontSize: 16, fontWeight: '700', color: theme.primary, marginLeft: 8 },
    filterToggleBtn: { padding: 8, backgroundColor: theme.iconBg, borderRadius: 10 },
    filterMenuContainer: { backgroundColor: theme.iconBg, borderRadius: 16, padding: 16, marginBottom: 16 },
    filterSectionTitle: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 8, marginTop: 4 },
    filterScroll: { paddingBottom: 8 },
    filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, marginRight: 8 },
    filterPillActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    filterPillText: { fontSize: 12, color: theme.textPrimary, fontWeight: '600' },
    filterPillTextActive: { color: '#FFF' },
    calendarContainer: { marginTop: 12, backgroundColor: theme.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    calendarMonthText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
    calendarWeekDays: { flexDirection: 'row', marginBottom: 8 },
    calendarWeekDayText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calendarCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
    calendarCellSelected: { backgroundColor: theme.primary, borderRadius: 20 },
    calendarCellBetween: { backgroundColor: theme.primary + '30', borderRadius: 8 },
    calendarCellText: { fontSize: 13, color: theme.textPrimary, fontWeight: '500' },
    calendarCellTextSelected: { color: '#FFF', fontWeight: '700' },
    calendarInfoText: { textAlign: 'center', marginTop: 12, fontSize: 13, color: theme.primary, fontWeight: '600' },
    applyFilterBtn: { marginTop: 16, backgroundColor: theme.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    applyFilterBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 },
    emptyStateText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },
    paginationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border },
    pageBtn: { padding: 10, backgroundColor: theme.iconBg, borderRadius: 12 },
    pageBtnDisabled: { opacity: 0.3 },
    pageText: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginHorizontal: 20 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', borderRadius: theme.borderRadiusLarge, zIndex: 30 },
    loadingText: { marginTop: 16, fontSize: 16, color: '#FFF', fontWeight: '600' },
    bottomSpacing: { height: 24 },
  }), [theme]);

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
            {/* 2. DÜZELTME: Kamerayı ekrana basmadan önce hasPermission ile izni kontrol ediyoruz */}
            {device != null && hasPermission ? (
              <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={isFocused && !analyzing} photo={true} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Icon name="camera-off" size={64} color={theme.lightPurple} />
                <Text style={styles.previewPlaceholderText}>
                  {!hasPermission ? 'Kamera izni bekleniyor...' : 'Kamera Yükleniyor...'}
                </Text>
              </View>
            )}
            <View style={StyleSheet.absoluteFill} pointerEvents="none"><CameraOverlay mode={mode} /></View>
            {device != null && !analyzing && hasPermission && (
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraPosition} activeOpacity={0.7}>
                <Icon name="refresh-ccw" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
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
          <GradientButton title={t('takePhoto')} icon={<Icon name="camera" size={22} color="#FFF" />} onPress={handleCapture} disabled={analyzing || !hasPermission} />
          <TouchableOpacity style={styles.galleryButton} onPress={handleGalleryPick} disabled={analyzing}>
            <Icon name="image" size={20} color={theme.textSecondary} />
            <Text style={styles.galleryButtonText}>{t('selectFromGallery')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsCard}>
          <Icon name="star" size={18} color={theme.primary} />
          <Text style={styles.tipsTitle}>{t('skinTipsTitle')}</Text>
          {(mode === 'skin' ? [t('skinTip1'), t('skinTip2'), t('skinTip3')] : [t('scalpTip1'), t('scalpTip2'), t('scalpTip3')]).map((item, i) => (
            <Text key={i} style={styles.tipItem}>• {item}</Text>
          ))}
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.historyTitleWrap}>
              <Icon name="image" size={20} color={theme.primary} />
              <Text style={styles.historyTitle}>{t('analysisHistory')}</Text>
            </View>
            {history.length > 0 && (
              <TouchableOpacity style={[styles.filterToggleBtn, showFilterMenu && { backgroundColor: theme.primary }]} onPress={() => setShowFilterMenu(!showFilterMenu)}>
                <Icon name="sliders" size={20} color={showFilterMenu ? '#FFF' : theme.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {showFilterMenu && (
            <View style={styles.filterMenuContainer}>
              <Text style={styles.filterSectionTitle}>Tarih Aralığı</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {[
                  { id: 'all', label: 'Tüm Zamanlar' },
                  { id: '7days', label: 'Son 7 Gün' },
                  { id: '30days', label: 'Son 30 Gün' },
                  { id: 'custom', label: 'Özel Tarih Seç' }
                ].map((f) => (
                  <TouchableOpacity key={f.id} style={[styles.filterPill, filterRange === f.id && styles.filterPillActive]} onPress={() => setFilterRange(f.id as any)}>
                    <Text style={[styles.filterPillText, filterRange === f.id && styles.filterPillTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filterRange === 'custom' && (
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={() => changeMonth(-1)}><Icon name="chevron-left" size={20} color={theme.textPrimary} /></TouchableOpacity>
                    <Text style={styles.calendarMonthText}>{calendarMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</Text>
                    <TouchableOpacity onPress={() => changeMonth(1)}><Icon name="chevron-right" size={20} color={theme.textPrimary} /></TouchableOpacity>
                  </View>
                  <View style={styles.calendarWeekDays}>
                    {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => <Text key={d} style={styles.calendarWeekDayText}>{d}</Text>)}
                  </View>
                  <View style={styles.calendarGrid}>
                    {calendarDays.map((ts, index) => {
                      if (!ts) return <View key={`empty-${index}`} style={styles.calendarCell} />;
                      const isStart = ts === customStartDate;
                      const isEnd = ts === customEndDate;
                      const isBetween = customStartDate && customEndDate && ts > customStartDate && ts < customEndDate;
                      const isSelected = isStart || isEnd;
                      return (
                        <TouchableOpacity key={ts} style={[styles.calendarCell, isSelected && styles.calendarCellSelected, isBetween && styles.calendarCellBetween]} onPress={() => handleDayPress(ts)}>
                          <Text style={[styles.calendarCellText, isSelected && styles.calendarCellTextSelected]}>{new Date(ts).getDate()}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.calendarInfoText}>
                    {customStartDate ? new Date(customStartDate).toLocaleDateString('tr-TR') : 'Başlangıç seçin'} {' - '} {customEndDate ? new Date(customEndDate).toLocaleDateString('tr-TR') : 'Bitiş seçin'}
                  </Text>
                </View>
              )}

              <Text style={styles.filterSectionTitle}>Sıralama Ölçütü</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {[
                  { id: 'date_desc', label: 'En Yeni' },
                  { id: 'date_asc', label: 'En Eski' },
                  { id: 'score_desc', label: 'En Yüksek Skor' },
                  { id: 'score_asc', label: 'En Düşük Skor' }
                ].map((s) => (
                  <TouchableOpacity key={s.id} style={[styles.filterPill, sortType === s.id && styles.filterPillActive]} onPress={() => setSortType(s.id as any)}>
                    <Text style={[styles.filterPillText, sortType === s.id && styles.filterPillTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterSectionTitle}>Gösterilecek Analiz Sayısı</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {[5, 10, 20, 50].map((num) => (
                  <TouchableOpacity key={num} style={[styles.filterPill, itemsPerPage === num && styles.filterPillActive]} onPress={() => setItemsPerPage(num)}>
                    <Text style={[styles.filterPillText, itemsPerPage === num && styles.filterPillTextActive]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.applyFilterBtn} onPress={() => setShowFilterMenu(false)}>
                <Text style={styles.applyFilterBtnText}>Uygula ve Göster</Text>
              </TouchableOpacity>
            </View>
          )}

          {paginatedHistory.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Icon name="camera" size={36} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={styles.emptyStateText}>
                {history.length === 0 ? `Henüz analiz geçmişin yok.\nHadi ilk analiz için hemen bir görsel yükle!` : 'Bu filtrelere uygun analiz bulunamadı.'}
              </Text>
            </View>
          ) : (
            paginatedHistory.map((item) => <HistoryCard key={item.id} item={item as HistoryItem} onPress={() => handleHistoryItemPress(item)} />)
          )}

          {totalPages > 1 && !showFilterMenu && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <Icon name="chevron-left" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.pageText}>{currentPage} / {totalPages}</Text>
              <TouchableOpacity style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                <Icon name="chevron-right" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}