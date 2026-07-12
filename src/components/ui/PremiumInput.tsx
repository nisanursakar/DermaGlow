import React, { useMemo, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';

type PremiumInputProps = TextInputProps & {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
};

const PremiumInput = forwardRef<TextInput, PremiumInputProps>(
  ({ label, error, secureToggle, showSecure, onToggleSecure, style, ...props }, ref) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
      <View style={styles.wrap}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={[styles.inputWrap, error ? styles.inputError : null]}>
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={secureToggle && !showSecure}
            {...props}
          />
          {secureToggle && onToggleSecure ? (
            <TouchableOpacity onPress={onToggleSecure} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name={showSecure ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  },
);

PremiumInput.displayName = 'PremiumInput';
export default PremiumInput;

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: { marginBottom: theme.spacing.md },
    label: {
      fontSize: theme.typography.caption,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: theme.spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.iconBg,
      borderRadius: theme.borderRadius,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      paddingHorizontal: theme.spacing.md,
    },
    inputError: { borderColor: theme.error },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: theme.typography.body,
      color: theme.textPrimary,
    },
    errorText: {
      fontSize: theme.typography.small,
      color: theme.error,
      marginTop: theme.spacing.xs,
    },
  });
}
