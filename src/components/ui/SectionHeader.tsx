import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={styles.action} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Icon name="chevron-right" size={16} color={theme.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.h3,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    actionText: {
      fontSize: theme.typography.caption,
      fontWeight: '600',
      color: theme.primary,
    },
  });
}
