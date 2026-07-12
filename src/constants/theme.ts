/**
 * DermaGlow Premium Theme – Deep Teal, Mint, Cream, Warm Gold
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  caption: 13,
  small: 11,
} as const;

export const lightTheme = {
  // Brand palette
  primary: '#0F766E',
  primaryLight: '#14B8A6',
  secondary: '#6B7280',
  accent: '#EAB308',
  mint: '#D1FAE5',
  cream: '#FFFDF7',
  charcoal: '#1F2937',

  // Surfaces
  background: '#FFFDF7',
  headerBg: '#ECFDF5',
  cardBg: '#FFFFFF',
  glassBg: 'rgba(255, 253, 247, 0.85)',
  glassBorder: 'rgba(15, 118, 110, 0.12)',
  iconBg: '#D1FAE5',
  lightPurple: '#D1FAE5',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',

  // Effects
  shadow: 'rgba(15, 118, 110, 0.08)',
  shadowStrong: 'rgba(15, 118, 110, 0.16)',
  gradientStart: '#0F766E',
  gradientEnd: '#14B8A6',
  gradientAccent: '#EAB308',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  waterBlue: '#5EEAD4',
  progressGreen: '#34D399',
  flameOrange: '#FBBF24',
  accentPink: '#F9A8D4',

  border: 'rgba(15, 118, 110, 0.15)',
  cardBackground: '#FFFFFF',
  borderRadius: 20,
  borderRadiusLarge: 24,
  borderRadiusSmall: 12,
  spacing,
  typography,
};

export const darkTheme = {
  primary: '#2DD4BF',
  primaryLight: '#5EEAD4',
  secondary: '#9CA3AF',
  accent: '#FACC15',
  mint: '#134E4A',
  cream: '#0F172A',
  charcoal: '#F9FAFB',

  background: '#0F172A',
  headerBg: '#1E293B',
  cardBg: '#1E293B',
  glassBg: 'rgba(30, 41, 59, 0.88)',
  glassBorder: 'rgba(45, 212, 191, 0.15)',
  iconBg: '#134E4A',
  lightPurple: '#134E4A',

  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textOnPrimary: '#0F172A',

  shadow: 'rgba(0, 0, 0, 0.35)',
  shadowStrong: 'rgba(0, 0, 0, 0.5)',
  gradientStart: '#134E4A',
  gradientEnd: '#0F766E',
  gradientAccent: '#CA8A04',

  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  waterBlue: '#2DD4BF',
  progressGreen: '#10B981',
  flameOrange: '#F59E0B',
  accentPink: '#F472B6',

  border: 'rgba(45, 212, 191, 0.2)',
  cardBackground: '#1E293B',

  borderRadius: 20,
  borderRadiusLarge: 24,
  borderRadiusSmall: 12,

  spacing,
  typography,
};

/** @deprecated Use lightTheme or ThemeContext for dark. */
export const theme = lightTheme;

export type AppTheme = typeof lightTheme;
export type CameraMode = 'skin' | 'scalp';
