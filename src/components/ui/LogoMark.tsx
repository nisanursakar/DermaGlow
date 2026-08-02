import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const LOGO_SOURCE = require('../../assets/images/logo-circle.png');

type LogoMarkProps = {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
};

export default function LogoMark({ size = 'md', showText = true }: LogoMarkProps) {
  const { theme } = useTheme();
  const dim = { sm: 80, md: 120, lg: 156 }[size];
  const styles = useMemo(() => createStyles(theme, dim, showText), [theme, dim, showText]);

  return (
    <View style={styles.wrap}>
      <Image
        source={LOGO_SOURCE}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="DermaGlow"
      />
      {showText ? <Text style={styles.brand}>DermaGlow</Text> : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], dim: number, showText: boolean) {
  const radius = dim / 2;

  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
    },
    logo: {
      width: dim,
      height: dim,
      borderRadius: radius,
      marginBottom: showText ? 14 : 0,
      borderWidth: 2,
      borderColor: theme.primary + '18',
      backgroundColor: theme.cream,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
    },
    brand: {
      fontSize: Math.min(dim * 0.2, 26),
      fontWeight: '800',
      color: theme.primary,
      letterSpacing: 0.6,
    },
  });
}
