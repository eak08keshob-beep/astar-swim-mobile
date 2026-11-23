import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, StaffLoginLink } from '../components/ui'
import { colors, space, type } from '../lib/theme'

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
        <Text style={[type.body, styles.center, { color: colors.muted }]}>
          Lesson times, badges, payment dates and messages from A Star Swim Schools, all in one place.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="I have an invite code" onPress={() => router.push('/join')} />
        <Button label="I already have an account" variant="secondary" onPress={() => router.push('/sign-in')} />
        <Text style={[type.small, styles.center]}>
          Your invite code is in the welcome email from the school. Ask at reception if you can&apos;t find it.
        </Text>
        <StaffLoginLink />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card, padding: space.xl, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md, maxWidth: 420, alignSelf: 'center' },
  logo: { width: 240, height: 116, marginBottom: space.lg },
  center: { textAlign: 'center' },
  actions: { gap: space.md, width: '100%', maxWidth: 420, alignSelf: 'center', paddingBottom: space.md },
})
