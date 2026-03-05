import React, { useState, useEffect } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile } from '../context/UserProfileContext';

export default function HomeScreen({ navigation }: { navigation: { getParent?: () => { navigate: (name: string) => void } } }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { profile } = useUserProfile();
  const displayName = profile.displayName ;

  type InfoType = 'drySkin' | 'waterEffect' | 'routineDiff';
  const [selectedInfo, setSelectedInfo] = useState<InfoType | null>(null);

  const getInfoTitleKey = (info: InfoType) => {
    switch (info) {
      case 'drySkin':
        return 'drySkinReasons';
      case 'waterEffect':
        return 'waterEffect';
      case 'routineDiff':
        return 'routineDiff';
      default:
        return 'skinHealthInfo';
    }
  };

  const getInfoDetailKey = (info: InfoType) => {
    switch (info) {
      case 'drySkin':
        return 'drySkinDetail';
      case 'waterEffect':
        return 'waterEffectDetail';
      case 'routineDiff':
        return 'routineDiffDetail';
      default:
        return 'skinHealthInfo';
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

  const addWater = (ml: number) => {
    setWaterHistory((prev) => [...prev, ml]);
  };

  const undoWater = () => {
    setWaterHistory((prev) => prev.slice(0, -1));
  };

  const addCustomWater = () => {
    const num = parseInt(customMlInput.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      addWater(num);
      setCustomMlInput('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingContainer}>
          <View style={styles.greetingTextContainer}>
            <Text style={[styles.greetingText, { color: theme.textPrimary }]}>
              Hoş Geldin, {displayName}
            </Text>
            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
              {t('skinDiscover')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarContainer, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}
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

        <View style={[styles.card, { backgroundColor: theme.cardBg, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{t('dailyGoals')}</Text>
          <View style={styles.waterTrackingContainer}>
            <View style={styles.waterInfoRow}>
              <Text style={[styles.waterTargetText, { color: theme.primary }]}>{waterTarget}{waterTargetLabel}</Text>
              <Text style={[styles.waterProgressText, { color: theme.textSecondary }]}>
                {waterCurrent}ml / {waterTarget}ml
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarBackground, { backgroundColor: theme.iconBg }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${waterProgress * 100}%`, backgroundColor: theme.waterBlue ?? theme.primaryLight },
                  ]}
                />
              </View>
              <View style={styles.flameIconsContainer}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.flameIcon,
                      { backgroundColor: theme.iconBg },
                      index < Math.round(waterProgress * 5) && { backgroundColor: theme.waterBlue ?? theme.primaryLight },
                    ]}
                  >
                    <Text style={styles.flameIconText}>💧</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={[styles.addWaterLabel, { color: theme.textSecondary }]}>{t('addWater')}</Text>
            <View style={styles.waterButtonsRow}>
              <TouchableOpacity
                style={[styles.waterAddButton, { backgroundColor: theme.primary }]}
                onPress={() => addWater(200)}
                activeOpacity={0.8}
              >
                <Text style={styles.waterAddButtonText}>{t('add200ml')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.waterAddButton, { backgroundColor: theme.primaryLight ?? theme.primary }]}
                onPress={() => addWater(500)}
                activeOpacity={0.8}
              >
                <Text style={styles.waterAddButtonText}>{t('add500ml')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.customWaterToggle, { borderColor: theme.textSecondary + '40' }]}
              onPress={() => setShowCustomWater((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.customWaterToggleText, { color: theme.textSecondary }]}>{t('customAmountLabel')}</Text>
              <Icon name={showCustomWater ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            {showCustomWater && (
              <View style={styles.customWaterRow}>
                <TextInput
                  style={[styles.customWaterInput, { backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
                  placeholder={t('customMlPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={customMlInput}
                  onChangeText={setCustomMlInput}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.customWaterAddBtn, { backgroundColor: theme.primary }]}
                  onPress={addCustomWater}
                  activeOpacity={0.8}
                >
                  <Text style={styles.waterAddButtonText}>{t('addWaterButton')}</Text>
                </TouchableOpacity>
              </View>
            )}
            {waterHistory.length > 0 && (
              <TouchableOpacity
                style={[styles.undoButton, { borderColor: theme.primary }]}
                onPress={undoWater}
                activeOpacity={0.8}
              >
                <Text style={[styles.undoButtonText, { color: theme.primary }]}>{t('undoWater')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{t('productFind')}</Text>
          <TouchableOpacity
            style={[
              styles.searchButton,
              { backgroundColor: theme.primary, borderColor: 'transparent' },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.getParent?.()?.navigate('ProductSearchScreen')}
          >
            <Icon name="search" size={18} color="#FFFFFF" />
            <Text style={[styles.searchButtonText, { color: '#FFFFFF' }]}>
              {t('searchProductPlaceholder')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.searchSubtitle, { color: theme.textSecondary }]}>
            {t('skinDiscover')}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('skinHealthInfo')}</Text>

        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadow }]}
          activeOpacity={0.8}
          onPress={() => setSelectedInfo('drySkin')}
        >
          <View style={[styles.infoIconContainer, { backgroundColor: theme.accentPink ?? theme.lightPurple }]}>
            <Text style={styles.infoIcon}>💧</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>{t('drySkinReasons')}</Text>
            <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>{t('drySkinSub')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadow }]}
          activeOpacity={0.8}
          onPress={() => setSelectedInfo('waterEffect')}
        >
          <View style={[styles.infoIconContainer, { backgroundColor: theme.accentPink ?? theme.lightPurple }]}>
            <Text style={styles.infoIcon}>🌊</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>{t('waterEffect')}</Text>
            <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>{t('waterEffectSub')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadow }]}
          activeOpacity={0.8}
          onPress={() => setSelectedInfo('routineDiff')}
        >
          <View style={[styles.infoIconContainer, { backgroundColor: theme.accentPink ?? theme.lightPurple }]}>
            <Text style={styles.infoIcon}>🌅</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>{t('routineDiff')}</Text>
            <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>{t('routineDiffSub')}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {selectedInfo && (
        <View style={[styles.infoSheetOverlay, { backgroundColor: theme.background + 'CC' }]}>
          <View style={[styles.infoSheet, { backgroundColor: theme.cardBg, shadowColor: theme.shadow }]}>
            <TouchableOpacity
              style={styles.infoSheetClose}
              onPress={() => setSelectedInfo(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.infoSheetCloseText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.infoSheetTitle, { color: theme.textPrimary }]}>
              {t(getInfoTitleKey(selectedInfo))}
            </Text>
            <ScrollView style={styles.infoSheetBody} showsVerticalScrollIndicator={true}>
              <Text style={[styles.infoSheetText, { color: theme.textSecondary }]}>
                {t(getInfoDetailKey(selectedInfo))}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}

      <Modal visible={showCelebration} transparent animationType="fade">
        <View style={[styles.celebrationOverlay, { backgroundColor: theme.background + 'E6' }]}>
          <View style={[styles.celebrationCard, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.celebrationTitle, { color: theme.primary }]}>{t('waterCelebrationTitle')}</Text>
            <Text style={[styles.celebrationMessage, { color: theme.textSecondary }]}>{t('waterCelebrationMessage')}</Text>
            <TouchableOpacity
              style={[styles.celebrationButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowCelebration(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.celebrationButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  greetingContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetingTextContainer: { flex: 1 },
  greetingText: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  welcomeText: { fontSize: 16, fontWeight: '500' },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  card: { borderRadius: 16, padding: 20, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  waterTrackingContainer: { marginTop: 4 },
  waterInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  waterTargetText: { fontSize: 14, fontWeight: '600' },
  waterProgressText: { fontSize: 14, fontWeight: '500' },
  progressBarContainer: { marginTop: 8 },
  progressBarBackground: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  flameIconsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flameIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flameIconText: { fontSize: 16 },
  addWaterLabel: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  waterButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  waterAddButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  waterAddButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  customWaterToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  customWaterToggleText: { fontSize: 14 },
  customWaterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  customWaterInput: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  customWaterAddBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  undoButton: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2 },
  undoButtonText: { fontSize: 14, fontWeight: '700' },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  searchInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 8, borderWidth: 1 },
  searchSubtitle: { fontSize: 13, fontStyle: 'italic' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 16 },
  infoCard: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  infoIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoIcon: { fontSize: 24 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  infoSubtitle: { fontSize: 13, lineHeight: 18 },
  bottomSpacing: { height: 20 },
  infoSheetOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
  },
  infoSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '70%',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  infoSheetClose: {
    position: 'absolute',
    right: 16,
    top: 12,
    zIndex: 1,
  },
  infoSheetCloseText: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingRight: 32,
  },
  infoSheetBody: {
    maxHeight: '100%',
  },
  infoSheetText: {
    fontSize: 14,
    lineHeight: 21,
  },
  celebrationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrationCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    maxWidth: 320,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  celebrationTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  celebrationMessage: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  celebrationButton: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  celebrationButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
