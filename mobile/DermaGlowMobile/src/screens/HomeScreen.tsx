import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// Theme colors - soft pastel purple and pink palette
const theme = {
  background: '#F8F4FF', // Soft lavender background
  cardBackground: '#FFFFFF',
  primaryPurple: '#B8A4D9', // Soft purple
  primaryPink: '#F5C2D1', // Soft pink
  accentPurple: '#9B7FC7', // Deeper purple for accents
  accentPink: '#E8A5B8', // Deeper pink for accents
  textPrimary: '#4A4A4A',
  textSecondary: '#8B8B8B',
  textLight: '#B0B0B0',
  shadow: '#E0D5F0',
  waterBlue: '#A8D5E2',
  progressGreen: '#B8E6B8',
  flameOrange: '#FFB88C',
};

export default function HomeScreen() {
  // Water progress calculation (65% of 2000ml = 1300ml)
  const waterProgress = 0.65;
  const waterTarget = 2000;
  const waterCurrent = Math.round(waterTarget * waterProgress);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingText}>Merhaba 👋</Text>
            <Text style={styles.welcomeText}>Hoş geldin, Nisa</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>N</Text>
          </View>
        </View>

        {/* Daily Goals Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Günlük Hedefler</Text>
          <View style={styles.waterTrackingContainer}>
            <View style={styles.waterInfoRow}>
              <Text style={styles.waterTargetText}>{waterTarget}ml hedef</Text>
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
                      index < Math.round(waterProgress * 5) &&
                        styles.flameIconActive,
                    ]}
                  >
                    <Text style={styles.flameIconText}>🔥</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Product Search Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ürün Bul</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün ara..."
            placeholderTextColor={theme.textLight}
          />
          <Text style={styles.searchSubtitle}>
            Cilt tipine uygun ürünleri keşfet
          </Text>
        </View>

        {/* Skin Health Info Section */}
        <Text style={styles.sectionTitle}>Cilt Sağlığı Bilgileri</Text>
      
        {/* Info Card 1: Dry Skin Reason */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Text style={styles.infoIcon}>💧</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Kuru Cilt Nedenleri</Text>
            <Text style={styles.infoSubtitle}>
              Yetersiz su tüketimi ve nem eksikliği cildinizi kurutabilir
            </Text>
          </View>
        </View>

        {/* Info Card 2: Water Consumption Effect */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Text style={styles.infoIcon}>🌊</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Su Tüketiminin Etkisi</Text>
            <Text style={styles.infoSubtitle}>
              Düzenli su içmek cildinizin nem dengesini korur ve parlaklık sağlar
            </Text>
          </View>
        </View>

        {/* Info Card 3: Routine Difference */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Text style={styles.infoIcon}>🌅</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Sabah & Akşam Rutini Farkı</Text>
            <Text style={styles.infoSubtitle}>
              Sabah rutini koruma, akşam rutini temizleme ve onarım odaklıdır
            </Text>
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>
            Ana Sayfa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={styles.tabLabel}>Rutin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>📷</Text>
          <Text style={styles.tabLabel}>Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={styles.tabLabel}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>⋯</Text>
          <Text style={styles.tabLabel}>Daha Fazla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  // Greeting Section
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primaryPurple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Card Styles
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  // Water Tracking
  waterTrackingContainer: {
    marginTop: 4,
  },
  waterInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterTargetText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accentPurple,
  },
  waterProgressText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.waterBlue,
    borderRadius: 6,
  },
  flameIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flameIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameIconActive: {
    backgroundColor: theme.flameOrange,
  },
  flameIconText: {
    fontSize: 16,
  },
  // Search Input
  searchInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: 8,
    marginBottom: 16,
  },
  // Info Cards
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primaryPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 6,
  },
  infoSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingVertical: 8,
    paddingBottom: 20,
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: theme.accentPurple,
    fontWeight: '700',
  },
});
