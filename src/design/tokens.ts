import { Platform } from 'react-native';

export const color = {
  canvas: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEEAE2',
  ink: '#172033',
  inkMuted: '#667085',
  borderSubtle: '#E5E1D8',
  blue: '#015CFC',
  orange: '#FD4D0B',
  lime: '#98E70D',
  aqua: '#06DAE8',
  blueSoft: '#DCE8FF',
  orangeSoft: '#FFE4DA',
  limeSoft: '#EEFBC2',
  aquaSoft: '#D3F8FB',
  warning: '#FD4D0B',
  danger: '#C8443A',
  white: '#FFFFFF',
  scrim: 'rgba(23,32,51,0.42)',
} as const;

export function onChip(fill: string) {
  return fill === color.lime || fill === color.aqua ? color.ink : color.white;
}

export const fontFamily = {
  wanted: {
    regular: 'WantedSansRegular',
    medium: 'WantedSansMedium',
    semiBold: 'WantedSansSemiBold',
    bold: 'WantedSansBold',
  },
  paperlogy: {
    bold: 'Paperlogy7Bold',
    extraBold: 'Paperlogy8ExtraBold',
    black: 'Paperlogy9Black',
  },
} as const;

export const typography = {
  screenTitle: {
    fontFamily: fontFamily.paperlogy.extraBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.75,
  },
  sectionTitle: {
    fontFamily: fontFamily.paperlogy.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  cardTitle: {
    fontFamily: fontFamily.paperlogy.bold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.45,
  },
  body: {
    fontFamily: fontFamily.wanted.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.15,
  },
  bodyMedium: {
    fontFamily: fontFamily.wanted.medium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.15,
  },
  bodySmall: {
    fontFamily: fontFamily.wanted.regular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  tab: {
    fontFamily: fontFamily.wanted.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  label: {
    fontFamily: fontFamily.wanted.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  chip: {
    fontFamily: fontFamily.wanted.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.05,
  },
  caption: {
    fontFamily: fontFamily.wanted.regular,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0,
  },
  button: {
    fontFamily: fontFamily.wanted.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
  },
  statXL: {
    fontFamily: fontFamily.paperlogy.black,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
  },
  statLG: {
    fontFamily: fontFamily.paperlogy.extraBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.65,
  },
  statMD: {
    fontFamily: fontFamily.paperlogy.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.45,
  },
  cardGraphLabel: {
    fontFamily: fontFamily.wanted.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.05,
  },
  cardAchievement: {
    fontFamily: fontFamily.paperlogy.extraBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.55,
  },
  cardCta: {
    fontFamily: fontFamily.wanted.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
} as const;

export const leagueCard = {
  padding: 20,
  gapTight: 10,
  gap: 14,
  gapLoose: 18,
  radius: 22,
  ctaHeight: 50,
  ctaBackground: color.ink,
  ctaForeground: color.white,
} as const;

export const space = { x1: 4, x2: 8, x3: 12, x4: 16, x5: 20, x6: 24, x8: 32, x10: 40 } as const;
export const radius = { control: 8, input: 12, card: 16, league: 22, round: 999 } as const;

export const elevation = Platform.select({
  ios: { shadowColor: color.ink, shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } },
  android: { elevation: 5 },
  default: { boxShadow: '0 8px 24px rgba(23,32,51,0.12)' },
});

export const layout = { mobileGutter: 20, smallGutter: 16, tabletMax: 680, desktopMax: 1040 } as const;
