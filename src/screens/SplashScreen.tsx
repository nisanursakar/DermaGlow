import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import Video from 'react-native-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SplashScreen'>;

export default function SplashScreen({ navigation }: Props) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hasNavigated = useRef(false);

  const goToWelcome = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigation.replace('WelcomeScreen');
  };

  useEffect(() => {
    const fallbackTimer = setTimeout(goToWelcome, 9000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  return (
    <View style={styles.container}>
      {/* StatusBar'ı gizlemek veya video arkasında şeffaf yapmak tam ekran hissini artırır */}
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <Video
        source={require('../../assets/videos/intro_video.mp4')}
        style={[styles.video, !isVideoReady && styles.hiddenVideo]}
        // ÇÖZÜM: 'cover' videoyu ekrana yayar, boşluk bırakmaz.
        resizeMode="cover"
        controls={false}
        paused={false}
        repeat={false}
        onLoad={() => setIsVideoReady(true)}
        onEnd={goToWelcome}
        onError={goToWelcome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  video: {
    // ÇÖZÜM: absoluteFillObject ile farklı cihazlarda ekranı tam kaplar.
    ...StyleSheet.absoluteFillObject,
  },
  hiddenVideo: {
    opacity: 0,
  },
});

