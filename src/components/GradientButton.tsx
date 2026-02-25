import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';

const theme = {
  primary: '#4B3B70',
  primaryLight: '#7A66B8',
  lightPurple: '#DDC9F3',
  shadow: 'rgba(0,0,0,0.12)',
};

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function GradientButton({
  title,
  onPress,
  disabled = false,
  icon,
  style,
  textStyle,
}: GradientButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
        ]}
      >
        {icon ? <>{icon}</> : null}
        <Text
          style={[
            styles.text,
            disabled && styles.textDisabled,
            icon && styles.textWithIcon,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: theme.primary,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: theme.lightPurple,
    opacity: 0.8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textWithIcon: {
    marginLeft: 10,
  },
  textDisabled: {
    color: '#FFFFFF',
  },
});
