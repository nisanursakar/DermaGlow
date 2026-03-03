import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FAB_SIZE = 60;
const INITIAL_RIGHT = 20;
const INITIAL_BOTTOM = 110;

export default function AIFab() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isHidden, setIsHidden] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;

  // Sayfaya göre gizleme mantığı
    useEffect(() => {
      // 1. Uygulama ilk açıldığında (Login ekranındayken) konumu anında kontrol et
      const checkInitialRoute = setTimeout(() => {
        const routeName = navigation.getCurrentRoute()?.name;
        if (routeName === 'ChatDetailScreen' || routeName === 'LoginScreen') {
          setIsHidden(true);
        }
      }, 100);

      // 2. Daha sonraki sayfa geçişlerinde kontrol etmeye devam et
      const unsubscribe = navigation.addListener('state', () => {
        const routeName = navigation.getCurrentRoute()?.name;
        if (routeName === 'ChatDetailScreen' || routeName === 'LoginScreen') {
          setIsHidden(true);
        } else {
          setIsHidden(false);
        }
      });

      return () => {
        clearTimeout(checkInitialRoute);
        unsubscribe();
      };
    }, [navigation]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        // TİTREMEYİ KÖKTEN ÇÖZEN KISIM: Parmağı koyduğumuz an konumu sabitler
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false } // Sürükleme esnasında kilit yok, pürüzsüz kayar
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();

        // Parmağı bıraktığımızda sınırları kontrol ediyoruz
        // @ts-ignore (Kırmızı çizgi çizebilir, sorun değil, React Native'de çalışır)
        let finalX = pan.x._value;
        // @ts-ignore
        let finalY = pan.y._value;

        // Ekran sınırlarını belirliyoruz (Çentik ve alt menü payları dahil)
        const minX = -SCREEN_WIDTH + FAB_SIZE + INITIAL_RIGHT + 20;
        const maxX = 0;
        const minY = -SCREEN_HEIGHT + FAB_SIZE + INITIAL_BOTTOM + 100;
        const maxY = 0;

        let isOutOfBounds = false;

        if (finalX < minX) { finalX = minX; isOutOfBounds = true; }
        if (finalX > maxX) { finalX = maxX; isOutOfBounds = true; }
        if (finalY < minY) { finalY = minY; isOutOfBounds = true; }
        if (finalY > maxY) { finalY = maxY; isOutOfBounds = true; }

        // Eğer dışarı taşmışsa, ekranın içine zarifçe yaylanarak döner
        if (isOutOfBounds) {
          Animated.spring(pan, {
            toValue: { x: finalX, y: finalY },
            useNativeDriver: false,
            friction: 6,
            tension: 40
          }).start();
        }
      },
    })
  ).current;

  const botName = t('aiAssistantName') === 'aiAssistantName'
    ? 'DermaGlow Asistan'
    : t('aiAssistantName');

  // Gizliyken null dönmüyoruz; Animated node'lar unmount olursa "animated node does not exist" hatası oluşuyor.
  // Bunun yerine opacity: 0 ve pointerEvents: 'none' ile görünmez/tıklanmaz tutuyoruz.
  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        isHidden && { opacity: 0 },
      ]}
      pointerEvents={isHidden ? 'none' : 'auto'}
      {...(isHidden ? {} : panResponder.panHandlers)}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.fab,
          {
            backgroundColor: theme.cardBackground || '#FFFFFF',
            borderColor: theme.primary || '#4B3B70',
          }
        ]}
        onPress={() => {
          if (!isHidden) {
            navigation.navigate('ChatDetailScreen', {
              userId: 'bot_01',
              userName: botName,
            });
          }
        }}
      >
        <Text style={[styles.textIcon, { color: theme.primary || '#4B3B70' }]}>AI</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: INITIAL_BOTTOM,
    right: INITIAL_RIGHT,
    zIndex: 9999,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  textIcon: {
    fontSize: 18,
    fontWeight: '800',
  },
});
