import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const FILTER_KEYS = [
  'filterCleanser',
  'filterToner',
  'filterSerum',
  'filterMoisturizer',
  'filterSunscreen',
  'filterExfoliant',
  'filterMask',
  'filterEyeCare',
  'filterLipCare',
  'filterAcne',
  'filterHairMask',
  'filterOther',
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

export default function ProductSearchScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(1)).current;

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

  const handleBarcodeScan = useCallback(async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionMessage'));
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel || !response.assets || !response.assets[0]) {
          return;
        }
        const asset = response.assets[0];
        const code = asset.fileName || asset.uri || '';
        setScannedCode(code);
        // TODO: Gerçek barkod okuma entegrasyonu ile code değeri barkoddan okunacak
      }
    );
  }, [requestCameraPermission, t]);

  const handleProductPhoto = useCallback(async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionMessage'));
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
      },
      () => {
        // TODO: Çekilen ürün fotoğrafını kaydetme / işleme entegrasyonu eklenecek
      }
    );
  }, [requestCameraPermission, t]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showFilters ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [showFilters, slideAnim]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.background,
        },
        container: {
          flex: 1,
          backgroundColor: theme.background,
        },
        topBar: {
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 12,
          backgroundColor: theme.headerBg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        searchContainer: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 999,
          backgroundColor: theme.iconBg,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        searchInput: {
          flex: 1,
          marginLeft: 6,
          fontSize: 15,
          color: theme.textPrimary,
        },
        topBarIconButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.cardBg,
          shadowColor: theme.shadow as string,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.12,
          shadowRadius: 3,
          elevation: 3,
        },
        barcodeScanIcon: {
          width: 20,
          height: 20,
          position: 'relative',
        },
        barcodeCorner: {
          position: 'absolute',
          width: 8,
          height: 8,
          borderColor: theme.primary,
          borderWidth: 2,
          borderRadius: 3,
        },
        barcodeCornerTopLeft: {
          top: 0,
          left: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
        },
        barcodeCornerTopRight: {
          top: 0,
          right: 0,
          borderLeftWidth: 0,
          borderBottomWidth: 0,
        },
        barcodeCornerBottomLeft: {
          bottom: 0,
          left: 0,
          borderRightWidth: 0,
          borderTopWidth: 0,
        },
        barcodeCornerBottomRight: {
          bottom: 0,
          right: 0,
          borderLeftWidth: 0,
          borderTopWidth: 0,
        },
        barcodeCenterLines: {
          position: 'absolute',
          left: 5,
          right: 5,
          top: 3,
          bottom: 3,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        },
        barcodeLine: {
          width: 2,
          borderRadius: 1,
          backgroundColor: theme.primary,
        },
        barcodeLineTall: {
          height: 12,
        },
        barcodeLineMedium: {
          height: 9,
        },
        barcodeLineShort: {
          height: 6,
        },
        content: {
          flex: 1,
        },
        contentInner: {
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 32,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.textPrimary,
          marginBottom: 12,
        },
        filtersWrap: {
          flexDirection: 'column',
          flexWrap: 'nowrap',
          gap: 10,
        },
        filterChip: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.lightPurple,
        },
        filterChipActive: {
          backgroundColor: theme.primary,
          borderColor: theme.primary,
        },
        filterChipText: {
          fontSize: 13,
          color: theme.textPrimary,
          marginLeft: 6,
        },
        filterChipTextActive: {
          color: '#FFFFFF',
        },
        emptyState: {
          marginTop: 24,
          padding: 16,
          borderRadius: 16,
          backgroundColor: theme.cardBg,
          shadowColor: theme.shadowStrong,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 3,
        },
        emptyStateTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.textPrimary,
          marginBottom: 6,
        },
        emptyStateText: {
          fontSize: 13,
          color: theme.textSecondary,
          lineHeight: 20,
        },
        scannedCodeContainer: {
          marginBottom: 16,
        },
        scannedCodeLabel: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: 6,
        },
        scannedCodeInput: {
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 13,
          backgroundColor: theme.iconBg,
          color: theme.textPrimary,
          borderWidth: 1,
          borderColor: theme.textSecondary + '40',
        },
        filterSheetOverlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'flex-start',
          alignItems: 'flex-end',
        },
        filterSheetBackdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: theme.background + '88',
        },
        filterSheet: {
          width: '78%',
          maxWidth: 340,
          height: '100%',
          backgroundColor: theme.cardBg,
          paddingTop: 24,
          paddingHorizontal: 20,
          paddingBottom: 32,
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
          shadowColor: theme.shadowStrong,
          shadowOffset: { width: -2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 12,
        },
        filterSheetHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        filterSheetTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.textPrimary,
        },
        filterSheetClose: {
          padding: 4,
        },
      }),
    [theme]
  );

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchProductPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={query}
              onChangeText={setQuery}
              selectionColor={theme.primary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.topBarIconButton}
            activeOpacity={0.8}
            onPress={handleBarcodeScan}
            accessibilityLabel={t('scanBarcodeButton')}
            accessibilityHint={t('scanBarcodeTooltip')}
          >
            <View style={styles.barcodeScanIcon}>
              <View style={[styles.barcodeCorner, styles.barcodeCornerTopLeft]} />
              <View style={[styles.barcodeCorner, styles.barcodeCornerTopRight]} />
              <View style={[styles.barcodeCorner, styles.barcodeCornerBottomLeft]} />
              <View style={[styles.barcodeCorner, styles.barcodeCornerBottomRight]} />
              <View style={styles.barcodeCenterLines}>
                <View style={[styles.barcodeLine, styles.barcodeLineTall]} />
                <View style={[styles.barcodeLine, styles.barcodeLineMedium]} />
                <View style={[styles.barcodeLine, styles.barcodeLineTall]} />
                <View style={[styles.barcodeLine, styles.barcodeLineShort]} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topBarIconButton}
            activeOpacity={0.8}
            onPress={handleProductPhoto}
          >
            <Icon name="camera" size={18} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topBarIconButton}
            activeOpacity={0.8}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="sliders" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          {scannedCode && (
            <View style={styles.scannedCodeContainer}>
              <Text style={styles.scannedCodeLabel}>{t('scannedCodeLabel')}</Text>
              <TextInput
                style={styles.scannedCodeInput}
                value={scannedCode}
                editable={false}
                selectTextOnFocus
              />
            </View>
          )}

          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>{t('productFind')}</Text>
            <Text style={styles.emptyStateText}>
              {t('productSearchInfo') ?? ''}
            </Text>
          </View>
        </ScrollView>

        {showFilters && (
          <View style={styles.filterSheetOverlay}>
            <TouchableOpacity
              style={styles.filterSheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowFilters(false)}
            />
            <Animated.View
              style={[
                styles.filterSheet,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 400],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.filterSheetHeader}>
                <Text style={styles.filterSheetTitle}>{t('filtersTitle')}</Text>
                <TouchableOpacity
                  style={styles.filterSheetClose}
                  onPress={() => setShowFilters(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="x" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.filtersWrap}>
                  {FILTER_KEYS.map((key) => {
                    const active = activeFilters.includes(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        activeOpacity={0.8}
                        onPress={() => toggleFilter(key)}
                      >
                        <Icon
                          name={active ? 'check' : 'circle'}
                          size={14}
                          color={active ? '#FFFFFF' : theme.primary}
                        />
                        <Text
                          style={[
                            styles.filterChipText,
                            active && styles.filterChipTextActive,
                          ]}
                        >
                          {t(key)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

