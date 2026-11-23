import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAppLock } from '../lib/app-lock'
import { useSession } from '../lib/session'
import { colors, space, type } from '../lib/theme'
import { Button } from './ui'

/** Covers the app (keeping its navigation state underneath) until the parent unlocks it. */
export function LockScreen() {
  const { label, unlock } = useAppLock()
  const { signOut } = useSession()

  useEffect(() => {
    unlock()
  }, [unlock])

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="A Star Swim Schools"
      />
      <View style={styles.copy}>
        <Text style={[type.title, { textAlign: 'center' }]}>Welcome back</Text>
        <Text style={[type.body, { textAlign: 'center', color: colors.muted }]}>
          Unlock with {label} to see your family&apos;s details.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label={`Unlock with ${label}`} onPress={unlock} />
        <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.muted} />
          <Text style={[type.small, { fontWeight: '600' }]}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.xl,
  },
  logo: { width: 220, height: 106 },
  copy: { gap: space.sm, alignItems: 'center' },
  actions: { alignSelf: 'stretch', gap: space.lg, alignItems: 'stretch' },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
})
