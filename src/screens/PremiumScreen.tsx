import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { supabase } from '../../supabase';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { GlassCard, PremiumButton, SectionHeader } from '../components/ui';

const PREMIUM_FEATURES = [
  { icon: 'zap', key: 'premiumFeature1' },
  { icon: 'bar-chart-2', key: 'premiumFeature2' },
  { icon: 'cpu', key: 'premiumFeature3' },
  { icon: 'gift', key: 'premiumFeature4' },
  { icon: 'headphones', key: 'premiumFeature5' },
  { icon: 'shield', key: 'premiumFeature6' },
] as const;

const PLANS = [
  { id: 'monthly', key: 'premiumPlanMonthly', priceKey: 'premiumPriceMonthly', popular: false },
  { id: 'yearly', key: 'premiumPlanYearly', priceKey: 'premiumPriceYearly', popular: true },
] as const;

export default function PremiumScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  // Dinamik Kullanıcı ID'si
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  const handleUpgrade = async () => {
    if (!currentUserId) {
      Alert.alert('Bilgi', 'Kullanıcı bilgisi yükleniyor, lütfen bekleyin...');
      return;
    }

    try {
      // 192.168.1.X kısmını bilgisayarının güncel yerel IP adresiyle değiştirmeyi unutma!
      const response = await fetch('http://192.168.1.41:8000/api/upgrade-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `user_id=${currentUserId}`
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Tebrikler!', 'Sınırsız analiz ve barkod tarama özellikleri açıldı.');
      } else {
        Alert.alert('Hata', 'Bir hata oluştu: ' + (data.detail || 'Bilinmeyen Hata'));
      }
    } catch (error) {
      console.error('Bağlantı hatası:', error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. IP adresini ve Uvicorn sunucusunu kontrol et!');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <View style={styles.heroBadge}>
            <Icon name="award" size={14} color={theme.accent} />
            <Text style={styles.heroBadgeText}>{t('premiumBadge')}</Text>
          </View>
          <Text style={styles.heroTitle}>{t('premiumTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('premiumSubtitle')}</Text>
          <View style={styles.heroIconWrap}>
            <Icon name="star" size={48} color={theme.accent} />
          </View>
        </View>

        {/* Current plan */}
        <GlassCard style={styles.currentPlanCard} padding={18}>
          <View style={styles.currentPlanRow}>
            <View>
              <Text style={styles.currentPlanLabel}>{t('currentPlan')}</Text>
              <Text style={styles.currentPlanName}>{t('freePlan')}</Text>
            </View>
            <View style={[styles.freePill, { backgroundColor: theme.mint }]}>
              <Text style={styles.freePillText}>{t('active')}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Features */}
        <View style={styles.contentSection}>
          <SectionHeader title={t('premiumFeaturesTitle')} />
          <GlassCard padding={16}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View
                key={feature.key}
                style={[
                  styles.featureRow,
                  index < PREMIUM_FEATURES.length - 1 && styles.featureRowBorder,
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: theme.mint }]}>
                  <Icon name={feature.icon as any} size={20} color={theme.primary} />
                </View>
                <Text style={styles.featureText}>{t(feature.key)}</Text>
                <Icon name="check-circle" size={18} color={theme.success} />
              </View>
            ))}
          </GlassCard>

          {/* Plans */}
          <SectionHeader title={t('premiumPlansTitle')} />
          {PLANS.map((plan) => (
            <TouchableOpacity key={plan.id} activeOpacity={0.85} style={styles.planCardWrap}>
              <GlassCard
                style={plan.popular ? styles.planCardPopular : undefined}
                padding={20}
              >
                {plan.popular ? (
                  <View style={[styles.popularBadge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.popularBadgeText}>{t('mostPopular')}</Text>
                  </View>
                ) : null}
                <Text style={styles.planName}>{t(plan.key)}</Text>
                <Text style={styles.planPrice}>{t(plan.priceKey)}</Text>
                {plan.id === 'yearly' ? (
                  <Text style={styles.planSaving}>{t('premiumYearlySaving')}</Text>
                ) : null}
              </GlassCard>
            </TouchableOpacity>
          ))}

          <PremiumButton
            label={t('upgradeNow')}
            icon="arrow-up-circle"
            onPress={handleUpgrade}
            style={styles.upgradeBtn}
          />

          <Text style={styles.disclaimer}>{t('premiumDisclaimer')}</Text>
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  insets: { top: number; bottom: number },
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: {
      paddingBottom: Math.max(insets.bottom, 24) + 80,
    },
    hero: {
      paddingTop: Math.max(insets.top, 20) + 16,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: 32,
      borderBottomLeftRadius: theme.borderRadiusLarge,
      borderBottomRightRadius: theme.borderRadiusLarge,
      overflow: 'hidden',
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 12,
    },
    heroBadgeText: {
      fontSize: theme.typography.caption,
      fontWeight: '700',
      color: theme.textOnPrimary,
    },
    heroTitle: {
      fontSize: theme.typography.h1,
      fontWeight: '800',
      color: theme.textOnPrimary,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: theme.typography.body,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 24,
      maxWidth: 300,
    },
    heroIconWrap: {
      position: 'absolute',
      right: 24,
      top: Math.max(insets.top, 20) + 24,
      opacity: 0.35,
    },
    currentPlanCard: {
      marginHorizontal: theme.spacing.lg,
      marginTop: -20,
      marginBottom: theme.spacing.md,
    },
    contentSection: {
      paddingHorizontal: theme.spacing.lg,
    },
    currentPlanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    currentPlanLabel: {
      fontSize: theme.typography.caption,
      color: theme.textSecondary,
      fontWeight: '600',
      marginBottom: 4,
    },
    currentPlanName: {
      fontSize: theme.typography.h3,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    freePill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    freePillText: {
      fontSize: theme.typography.caption,
      fontWeight: '700',
      color: theme.primary,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 12,
    },
    featureRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.glassBorder,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: {
      flex: 1,
      fontSize: theme.typography.body,
      color: theme.textPrimary,
      fontWeight: '500',
      lineHeight: 22,
    },
    planCardWrap: { marginBottom: theme.spacing.md },
    planCardPopular: {
      borderWidth: 2,
      borderColor: theme.accent,
    },
    popularBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 10,
    },
    popularBadgeText: {
      fontSize: theme.typography.small,
      fontWeight: '800',
      color: theme.charcoal,
    },
    planName: {
      fontSize: theme.typography.h3,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    planPrice: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.primary,
    },
    planSaving: {
      fontSize: theme.typography.caption,
      color: theme.success,
      fontWeight: '600',
      marginTop: 6,
    },
    upgradeBtn: {
      marginTop: theme.spacing.sm,
    },
    disclaimer: {
      fontSize: theme.typography.small,
      color: theme.textSecondary,
      textAlign: 'center',
      marginHorizontal: theme.spacing.xl,
      marginTop: theme.spacing.md,
      lineHeight: 18,
    },
    bottomSpacing: { height: 24 },
  });
}