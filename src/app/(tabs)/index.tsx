import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ErrorText, Loading, Screen, SectionLabel } from '../../components/ui'
import type { Summary, Swimmer } from '../../lib/api'
import { useAppLock } from '../../lib/app-lock'
import { dayName, formatMoney, formatTime } from '../../lib/format'
import { getLastPushError, registerForPush, usePushState } from '../../lib/push'
import { useSession } from '../../lib/session'
import { colors, radius, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'
import { setActiveRole } from '../../lib/user-role'

type IconName = keyof typeof Ionicons.glyphMap

function upcomingLessons(swimmers: Swimmer[]) {
  const today = new Date().getDay()
  return swimmers
    .flatMap((s) => s.lessons.map((l) => ({ ...l, swimmer: s.firstName, inDays: (l.dayOfWeek - today + 7) % 7 })))
    .sort((a, b) => a.inDays - b.inDays || a.startTime.localeCompare(b.startTime))
}

function whenLabel(inDays: number, dayOfWeek: number) {
  if (inDays === 0) return 'Today'
  if (inDays === 1) return 'Tomorrow'
  return dayName(dayOfWeek)
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function ActionRow({
  icon,
  tint,
  soft,
  title,
  detail,
  onPress,
}: {
  icon: IconName
  tint: string
  soft: string
  title: string
  detail: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.body, { fontWeight: '700' }]}>{title}</Text>
        <Text style={type.small}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  )
}

export default function Home() {
  const insets = useSafeAreaInsets()
  const { token, signOut } = useSession()
  const summary = useApi<Summary>('/me')
  const swimmers = useApi<{ swimmers: Swimmer[] }>('/swimmers')
  const [pushState, setPushState] = usePushState()
  const lock = useAppLock()

  if (!summary.data && !summary.error) return <Loading />
  const me = summary.data
  const kids = swimmers.data?.swimmers ?? []
  const lessons = upcomingLessons(kids)
  const next = lessons[0]
  const later = lessons.slice(1, 4)
  const firstName = me?.guardianName.split(' ')[0]

  const attention: React.ComponentProps<typeof ActionRow>[] = []
  if (me?.unreadCount) {
    attention.push({
      icon: 'chatbubble-ellipses',
      tint: colors.primary,
      soft: colors.primarySoft,
      title: me.unreadCount === 1 ? '1 new message' : `${me.unreadCount} new messages`,
      detail: 'From the swim school',
      onPress: () => router.navigate('/messages'),
    })
  }
  if (me?.unpaidCents) {
    attention.push({
      icon: 'card',
      tint: colors.danger,
      soft: colors.dangerSoft,
      title: `${formatMoney(me.unpaidCents)} to pay`,
      detail: me.unpaidCount === 1 ? '1 invoice outstanding' : `${me.unpaidCount} invoices outstanding`,
      onPress: () => router.navigate('/payments'),
    })
  }

  return (
    <Screen
      refreshing={summary.isValidating}
      onRefresh={() => {
        summary.mutate()
        swimmers.mutate()
      }}
    >
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.small}>{me?.schoolName ?? 'A Star Swim Schools'}</Text>
          <Text style={type.title}>{firstName ? `${greeting()}, ${firstName}` : greeting()}</Text>
        </View>
      </View>
      <ErrorText message={summary.error?.message} />

      {next ? (
        <View style={styles.hero} accessible accessibilityLabel={`Next swim: ${next.swimmer}, ${whenLabel(next.inDays, next.dayOfWeek)} at ${formatTime(next.startTime)}`}>
          <View style={styles.heroTop}>
            <Text style={styles.heroEyebrow}>Next swim</Text>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>{whenLabel(next.inDays, next.dayOfWeek)}</Text>
            </View>
          </View>
          <Text style={styles.heroTime}>{formatTime(next.startTime)}</Text>
          <Text style={styles.heroName}>{next.swimmer}</Text>
          <View style={styles.heroMeta}>
            <Ionicons name="water" size={15} color={colors.primarySoft} />
            <Text style={styles.heroMetaText}>
              {[next.name, next.location, next.instructorFirstName ? `with ${next.instructorFirstName}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.hero, { gap: space.xs }]}>
          <Text style={styles.heroEyebrow}>Next swim</Text>
          <Text style={styles.heroName}>{swimmers.data ? 'No lessons booked yet' : 'Loading lessons…'}</Text>
        </View>
      )}

      {pushState === 'undetermined' || pushState === 'error' ? (
        <View style={styles.notify}>
          <View style={[styles.actionIcon, { backgroundColor: colors.goldSoft }]}>
            <Ionicons name="notifications" size={20} color="#8A5A00" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.body, { fontWeight: '700' }]}>
              {pushState === 'error' ? "Notifications couldn't turn on" : 'Never miss an update'}
            </Text>
            <Text style={type.small}>
              {pushState === 'error'
                ? getLastPushError() ?? 'Something went wrong. Tap to try again.'
                : 'Get alerts for messages, badges, payments and lesson reminders.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={async () => token && setPushState(await registerForPush(token))}
            style={({ pressed }) => [styles.notifyButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.notifyButtonText}>Turn on</Text>
          </Pressable>
        </View>
      ) : null}

      <SectionLabel>For you</SectionLabel>
      {attention.length === 0 ? (
        <View style={styles.caughtUp}>
          <Ionicons name="checkmark-circle" size={22} color={colors.aqua} />
          <Text style={[type.body, { flex: 1 }]}>{"You're all caught up. Nothing needs your attention."}</Text>
        </View>
      ) : (
        <View style={styles.group}>
          {attention.map((a, i) => (
            <View key={a.title} style={i > 0 && styles.divider}>
              <ActionRow {...a} />
            </View>
          ))}
        </View>
      )}

      {kids.length > 0 ? (
        <>
          <SectionLabel>Your swimmers</SectionLabel>
          <View style={styles.kids}>
            {kids.map((s) => {
              const latest = s.badges[0]
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  onPress={() => router.navigate('/swimmers')}
                  style={({ pressed }) => [styles.kid, pressed && { opacity: 0.85 }]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{s.firstName[0]}</Text>
                  </View>
                  <Text style={[type.body, { fontWeight: '700' }]} numberOfLines={1}>
                    {s.firstName}
                  </Text>
                  <Text style={type.small} numberOfLines={1}>
                    {s.levelName ?? 'Level to be set'}
                  </Text>
                  <View style={styles.badgeLine}>
                    <Ionicons name="star" size={13} color={colors.gold} />
                    <Text style={[type.small, { fontSize: 13, flex: 1 }]} numberOfLines={1}>
                      {latest ? latest.name : 'First badge soon'}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </>
      ) : null}

      {later.length > 0 ? (
        <>
          <SectionLabel>Later this week</SectionLabel>
          <View style={styles.group}>
            {later.map((l, i) => (
              <View key={`${l.classId}-${l.swimmer}`} style={[styles.lesson, i > 0 && styles.divider]}>
                <View style={styles.when}>
                  <Text style={styles.whenDay}>{whenLabel(l.inDays, l.dayOfWeek).slice(0, 3)}</Text>
                  <Text style={styles.whenTime}>{formatTime(l.startTime)}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.body, { fontWeight: '700' }]}>{l.swimmer}</Text>
                  <Text style={type.small} numberOfLines={1}>
                    {[l.name, l.location].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {lock.available ? (
        <>
          <SectionLabel>Security</SectionLabel>
          <View style={[styles.group, styles.action]}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={lock.label === 'Face ID' ? 'scan' : 'finger-print'} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.body, { fontWeight: '700' }]}>Unlock with {lock.label}</Text>
              <Text style={type.small}>Ask for {lock.label} when the app opens.</Text>
            </View>
            <Switch
              value={lock.enabled}
              onValueChange={lock.setEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
              accessibilityLabel={`Unlock with ${lock.label}`}
            />
          </View>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={async () => {
          await setActiveRole('staff')
          router.push('/staff-login')
        }}
        style={[styles.signOut, { marginTop: space.sm, paddingVertical: space.sm }]}
      >
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        <Text style={[type.small, { fontWeight: '600', color: colors.primary }]}>School Staff Portal</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.muted} />
        <Text style={[type.small, { fontWeight: '600' }]}>Sign out</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.xs },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: space.xl,
    gap: space.xs,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { color: colors.primarySoft, fontSize: 14, fontWeight: '600' },
  heroChip: { backgroundColor: colors.primaryDeep, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
  heroChipText: { color: colors.onPrimary, fontSize: 13, fontWeight: '700' },
  heroTime: { color: colors.onPrimary, fontSize: 40, fontWeight: '800', letterSpacing: -1, marginTop: space.sm },
  heroName: { color: colors.onPrimary, fontSize: 20, fontWeight: '700' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm },
  heroMetaText: { color: colors.primarySoft, fontSize: 14, flex: 1 },
  notify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  notifyButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  notifyButtonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  action: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  caughtUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.aquaSoft,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  kids: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  kid: { flexGrow: 1, flexBasis: '45%', backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.aquaSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  avatarText: { color: colors.aqua, fontSize: 18, fontWeight: '800' },
  badgeLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  when: { width: 64, alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingVertical: space.sm },
  whenDay: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  whenTime: { fontSize: 14, fontWeight: '700', color: colors.primary },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingVertical: space.lg, marginTop: space.md },
})
