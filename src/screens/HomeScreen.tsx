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
  Dimensions,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile } from '../context/UserProfileContext';
import { supabase } from '../../supabase';
import { GlassCard, ScoreRing, SectionHeader } from '../components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.62;

type Nav = {
  navigate: (name: string) => void;
  getParent?: () => { navigate: (name: string) => void };
};

const MOCK_PRODUCTS = [
  { id: '1', name: 'Hydra Glow Serum', compatibility: '92%', rating: 4.8, reviews: 234, emoji: '🧴' },
  { id: '2', name: 'Gentle Foam Cleanser', compatibility: '88%', rating: 4.6, reviews: 189, emoji: '🫧' },
  { id: '3', name: 'Barrier Repair Cream', compatibility: '95%', rating: 4.9, reviews: 312, emoji: '✨' },
];

const MOCK_COMMUNITY = [
  { id: '1', user: 'Elif K.', text: '2 haftalık rutin sonrası cildim çok daha dengeli!', likes: 42 },
  { id: '2', user: 'Mert A.', text: 'Bu nemlendiriciyi topluluk önerisiyle keşfettim.', likes: 28 },
];

const DAILY_TIPS = ['tipHydration', 'tipSunscreen', 'tipRoutine'] as const;

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { profile } = useUserProfile();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createHomeStyles(theme), [theme]);

  const [userName, setUserName] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showCustomWater, setShowCustomWater] = useState(false);
  const [customMlInput, setCustomMlInput] = useState('');
  const [waterHistory, setWaterHistory] = useState<number[]>([]);

  const waterTarget = 2000;
  const waterCurrent = waterHistory.reduce((a, b) => a + b, 0);
  const waterProgress = Math.min(waterCurrent / waterTarget, 1);

  const skinScore = 82;
  const scalpScore = 76;

  const rootNav = navigation.getParent?.();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('users').select('name').eq('id', user.id).single();
          if (data?.name) setUserName(data.name);
          else if (user.user_metadata?.full_name) setUserName(user.user_metadata.full_name);
          else setUserName(user.email?.split('@')[0] || profile.displayName);
        }
      } catch {
        setUserName(profile.displayName);
      }
    };
    fetchUser();
  }, [profile.displayName]);

  useEffect(() => {
    if (waterCurrent >= waterTarget && !hasCelebrated) {
      setShowCelebration(true);
      setHasCelebrated(true);
    }
  }, [waterCurrent, hasCelebrated]);

  const addWater = (ml: number) => setWaterHistory((prev) => [...prev, ml]);
  const undoWater = () => setWaterHistory((prev) => prev.slice(0, -1));

  const quickActions = [
    { key: 'skin', emoji: '✨', label: t('skinAnalysis'), screen: 'CameraScreen', tab: true },
    { key: 'scalp', emoji: '💆', label: t('scalpAnalysis'), screen: 'CameraScreen', tab: true },
    { key: 'routine', emoji: '🌿', label: t('dailyRoutine'), screen: 'RoutineScreen', tab: true },
    { key: 'premium', emoji: '💎', label: t('tabPremium'), screen: 'PremiumScreen', tab: true },
    { key: 'search', emoji: '🛍️', label: t('productSearch'), screen: 'ProductSearchScreen', tab: false },
  ];

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    if (action.tab) {
      navigation.navigate(action.screen);
    } else {
      rootNav?.navigate(action.screen);
    }
  };

  const renderProduct = ({ item }: { item: (typeof MOCK_PRODUCTS)[0] }) => (
    <GlassCard style={styles.productCard} padding={16}>
      <View style={[styles.productImage, { backgroundColor: theme.mint }]}>
        <Text style={styles.productEmoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.productMeta}>
        <View style={[styles.badge, { backgroundColor: theme.mint }]}>
          <Text style={styles.badgeText}>{item.compatibility} {t('compatibility')}</Text>
        </View>
      </View>
      <View style={styles.ratingRow}>
        <Icon name="star" size={14} color={theme.accent} />
        <Text style={styles.ratingText}>{item.rating}</Text>
        <Text style={styles.reviewCount}>({item.reviews} {t('reviews')})</Text>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(20, insets.top + 12),
            paddingBottom: 64 + Math.max(insets.bottom, 12) + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <GlassCard style={styles.welcomeCard} padding={20}>
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeTextWrap}>
              <Text style={styles.welcomeLabel}>{t('welcomeBack')}</Text>
              <Text style={styles.welcomeName}>{userName ?? '...'}</Text>
            </View>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => rootNav?.navigate('ProfileScreen')}
              activeOpacity={0.8}
            >
              {profile.profileImageUri ? (
                <Image source={{ uri: profile.profileImageUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarLetter}>
                  {userName ? userName.charAt(0).toUpperCase() : '?'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Health Scores */}
        <View style={styles.scoreRow}>
          <GlassCard style={styles.scoreCard} padding={16}>
            <Text style={styles.scoreLabel}>{t('skinHealthScore')}</Text>
            <ScoreRing score={skinScore} size={88} color={theme.primary} />
          </GlassCard>
          <GlassCard style={styles.scoreCard} padding={16}>
            <Text style={styles.scoreLabel}>{t('scalpHealthScore')}</Text>
            <ScoreRing score={scalpScore} size={88} color={theme.accent} />
          </GlassCard>
        </View>

        {/* Hydration Tracker */}
        <GlassCard>
          <SectionHeader title={t('hydrationTracker')} />
          <View style={styles.waterInfoRow}>
            <Text style={styles.waterProgress}>
              {waterCurrent}ml / {waterTarget}ml
            </Text>
            <Text style={styles.waterPercent}>{Math.round(waterProgress * 100)}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${waterProgress * 100}%` }]} />
          </View>
          <View style={styles.waterButtonsRow}>
            <TouchableOpacity style={styles.waterBtn} onPress={() => addWater(200)}>
              <Text style={styles.waterBtnText}>{t('add200ml')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.waterBtn, styles.waterBtnAlt]} onPress={() => addWater(500)}>
              <Text style={[styles.waterBtnText, styles.waterBtnTextAlt]}>{t('add500ml')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.customToggle} onPress={() => setShowCustomWater((v) => !v)}>
            <Text style={styles.customToggleText}>{t('customAmountLabel')}</Text>
            <Icon name={showCustomWater ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {showCustomWater && (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder={t('customMlPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={customMlInput}
                onChangeText={setCustomMlInput}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.customAddBtn}
                onPress={() => {
                  const num = parseInt(customMlInput.replace(/\D/g, ''), 10);
                  if (!isNaN(num) && num > 0) {
                    addWater(num);
                    setCustomMlInput('');
                  }
                }}
              >
                <Text style={styles.waterBtnText}>{t('addWaterButton')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {waterHistory.length > 0 && (
            <TouchableOpacity style={styles.undoBtn} onPress={undoWater}>
              <Text style={styles.undoText}>{t('undoWater')}</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Quick Actions */}
        <SectionHeader title={t('quickActions')} />
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickItem}
              onPress={() => handleQuickAction(action)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: theme.mint }]}>
                <Text style={styles.quickEmoji}>{action.emoji}</Text>
              </View>
              <Text style={styles.quickLabel} numberOfLines={2}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommended Products */}
        <SectionHeader
          title={t('recommendedProducts')}
          actionLabel={t('viewAll')}
          onAction={() => rootNav?.navigate('ProductSearchScreen')}
        />
        <FlatList
          data={MOCK_PRODUCTS}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productList}
          snapToInterval={CARD_WIDTH + 12}
          decelerationRate="fast"
        />

        {/* Community Highlights */}
        <SectionHeader
          title={t('communityHighlights')}
          actionLabel={t('viewAll')}
          onAction={() => navigation.navigate('PremiumScreen')}
        />
        {MOCK_COMMUNITY.map((post) => (
          <GlassCard key={post.id} style={styles.communityCard} padding={16}>
            <View style={styles.communityHeader}>
              <View style={[styles.communityAvatar, { backgroundColor: theme.mint }]}>
                <Text style={styles.communityAvatarText}>{post.user.charAt(0)}</Text>
              </View>
              <Text style={styles.communityUser}>{post.user}</Text>
              <View style={styles.likeRow}>
                <Icon name="heart" size={14} color={theme.accentPink} />
                <Text style={styles.likeCount}>{post.likes}</Text>
              </View>
            </View>
            <Text style={styles.communityText}>{post.text}</Text>
          </GlassCard>
        ))}

        {/* Daily Tips */}
        <SectionHeader title={t('dailyTips')} />
        {DAILY_TIPS.map((tipKey, i) => (
          <GlassCard key={tipKey} style={styles.tipCard} padding={16}>
            <View style={styles.tipRow}>
              <View style={[styles.tipIcon, { backgroundColor: theme.mint }]}>
                <Text style={styles.tipEmoji}>{['💧', '☀️', '🌙'][i]}</Text>
              </View>
              <Text style={styles.tipText}>{t(tipKey)}</Text>
            </View>
          </GlassCard>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal visible={showCelebration} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.celebrationCard} padding={28}>
            <Text style={styles.celebrationTitle}>{t('waterCelebrationTitle')}</Text>
            <Text style={styles.celebrationMsg}>{t('waterCelebrationMessage')}</Text>
            <TouchableOpacity style={styles.celebrationBtn} onPress={() => setShowCelebration(false)}>
              <Text style={styles.celebrationBtnText}>{t('ok')}</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

function createHomeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: theme.spacing.lg },
    welcomeCard: { marginBottom: theme.spacing.md },
    welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    welcomeTextWrap: { flex: 1 },
    welcomeLabel: { fontSize: theme.typography.caption, color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    welcomeName: { fontSize: theme.typography.h2, fontWeight: '800', color: theme.textPrimary, marginTop: 4 },
    avatar: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: theme.mint, overflow: 'hidden',
    },
    avatarImage: { width: 52, height: 52, borderRadius: 26 },
    avatarLetter: { fontSize: 22, fontWeight: '700', color: theme.textOnPrimary },
    scoreRow: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md },
    scoreCard: { flex: 1, alignItems: 'center' },
    scoreLabel: { fontSize: theme.typography.caption, fontWeight: '600', color: theme.textSecondary, marginBottom: 8, textAlign: 'center' },
    waterInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    waterProgress: { fontSize: theme.typography.body, fontWeight: '600', color: theme.textPrimary },
    waterPercent: { fontSize: theme.typography.caption, fontWeight: '700', color: theme.primary },
    progressBg: { height: 10, borderRadius: 5, backgroundColor: theme.iconBg, overflow: 'hidden', marginBottom: 12 },
    progressFill: { height: '100%', borderRadius: 5, backgroundColor: theme.waterBlue },
    waterButtonsRow: { flexDirection: 'row', gap: 10 },
    waterBtn: { flex: 1, paddingVertical: 12, borderRadius: theme.borderRadiusSmall, backgroundColor: theme.primary, alignItems: 'center' },
    waterBtnAlt: { backgroundColor: theme.mint },
    waterBtnText: { fontSize: theme.typography.caption, fontWeight: '700', color: theme.textOnPrimary },
    waterBtnTextAlt: { color: theme.primary },
    customToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingVertical: 8 },
    customToggleText: { fontSize: theme.typography.caption, color: theme.textSecondary },
    customRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    customInput: {
      flex: 1, borderRadius: theme.borderRadiusSmall, paddingHorizontal: 14, paddingVertical: 10,
      backgroundColor: theme.iconBg, color: theme.textPrimary, borderWidth: 1, borderColor: theme.glassBorder,
    },
    customAddBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadiusSmall, backgroundColor: theme.primary, justifyContent: 'center' },
    undoBtn: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 12 },
    undoText: { fontSize: theme.typography.caption, fontWeight: '600', color: theme.primary },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: theme.spacing.md },
    quickItem: {
      width: (SCREEN_WIDTH - theme.spacing.lg * 2 - 20) / 3,
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 4,
      backgroundColor: theme.cardBg,
      borderRadius: theme.borderRadiusLarge,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.6,
      shadowRadius: 6,
      elevation: 2,
    },
    quickIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    quickEmoji: { fontSize: 26, lineHeight: 30 },
    quickLabel: { fontSize: 11, fontWeight: '600', color: theme.textPrimary, textAlign: 'center', paddingHorizontal: 4 },
    emptyText: { fontSize: theme.typography.body, color: theme.textSecondary, textAlign: 'center', paddingVertical: 12 },
    productList: { paddingRight: theme.spacing.lg, gap: 12, marginBottom: theme.spacing.md },
    productCard: { width: CARD_WIDTH, marginRight: 12 },
    productImage: { width: '100%', height: 100, borderRadius: theme.borderRadius, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    productEmoji: { fontSize: 40 },
    productName: { fontSize: theme.typography.body, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 },
    productMeta: { marginBottom: 6 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '600', color: theme.primary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: theme.typography.caption, fontWeight: '700', color: theme.textPrimary },
    reviewCount: { fontSize: theme.typography.small, color: theme.textSecondary },
    communityCard: { marginBottom: 10 },
    communityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    communityAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    communityAvatarText: { fontSize: 14, fontWeight: '700', color: theme.primary },
    communityUser: { flex: 1, fontSize: theme.typography.caption, fontWeight: '700', color: theme.textPrimary },
    likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    likeCount: { fontSize: theme.typography.small, color: theme.textSecondary },
    communityText: { fontSize: theme.typography.body, color: theme.textSecondary, lineHeight: 22 },
    tipCard: { marginBottom: 10 },
    tipRow: { flexDirection: 'row', alignItems: 'center' },
    tipIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    tipEmoji: { fontSize: 20 },
    tipText: { flex: 1, fontSize: theme.typography.caption, color: theme.textSecondary, lineHeight: 20 },
    bottomSpacing: { height: 16 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' },
    celebrationCard: { alignItems: 'center', maxWidth: 320, width: '100%' },
    celebrationTitle: { fontSize: theme.typography.h2, fontWeight: '800', color: theme.primary, marginBottom: 8 },
    celebrationMsg: { fontSize: theme.typography.body, color: theme.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
    celebrationBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: theme.borderRadiusLarge, backgroundColor: theme.primary },
    celebrationBtnText: { fontSize: theme.typography.body, fontWeight: '700', color: theme.textOnPrimary },
  });
}
