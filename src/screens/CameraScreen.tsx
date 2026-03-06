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

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// API Anahtarımızı güvenli dosyadan çekiyoruz
import { GEMINI_API_KEY } from '../../secrets';

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
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mode, setMode] = useState<CameraMode>('skin');

  const [history, setHistory] = useState<ExtendedHistoryItem[]>(INITIAL_HISTORY);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch { return false; }
  }, []);

  // --- 1. VERİTABANINDAN GEÇMİŞİ ÇEKME ---
  const fetchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('analysis_results')
        .select('id, image_url, analysis_type, ai_feedback, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedHistory: ExtendedHistoryItem[] = data.map((item: any) => {
          let storagePath: string = item.image_url;
          if (storagePath.startsWith('user_analysis_photos/')) {
            storagePath = storagePath.replace('user_analysis_photos/', '');
          }

          const { data: { publicUrl } } = supabase.storage
            .from('user_analysis_photos')
            .getPublicUrl(storagePath);

          // Veritabanından gelen AI sonuçlarını okuma
          const feedback = item.ai_feedback || {};

          return {
            id: String(item.id),
            type: item.analysis_type as CameraMode,
            date: new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            score: feedback.score ?? 0,
            issues: feedback.issues ?? [],
            aiComment: feedback.aiComment ?? '',
            improvement: 0,
            imageUri: publicUrl,
          };
        });

        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Geçmiş yükleme hatası:', error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // --- 2. YAPAY ZEKA (GEMINI 2.5 FLASH) ANALİZ MOTORU ---
  const analyzeWithRealAI = async (base64Image: string, currentMode: CameraMode) => {
    try {
      const modeText = currentMode === 'skin' ? 'yüz/cilt' : 'saç derisi';
      const prompt = `Sen uzman bir dermatologsun. Ekteki ${modeText} fotoğrafını detaylıca incele. Lütfen bana tam olarak aşağıdaki JSON formatında, geçerli ve temiz bir çıktı ver. Başka hiçbir açıklama veya markdown tırnak işareti (\`\`\`) kullanma. Sadece saf JSON objesi döndür:
      {
        "score": <0 ile 100 arası genel sağlık skoru (sadece sayı)>,
        "issues": [
          { "name": "<Tespit ettiğin birinci sorunun adı (Örn: Sivilce)>", "impact": <0 ile 100 arası etki yüzdesi (sadece sayı)> }
        ],
        "aiComment": "<Kullanıcıya Türkçe, samimi ve dermatolojik tavsiyeler içeren 2-3 cümlelik yorum>"
      }`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Image } }] }],
        generationConfig: { responseMimeType: "application/json" }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) {
        const is500 = response.status >= 500;
        if (is500) throw new Error('SERVER_ERROR');
        throw new Error(data.error?.message || 'API Hatası');
      }
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Boş yanıt');
      }

      let textResponse = data.candidates[0].content.parts[0].text;
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(textResponse);

      if (parsedData.issues && Array.isArray(parsedData.issues)) {
        parsedData.issues.sort((a: any, b: any) => b.impact - a.impact);
      }
      return parsedData;
    } catch (error) {
      console.error("Yapay Zeka Hatası:", error);
      throw error;
    }
  };

  // --- 3. VERİTABANINA YÜKLEME (AI SONUÇLARIYLA BİRLİKTE) ---
  const uploadToSupabase = useCallback(async (file: { uri: string; base64?: string | null }, analysisMode: CameraMode, aiResult: any) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const fileName = `${Date.now()}.jpg`;
        const filePath = `${user.id}/${fileName}`;
        let uploadBody: ArrayBuffer | Blob;

        if (file.base64) {
          uploadBody = base64ToArrayBuffer(file.base64);
        } else {
          let normalizedUri = file.uri;
          if (!normalizedUri.startsWith('file://') && !normalizedUri.startsWith('http')) normalizedUri = `file://${normalizedUri}`;
          const response = await fetch(normalizedUri);
          uploadBody = await response.blob();
        }

        const { data: storageData, error: storageError } = await supabase.storage
          .from('user_analysis_photos')
          .upload(filePath, uploadBody, { contentType: 'image/jpeg' });

        if (storageError || !storageData) {
          console.warn('Supabase storage upload:', storageError);
          return null;
        }

        const { error: insertError } = await supabase.from('analysis_results').insert({
          user_id: user.id,
          image_url: storageData.path,
          analysis_type: analysisMode,
          ai_feedback: aiResult
        });

        if (insertError) {
          console.warn('Supabase insert:', insertError);
          return null;
        }

        const publicUrl = supabase.storage.from('user_analysis_photos').getPublicUrl(storageData.path).data.publicUrl;
        fetchHistory();
        return { publicUrl, path: storageData.path };
      } catch (error) {
        console.warn('uploadToSupabase:', error);
        return null;
      }
    }, [fetchHistory]
  );

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

      const aiResult = await analyzeWithRealAI(asset.base64, mode);
      const uploadResult = await uploadToSupabase({ uri: asset.uri, base64: asset.base64 }, mode, aiResult);
      const imagePublicUrl = uploadResult?.publicUrl ?? asset.uri;
      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: `new-${Date.now()}`,
        type: mode,
        date: getTodayDateString(),
        score: aiResult.score,
        improvement: aiResult.score - previousScore,
        imageUri: imagePublicUrl,
        issues: aiResult.issues,
        aiComment: aiResult.aiComment
      };

      setHistory(prev => [newItem, ...prev]);
      setAnalyzing(false);

      navigateToAnalysis({
        analysisId: newItem.id, type: newItem.type, score: newItem.score, previousScore,
        imageUri: imagePublicUrl, issues: newItem.issues, aiComment: newItem.aiComment
      });
    } catch (e: any) {
      setAnalyzing(false);
      const message = e?.message;
      if (message === 'SERVER_ERROR' || (typeof message === 'string' && message.includes('500'))) {
        Alert.alert(
          'Servis Hatası',
          'Analiz servisi geçici olarak yanıt vermiyor. Lütfen birkaç dakika sonra tekrar deneyin.'
        );
      } else {
        Alert.alert('Hata', message || 'Fotoğraf çekilemedi veya analiz yapılamadı.');
      }
    }
  }, [mode, history, requestCameraPermission, navigateToAnalysis, uploadToSupabase]);

  const handleGalleryPick = useCallback(async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, includeBase64: true });
      if (result.didCancel || !result.assets?.[0]?.uri || !result.assets?.[0]?.base64) return;

      setAnalyzing(true);
      const asset = result.assets[0];

      // 1. Önce Yapay Zeka analiz etsin
      const aiResult = await analyzeWithRealAI(asset.base64, mode);

      // 2. Sonra fotoğrafı ve AI sonucunu veritabanına kaydetsin
      const uploadResult = await uploadToSupabase({ uri: asset.uri, base64: asset.base64 }, mode, aiResult);

      const imagePublicUrl = uploadResult?.publicUrl ?? asset.uri;
      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: `gallery-${Date.now()}`,
        type: mode,
        date: getTodayDateString(),
        score: aiResult.score,
        improvement: aiResult.score - previousScore,
        imageUri: imagePublicUrl,
        issues: aiResult.issues,
        aiComment: aiResult.aiComment
      };

      setHistory(prev => [newItem, ...prev]);
      setAnalyzing(false);

      navigateToAnalysis({
        analysisId: newItem.id, type: newItem.type, score: newItem.score, previousScore,
        imageUri: imagePublicUrl, issues: newItem.issues, aiComment: newItem.aiComment
      });
    } catch (e) { setAnalyzing(false); Alert.alert('Hata', 'Galeri açılamadı.'); }
  }, [mode, history, navigateToAnalysis, uploadToSupabase]);

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
          <TouchableOpacity style={styles.settingsButton} onPress={() => requestCameraPermission().then(g => g && setCameraPermissionDenied(false))}>
            <Text style={styles.settingsButtonText}>Kameraya izin ver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsButton, { marginTop: 12, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.primary }]} onPress={() => Linking.openSettings()}>
            <Text style={[styles.settingsButtonText, { color: theme.primary }]}>{t('settings')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
              <CameraOverlay mode={mode} />
              <OverlayGuide mode={mode} />
              <Icon name="camera" size={64} color={theme.lightPurple} />
              <Text style={styles.previewPlaceholderText}>{t('cameraPreview')}</Text>
              <Text style={styles.previewHint}>{t('takePhoto')}</Text>
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