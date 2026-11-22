export const colors = {
  primary: '#1D5BB0',
  primaryDeep: '#16478A',
  primarySoft: '#E6EFFA',
  onPrimary: '#FFFFFF',
  background: '#F2F6FA',
  card: '#FFFFFF',
  text: '#15213B',
  muted: '#5B6780',
  border: '#E1E8F0',
  aqua: '#13808C',
  aquaSoft: '#DDF2F3',
  gold: '#E9A623',
  goldSoft: '#FDF3DC',
  danger: '#C73A2B',
  dangerSoft: '#FBE9E7',
}

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 }

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

export const type = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  heading: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  small: { fontSize: 14, lineHeight: 20, color: colors.muted },
  label: { fontSize: 13, fontWeight: '700' as const, color: colors.muted, letterSpacing: 0.2 },
}
