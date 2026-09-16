import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { color } from '../design/tokens';

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
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
