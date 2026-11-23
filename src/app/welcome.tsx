import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, StaffLoginLink } from '../components/ui'
import { colors, radius, space, type } from '../lib/theme'
import { setActiveRole } from '../lib/user-role'

export default function Welcome() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="A Star Swim Schools"
        />
        <Text style={[type.title, styles.center]}>Taking care of your children, width by width, length by length</Text>
        <Text style={[type.body, styles.center, { color: colors.muted, maxWidth: 360 }]}>
          Lesson times, badges, payment dates and messages from A Star Swim Schools, all in one place.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="I have an invite code"
          onPress={() => router.push('/join')}
        />
        <Button
          label="I already have an account"
          variant="secondary"
          onPress={() => router.push('/sign-in')}
        />

        {/* Dedicated In-App Staff Portal Option */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Staff Portal Login"
          onPress={async () => {
            await setActiveRole('staff')
            router.push('/staff-login')
          }}
          style={({ pressed }) => [styles.staffCard, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.staffIconContainer}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          </View>
          <View style={styles.staffTextContainer}>
            <Text style={styles.staffTitle}>School Staff Portal</Text>
            <Text style={styles.staffSubtitle}>Access registers, classes and poolside management</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        <StaffLoginLink />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: space.xl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.md,
    maxWidth: 420,
    alignSelf: 'center',
  },
  logo: {
    width: 280,
    height: 135,
    marginBottom: space.md,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    gap: space.md,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingBottom: space.sm,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    gap: space.md,
    marginTop: space.xs,
  },
  staffIconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffTextContainer: {
    flex: 1,
    gap: 2,
  },
  staffTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  staffSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
})
