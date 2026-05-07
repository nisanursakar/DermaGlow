import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
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
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isHidden, setIsHidden] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    const syncVisibility = () => {
      const routeName = navigation.getCurrentRoute()?.name;
      const hiddenRoutes = ['ChatDetailScreen', 'LoginScreen', 'SplashScreen'];
      setIsHidden(!!routeName && hiddenRoutes.includes(routeName));
    };

    const checkInitialRoute = setTimeout(syncVisibility, 100);
    const unsubscribe = navigation.addListener('state', syncVisibility);

    return () => {
      clearTimeout(checkInitialRoute);
      unsubscribe();
    };
  }, [navigation]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();

        // @ts-ignore React Native Animated private value access
        let finalX = pan.x._value;
        // @ts-ignore React Native Animated private value access
        let finalY = pan.y._value;

        const minX = -SCREEN_WIDTH + FAB_SIZE + INITIAL_RIGHT + 20;
        const maxX = 0;
        const minY = -SCREEN_HEIGHT + FAB_SIZE + INITIAL_BOTTOM + 100;
        const maxY = 0;

        let isOutOfBounds = false;

        if (finalX < minX) {
          finalX = minX;
          isOutOfBounds = true;
        }
        if (finalX > maxX) {
          finalX = maxX;
          isOutOfBounds = true;
        }
        if (finalY < minY) {
          finalY = minY;
          isOutOfBounds = true;
        }
        if (finalY > maxY) {
          finalY = maxY;
          isOutOfBounds = true;
        }

        if (isOutOfBounds) {
          Animated.spring(pan, {
            toValue: { x: finalX, y: finalY },
            useNativeDriver: false,
            friction: 6,
            tension: 40,
          }).start();
        }
      },
    })
  ).current;

  const botName =
    t('aiAssistantName') === 'aiAssistantName' ? 'DermaGlow Asistan' : t('aiAssistantName');

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
            backgroundColor: '#FFFFFF',
            borderColor: isDark ? theme.secondary : theme.primary,
          },
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
        <Image source={require('../assets/images/logo.png')} style={styles.logoIcon} resizeMode="contain" />
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  logoIcon: {
    width: 42,
    height: 42,
  },
});
