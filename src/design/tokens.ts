import { Platform } from 'react-native';

export const color = {
  canvas: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEEAE2',
  ink: '#172033',
  inkMuted: '#667085',
  borderSubtle: '#E5E1D8',
  primary: '#FF6846',
  primaryPressed: '#EA5534',
  primarySoft: '#FFE5DC',
  secondary: '#A8E6D2',
  secondarySoft: '#E7F8F2',
  leagueDark: '#233A5A',
  success: '#218567',
  warning: '#D9822B',
  danger: '#C8443A',
  focus: '#98DDDE',
  heritageNavy: '#2E5283',
  heritageOrange: '#E2552D',
  white: '#FFFFFF',
  scrim: 'rgba(23,32,51,0.42)',
} as const;

export const space = { x1: 4, x2: 8, x3: 12, x4: 16, x5: 20, x6: 24, x8: 32, x10: 40 } as const;
export const radius = { control: 8, input: 12, card: 16, league: 20, round: 999 } as const;
export const type = {
  display: { fontSize: 32, lineHeight: 39, fontWeight: '800' as const, letterSpacing: -1 },
  title: { fontSize: 24, lineHeight: 31, fontWeight: '800' as const, letterSpacing: -0.6 },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 23, fontWeight: '400' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' as const },
} as const;

export const elevation = Platform.select({
  ios: { shadowColor: color.ink, shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } },
  android: { elevation: 5 },
  default: { boxShadow: '0 8px 24px rgba(23,32,51,0.12)' },
});

export const layout = { mobileGutter: 20, smallGutter: 16, tabletMax: 680, desktopMax: 1040 } as const;
