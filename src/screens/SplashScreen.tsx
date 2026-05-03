import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SplashScreen'>;

export default function SplashScreen({ navigation }: Props) {
  const [isVideoReady, setIsVideoReady] = useState(false);

  const goToMain = () => {
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/videos/splash_video.mp4.mp4')}
        style={[styles.video, !isVideoReady && styles.hiddenVideo]}
        resizeMode="contain"
        controls={false}
        paused={false}
        repeat={false}
        onLoad={() => setIsVideoReady(true)}
        onEnd={goToMain}
        onError={goToMain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  hiddenVideo: {
    opacity: 0,
  },
});

