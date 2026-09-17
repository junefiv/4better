import { configureFonts, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { color, fontFamily, typography } from '../design/tokens';

type TextStyle = (typeof typography)[keyof typeof typography];

function paperFont(style: TextStyle) {
  return {
    ...style,
    letterSpacing: 'letterSpacing' in style ? style.letterSpacing : 0,
    fontWeight: '400' as const,
  };
}

const fonts = configureFonts({
  config: {
    displayLarge: paperFont(typography.screenTitle),
    displayMedium: paperFont(typography.sectionTitle),
    displaySmall: paperFont(typography.cardTitle),
    headlineLarge: paperFont(typography.sectionTitle),
    headlineMedium: paperFont(typography.cardTitle),
    headlineSmall: paperFont(typography.statMD),
    titleLarge: paperFont(typography.cardTitle),
    titleMedium: paperFont(typography.statMD),
    titleSmall: paperFont(typography.label),
    bodyLarge: paperFont(typography.body),
    bodyMedium: paperFont(typography.bodyMedium),
    bodySmall: paperFont(typography.bodySmall),
    labelLarge: paperFont(typography.button),
    labelMedium: paperFont(typography.label),
    labelSmall: paperFont(typography.caption),
    default: paperFont(typography.body),
  },
});

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: color.orange,
    onPrimary: color.white,
    primaryContainer: color.orangeSoft,
    onPrimaryContainer: color.ink,
    secondary: color.aqua,
    onSecondary: color.ink,
    secondaryContainer: color.aquaSoft,
    onSecondaryContainer: color.ink,
    error: color.danger,
    onError: color.white,
    background: color.canvas,
    onBackground: color.ink,
    surface: color.surface,
    onSurface: color.ink,
    onSurfaceVariant: color.inkMuted,
    outline: color.borderSubtle,
    outlineVariant: color.borderSubtle,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: color.canvas,
      level1: color.surface,
      level2: color.surface,
    },
  },
};
