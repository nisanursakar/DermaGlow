import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type GradientBackgroundProps = {
  children: React.ReactNode;
};

const { width, height } = Dimensions.get('window');

export default function GradientBackground({ children }: GradientBackgroundProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />
      <View style={styles.blobAccent} />
      {children}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      overflow: 'hidden',
    },
    blobTop: {
      position: 'absolute',
      top: -height * 0.12,
      right: -width * 0.2,
      width: width * 0.85,
      height: width * 0.85,
      borderRadius: width * 0.425,
      backgroundColor: theme.mint,
      opacity: 0.55,
    },
    blobBottom: {
      position: 'absolute',
      bottom: -height * 0.08,
      left: -width * 0.25,
      width: width * 0.7,
      height: width * 0.7,
      borderRadius: width * 0.35,
      backgroundColor: theme.primary,
      opacity: 0.08,
    },
    blobAccent: {
      position: 'absolute',
      top: height * 0.35,
      left: -width * 0.1,
      width: width * 0.4,
      height: width * 0.4,
      borderRadius: width * 0.2,
      backgroundColor: theme.accent,
      opacity: 0.06,
    },
  });
}
