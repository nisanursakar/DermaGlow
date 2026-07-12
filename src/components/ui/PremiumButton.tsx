import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

type PremiumButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

export default function PremiumButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}: PremiumButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
    ghost: styles.ghost,
  }[variant];

  const textStyle = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    outline: styles.outlineText,
    ghost: styles.ghostText,
  }[variant];

  const iconColor = variant === 'primary' ? theme.textOnPrimary : theme.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        fullWidth && styles.fullWidth,
        (pressed || disabled) && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {icon ? <Icon name={icon as any} size={20} color={iconColor} /> : null}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: theme.borderRadiusLarge,
      gap: 10,
      minHeight: 54,
    },
    fullWidth: { width: '100%' },
    pressed: { opacity: 0.82 },
    primary: {
      backgroundColor: theme.primary,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 6,
    },
    secondary: {
      backgroundColor: theme.mint,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    primaryText: {
      fontSize: theme.typography.body,
      fontWeight: '700',
      color: theme.textOnPrimary,
    },
    secondaryText: {
      fontSize: theme.typography.body,
      fontWeight: '700',
      color: theme.primary,
    },
    outlineText: {
      fontSize: theme.typography.body,
      fontWeight: '700',
      color: theme.primary,
    },
    ghostText: {
      fontSize: theme.typography.caption,
      fontWeight: '600',
      color: theme.primary,
    },
  });
}
