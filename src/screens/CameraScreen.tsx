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
    (params: { analysisId: string; type: 'skin' | 'scalp'; score: number; previousScore?: number; imageUri?: string; issues?: IssueType[]; aiComment?: string }) => {
      navigation.getParent?.()?.navigate('AnalysisDetailScreen', params);
    },
    [navigation]
  );

  // --- GERÇEK YAPAY ZEKA ANALİZ MOTORU (GOOGLE GEMINI 2.5 FLASH) ---
  const analyzeWithRealAI = async (base64Image: string, currentMode: CameraMode) => {
    try {
      const modeText = currentMode === 'skin' ? 'yüz/cilt' : 'saç derisi';
      const prompt = `Sen uzman bir dermatologsun. Ekteki ${modeText} fotoğrafını detaylıca incele. Lütfen bana tam olarak aşağıdaki JSON formatında, geçerli ve temiz bir çıktı ver. Başka hiçbir açıklama, selamlama veya markdown tırnak işareti (\`\`\`) kullanma. Sadece saf JSON objesi döndür:
      {
        "score": <0 ile 100 arası genel sağlık skoru (sadece sayı)>,
        "issues": [
          { "name": "<Tespit ettiğin birinci sorunun adı (Örn: Sivilce, Nem Kaybı)>", "impact": <0 ile 100 arası etki yüzdesi (sadece sayı)> },
          { "name": "<Tespit ettiğin ikinci sorunun adı>", "impact": <0 ile 100 arası etki yüzdesi> }
        ],
        "aiComment": "<Kullanıcıya Türkçe, samimi ve dermatolojik tavsiyeler içeren 2-3 cümlelik yorum>"
      }`;

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      // GEMINI 2.5 FLASH KULLANILIYOR
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API Hatası');
      }

      let textResponse = data.candidates[0].content.parts[0].text;

      // Güvenlik: Gemini bazen ```json etiketleri koyabilir, onları temizliyoruz
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedData = JSON.parse(textResponse);

      // JSON içindeki sorunları etki yüzdesine göre büyükten küçüğe sıralayalım
      if (parsedData.issues && Array.isArray(parsedData.issues)) {
        parsedData.issues.sort((a: any, b: any) => b.impact - a.impact);
      }

      return parsedData;

    } catch (error) {
      console.error("Yapay Zeka Analiz Hatası:", error);
      return {
        score: 65,
        issues: [{ name: 'Analiz Tamamlanamadı', impact: 0 }],
        aiComment: 'Görsel tam olarak işlenemedi. Lütfen daha net veya aydınlık bir ortamda tekrar fotoğraf çekin.'
      };
    }
  };

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
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: true, // YAPAY ZEKA İÇİN FOTOĞRAFI METNE ÇEVİRİR
      });
      if (result.didCancel || !result.assets?.[0]?.uri || !result.assets?.[0]?.base64) {
        return;
      }

      const photoUri = result.assets[0].uri;
      const base64Image = result.assets[0].base64;

      setAnalyzing(true);
      const analysisResult = await analyzeWithRealAI(base64Image, mode); // GERÇEK YAPAY ZEKAYI ÇAĞIR
      setAnalyzing(false);

      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: `new-${Date.now()}`,
        type: mode,
        date: getTodayDateString(),
        score: analysisResult.score,
        improvement: analysisResult.score - previousScore,
        imageUri: photoUri,
        issues: analysisResult.issues,
        aiComment: analysisResult.aiComment
      };

      setHistory(prev => [newItem, ...prev]);

      navigateToAnalysis({
        analysisId: newItem.id,
        type: newItem.type,
        score: newItem.score,
        previousScore: previousScore,
        imageUri: photoUri,
        issues: newItem.issues,
        aiComment: newItem.aiComment
      });
    } catch (e) {
      setAnalyzing(false);
      Alert.alert(t('errorTitle'), 'Fotoğraf çekilemedi.');
    }
  }, [mode, history, navigateToAnalysis, requestCameraPermission, t]);

  const handleGalleryPick = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true, // YAPAY ZEKA İÇİN FOTOĞRAFI METNE ÇEVİRİR
      });
      if (result.didCancel || !result.assets?.[0]?.uri || !result.assets?.[0]?.base64) {
        return;
      }

      const selectedImageUri = result.assets[0].uri;
      const base64Image = result.assets[0].base64;

      setAnalyzing(true);
      const analysisResult = await analyzeWithRealAI(base64Image, mode); // GERÇEK YAPAY ZEKAYI ÇAĞIR
      setAnalyzing(false);

      const previousScore = history.length > 0 ? history[0].score : 70;

      const newItem: ExtendedHistoryItem = {
        id: `gallery-${Date.now()}`,
        type: mode,
        date: getTodayDateString(),
        score: analysisResult.score,
        improvement: analysisResult.score - previousScore,
        imageUri: selectedImageUri,
        issues: analysisResult.issues,
        aiComment: analysisResult.aiComment
      };

      setHistory(prev => [newItem, ...prev]);

      navigateToAnalysis({
        analysisId: newItem.id,
        type: newItem.type,
        score: newItem.score,
        previousScore: previousScore,
        imageUri: selectedImageUri,
        issues: newItem.issues,
        aiComment: newItem.aiComment
      });
    } catch (e) {
      setAnalyzing(false);
      Alert.alert(t('errorTitle'), 'Galeri açılamadı.');
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
        issues: item.issues,
        aiComment: item.aiComment
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
        emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 },
        emptyStateText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' as const, lineHeight: 22 },
        galleryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 20, paddingVertical: 14, backgroundColor: theme.cardBg, borderRadius: theme.borderRadius, borderWidth: 1, borderColor: theme.lightPurple },
        galleryButtonText: { fontSize: 14, color: theme.textSecondary, marginLeft: 8 },
        loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', borderRadius: theme.borderRadiusLarge },
        loadingText: { marginTop: 16, fontSize: 16, color: '#FFF', fontWeight: '600' as const },
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

            {analyzing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Google AI Analiz Ediyor...</Text>
              </View>
            )}

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
            {history.length > 0 && (
              <TouchableOpacity onPress={handleSeeAllHistory}>
                <Text style={styles.seeAllText}>{t('seeAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

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

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}