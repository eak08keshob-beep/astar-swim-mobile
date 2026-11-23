import Ionicons from '@expo/vector-icons/Ionicons'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { BASE_URL } from '../lib/api'
import { colors, radius, space, type } from '../lib/theme'
import { setActiveRole } from '../lib/user-role'

export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={[type.label, { marginTop: space.sm }]}>{children}</Text>
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
}) {
  const primary = variant === 'primary'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        (pressed || disabled) && { opacity: 0.7 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? colors.onPrimary : colors.primary }]}>{label}</Text>
      )}
    </Pressable>
  )
}

const STAFF_LOGIN_URL = `${BASE_URL}/staff-login`

async function openStaffLogin() {
  await setActiveRole('staff')
  if (Platform.OS === 'web') {
    globalThis.location?.assign(STAFF_LOGIN_URL)
  } else {
    router.push('/staff-login')
  }
}

const APP_VERSION = Constants.expoConfig?.version

export function StaffLoginLink() {
  return (
    <View style={styles.staffLinkGroup}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Staff login"
        accessibilityHint="Opens the in-app A Star Swim Schools staff portal"
        onPress={openStaffLogin}
        hitSlop={8}
        style={({ pressed }) => [styles.staffLink, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
        <Text style={[styles.staffLinkText, { color: colors.primary, fontWeight: '600' }]}>Staff Login (In-App Portal)</Text>
      </Pressable>
      {APP_VERSION ? <Text style={styles.versionText}>Version {APP_VERSION}</Text> : null}
    </View>
  )
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} style={styles.input} {...props} />
    </View>
  )
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  )
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
      <Text style={type.heading}>{title}</Text>
      <Text style={[type.small, { textAlign: 'center', marginTop: space.xs }]}>{body}</Text>
    </Card>
  )
}

export function Pill({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'gold' | 'red' | 'grey' }) {
  const palette = {
    blue: [colors.primarySoft, colors.primary],
    gold: [colors.goldSoft, '#8A5A00'],
    red: [colors.dangerSoft, colors.danger],
    grey: [colors.background, colors.muted],
  }[tone]
  return (
    <View style={[styles.pill, { backgroundColor: palette[0] }]}>
      <Text style={[styles.pillText, { color: palette[1] }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: space.lg, gap: space.md, paddingBottom: space.xxl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  button: { minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.primarySoft },
  buttonText: { fontSize: 16, fontWeight: '600' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: space.xxl },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },
  staffLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    alignSelf: 'center',
    paddingHorizontal: space.md,
  },
  staffLinkText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  staffLinkGroup: { alignItems: 'center', gap: space.xs },
  versionText: { fontSize: 12, color: colors.muted },
})
