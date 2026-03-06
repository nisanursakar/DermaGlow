import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // YENİ EKLENDİ: Ekran boşluklarını hesaplar

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile } from '../context/UserProfileContext';

export default function HomeScreen({ navigation }: { navigation: { getParent?: () => { navigate: (name: string) => void } } }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { profile } = useUserProfile();

  // YENİ EKLENDİ: Telefonun üst çentik/saat alanının yüksekliğini otomatik alır
  const insets = useSafeAreaInsets();

  // YENİ EKLENDİ: Stilleri RoutineScreen'deki gibi temaya tam duyarlı (dinamik) hale getirdik
  const styles = useMemo(() => createHomeStyles(theme), [theme]);

  const displayName = profile.displayName;

  type InfoType = 'drySkin' | 'waterEffect' | 'routineDiff';
  const [selectedInfo, setSelectedInfo] = useState<InfoType | null>(null);

  const getInfoTitleKey = (info: InfoType) => {
    switch (info) {
      case 'drySkin': return 'drySkinReasons';
      case 'waterEffect': return 'waterEffect';
      case 'routineDiff': return 'routineDiff';
      default: return 'skinHealthInfo';
    }
  };

  const getInfoDetailKey = (info: InfoType) => {
    switch (info) {
      case 'drySkin': return 'drySkinDetail';
      case 'waterEffect': return 'waterEffectDetail';
      case 'routineDiff': return 'routineDiffDetail';
      default: return 'skinHealthInfo';
    }
  };

  const waterTarget = 2000;
  const [waterHistory, setWaterHistory] = useState<number[]>([]);
  const waterCurrent = waterHistory.reduce((a, b) => a + b, 0);
  const [customMlInput, setCustomMlInput] = useState('');
  const waterProgress = Math.min(waterCurrent / waterTarget, 1);
  const waterTargetLabel = t('waterTargetMl');
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showCustomWater, setShowCustomWater] = useState(false);

  useEffect(() => {
    if (waterCurrent >= waterTarget && !hasCelebrated) {
      setShowCelebration(true);
      setHasCelebrated(true);
    }
  }, [waterCurrent, waterTarget, hasCelebrated]);

  const addWater = (ml: number) => setWaterHistory((prev) => [...prev, ml]);
  const undoWater = () => setWaterHistory((prev) => prev.slice(0, -1));

  const addCustomWater = () => {
    const num = parseInt(customMlInput.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      addWater(num);
      setCustomMlInput('');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          // ÇÖZÜM BURADA: Sabit 20px yerine, her telefonun saat çubuğu ne kadarsa (insets.top) o kadar aşağı itiyoruz!
          { paddingTop: Math.max(20, insets.top + 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingContainer}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingText}>
              Hoş Geldin, {displayName}
            </Text>
            <Text style={styles.welcomeText}>
              {t('skinDiscover')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.getParent?.()?.navigate('ProfileScreen')}
            activeOpacity={0.8}
          >
            {profile.profileImageUri ? (
              <Image source={{ uri: profile.profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dailyGoals')}</Text>
          <View style={styles.waterTrackingContainer}>
            <View style={styles.waterInfoRow}>
              <Text style={styles.waterTargetText}>{waterTarget}{waterTargetLabel}</Text>
              <Text style={styles.waterProgressText}>
                {waterCurrent}ml / {waterTarget}ml
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${waterProgress * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.flameIconsContainer}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.flameIcon,
                      index < Math.round(waterProgress * 5) && { backgroundColor: theme.waterBlue ?? theme.primaryLight },
                    ]}
                  >
                    <Text style={styles.flameIconText}>💧</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.addWaterLabel}>{t('addWater')}</Text>
            <View style={styles.waterButtonsRow}>
              <TouchableOpacity style={styles.waterAddButton} onPress={() => addWater(200)} activeOpacity={0.8}>
                <Text style={styles.waterAddButtonText}>{t('add200ml')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waterAddButtonSecondary} onPress={() => addWater(500)} activeOpacity={0.8}>
                <Text style={styles.waterAddButtonText}>{t('add500ml')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.customWaterToggle} onPress={() => setShowCustomWater((v) => !v)} activeOpacity={0.7}>
              <Text style={styles.customWaterToggleText}>{t('customAmountLabel')}</Text>
              <Icon name={showCustomWater ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            {showCustomWater && (
              <View style={styles.customWaterRow}>
                <TextInput
                  style={styles.customWaterInput}
                  placeholder={t('customMlPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={customMlInput}
                  onChangeText={setCustomMlInput}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.customWaterAddBtn} onPress={addCustomWater} activeOpacity={0.8}>
                  <Text style={styles.waterAddButtonText}>{t('addWaterButton')}</Text>
                </TouchableOpacity>
              </View>
            )}
            {waterHistory.length > 0 && (
              <TouchableOpacity style={styles.undoButton} onPress={undoWater} activeOpacity={0.8}>
                <Text style={styles.undoButtonText}>{t('undoWater')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('productFind')}</Text>
          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.8}
            onPress={() => navigation.getParent?.()?.navigate('ProductSearchScreen')}
          >
            <Icon name="search" size={18} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>{t('searchProductPlaceholder')}</Text>
          </TouchableOpacity>
          <Text style={styles.searchSubtitle}>{t('skinDiscover')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('skinHealthInfo')}</Text>

        <TouchableOpacity style={styles.infoCard} activeOpacity={0.8} onPress={() => setSelectedInfo('drySkin')}>
          <View style={styles.infoIconContainer}><Text style={styles.infoIcon}>💧</Text></View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('drySkinReasons')}</Text>
            <Text style={styles.infoSubtitle}>{t('drySkinSub')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoCard} activeOpacity={0.8} onPress={() => setSelectedInfo('waterEffect')}>
          <View style={styles.infoIconContainer}><Text style={styles.infoIcon}>🌊</Text></View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('waterEffect')}</Text>
            <Text style={styles.infoSubtitle}>{t('waterEffectSub')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoCard} activeOpacity={0.8} onPress={() => setSelectedInfo('routineDiff')}>
          <View style={styles.infoIconContainer}><Text style={styles.infoIcon}>🌅</Text></View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('routineDiff')}</Text>
            <Text style={styles.infoSubtitle}>{t('routineDiffSub')}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {selectedInfo && (
        <View style={styles.infoSheetOverlay}>
          <View style={styles.infoSheet}>
            <TouchableOpacity style={styles.infoSheetClose} onPress={() => setSelectedInfo(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.infoSheetCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.infoSheetTitle}>{t(getInfoTitleKey(selectedInfo))}</Text>
            <ScrollView style={styles.infoSheetBody} showsVerticalScrollIndicator={true}>
              <Text style={styles.infoSheetText}>{t(getInfoDetailKey(selectedInfo))}</Text>
            </ScrollView>
          </View>
        </View>
      )}

      <Modal visible={showCelebration} transparent animationType="fade">
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationTitle}>{t('waterCelebrationTitle')}</Text>
            <Text style={styles.celebrationMessage}>{t('waterCelebrationMessage')}</Text>
            <TouchableOpacity style={styles.celebrationButton} onPress={() => setShowCelebration(false)} activeOpacity={0.8}>
              <Text style={styles.celebrationButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// YENİ EKLENDİ: Tüm stilleri temanın renklerini güvenle kullanabilmesi için fonksiyon içine aldık (Tıpkı RoutineScreen gibi)
function createHomeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
    greetingContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    greetingTextContainer: { flex: 1 },
    greetingText: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: theme.textPrimary },
    welcomeText: { fontSize: 16, fontWeight: '500', color: theme.textSecondary },
    avatarContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
    avatarImage: { width: 56, height: 56, borderRadius: 28 },
    avatarText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
    card: { borderRadius: 16, padding: 20, marginBottom: 16, backgroundColor: theme.cardBg, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: theme.textPrimary },
    waterTrackingContainer: { marginTop: 4 },
    waterInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    waterTargetText: { fontSize: 14, fontWeight: '600', color: theme.primary },
    waterProgressText: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },
    progressBarContainer: { marginTop: 8 },
    progressBarBackground: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12, backgroundColor: theme.iconBg },
    progressBarFill: { height: '100%', borderRadius: 6, backgroundColor: theme.waterBlue ?? theme.primaryLight },
    flameIconsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    flameIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.iconBg },
    flameIconText: { fontSize: 16 },
    addWaterLabel: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8, color: theme.textSecondary },
    waterButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    waterAddButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary },
    waterAddButtonSecondary: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primaryLight ?? theme.primary },
    waterAddButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    customWaterToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginTop: 8, borderColor: theme.textSecondary + '40' },
    customWaterToggleText: { fontSize: 14, color: theme.textSecondary },
    customWaterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
    customWaterInput: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' },
    customWaterAddBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: theme.primary },
    undoButton: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: theme.primary },
    undoButtonText: { fontSize: 14, fontWeight: '700', color: theme.primary },
    searchButton: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, marginBottom: 8, backgroundColor: theme.primary, borderColor: 'transparent' },
    searchButtonText: { marginLeft: 8, fontSize: 16, color: '#FFFFFF' },
    searchSubtitle: { fontSize: 13, fontStyle: 'italic', color: theme.textSecondary },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 16, color: theme.textPrimary },
    infoCard: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12, backgroundColor: theme.cardBg, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
    infoIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: theme.accentPink ?? theme.lightPurple },
    infoIcon: { fontSize: 24 },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, color: theme.textPrimary },
    infoSubtitle: { fontSize: 13, lineHeight: 18, color: theme.textSecondary },
    bottomSpacing: { height: 20 },
    infoSheetOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end', backgroundColor: theme.background + 'CC' },
    infoSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 28, maxHeight: '70%', backgroundColor: theme.cardBg, shadowColor: theme.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
    infoSheetClose: { position: 'absolute', right: 16, top: 12, zIndex: 1 },
    infoSheetCloseText: { fontSize: 18, fontWeight: '700', color: theme.textSecondary },
    infoSheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, paddingRight: 32, color: theme.textPrimary },
    infoSheetBody: { maxHeight: '100%' },
    infoSheetText: { fontSize: 14, lineHeight: 21, color: theme.textSecondary },
    celebrationOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.background + 'E6' },
    celebrationCard: { borderRadius: 20, padding: 28, alignItems: 'center', maxWidth: 320, backgroundColor: theme.cardBg, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
    celebrationTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, color: theme.primary },
    celebrationMessage: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24, color: theme.textSecondary },
    celebrationButton: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14, backgroundColor: theme.primary },
    celebrationButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  });
}