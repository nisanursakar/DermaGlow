import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  noShadow?: boolean;
};

export default function GlassCard({ children, style, padding = 20, noShadow = false }: GlassCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, padding, noShadow), [theme, padding, noShadow]);

  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], padding: number, noShadow: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: theme.borderRadiusLarge,
      padding,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      ...(noShadow
        ? {}
        : {
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 16,
            elevation: 4,
          }),
    },
  });
}
