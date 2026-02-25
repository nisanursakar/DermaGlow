/**
 * DermaGlow Camera / App theme – soft lavender, pastel purple
 */
export const lightTheme = {
  background: '#F8F4FF',
  headerBg: '#EFE8F6',
  cardBg: '#FFFFFF',
  primary: '#4B3B70',
  primaryLight: '#7A66B8',
  secondary: '#887DA2',
  lightPurple: '#DDC9F3',
  iconBg: '#F5E6FA',
  textPrimary: '#4B3B70',
  textSecondary: '#8B7FA8',
  shadow: 'rgba(0,0,0,0.08)',
  shadowStrong: 'rgba(0,0,0,0.12)',
  success: '#4CD964',
  borderRadius: 20,
  borderRadiusLarge: 24,
  // HomeScreen / extra
  waterBlue: '#A8D5E2',
  progressGreen: '#B8E6B8',
  flameOrange: '#FFB88C',
  accentPink: '#E8A5B8',
};

export const darkTheme = {
  background: '#1A1625',
  headerBg: '#2D2640',
  cardBg: '#252036',
  primary: '#B8A9E0',
  primaryLight: '#9B88C9',
  secondary: '#8B7FA8',
  lightPurple: '#4B3B70',
  iconBg: '#3D3552',
  textPrimary: '#F0EBF7',
  textSecondary: '#A89FBD',
  shadow: 'rgba(0,0,0,0.3)',
  shadowStrong: 'rgba(0,0,0,0.4)',
  success: '#4CD964',
  borderRadius: 20,
  borderRadiusLarge: 24,
  waterBlue: '#3D5A6C',
  progressGreen: '#2D5A3D',
  flameOrange: '#8B5A3C',
  accentPink: '#7A5A6E',
};

/** @deprecated Use lightTheme or ThemeContext for dark. Kept for backward compatibility. */
export const theme = lightTheme;

export type CameraMode = 'skin' | 'scalp';
