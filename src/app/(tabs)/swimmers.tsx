import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, ErrorText, Loading, Pill, Screen } from '../../components/ui'
import type { Swimmer } from '../../lib/api'
import { dayName, formatTime, shortDate } from '../../lib/format'
import { colors, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'

function age(dob: string | null) {
  if (!dob) return null
  const born = new Date(`${dob}T12:00:00`)
  const now = new Date()
  let years = now.getFullYear() - born.getFullYear()
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) years -= 1
  return years
}

function SwimmerCard({ swimmer }: { swimmer: Swimmer }) {
  const years = age(swimmer.dateOfBirth)
  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{swimmer.firstName[0]}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.heading}>
            {swimmer.firstName} {swimmer.lastName}
          </Text>
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            {swimmer.levelName ? <Pill label={swimmer.levelName} /> : null}
            {years !== null ? <Text style={type.small}>{years} years old</Text> : null}
          </View>
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={type.label}>Lessons</Text>
        {swimmer.lessons.length === 0 ? (
          <Text style={type.small}>Not booked into a class yet.</Text>
        ) : (
          swimmer.lessons.map((l) => (
            <View key={l.classId} style={styles.line}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[type.body, { flex: 1 }]}>
                {dayName(l.dayOfWeek)} {formatTime(l.startTime)}
                <Text style={type.small}>
                  {'  '}
                  {[l.name, l.location, l.instructorFirstName ? `with ${l.instructorFirstName}` : null].filter(Boolean).join(' · ')}
                </Text>
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={type.label}>Badges</Text>
        {swimmer.badges.length === 0 ? (
          <Text style={type.small}>No badges yet. They&apos;ll appear here as soon as they&apos;re awarded.</Text>
        ) : (
          swimmer.badges.map((b) => (
            <View key={b.id} style={styles.line}>
              <Ionicons name="star" size={16} color={colors.gold} />
              <Text style={[type.body, { flex: 1 }]}>{b.name}</Text>
              <Text style={type.small}>{shortDate(b.awardedOn)}</Text>
            </View>
          ))
        )}
      </View>
    </Card>
  )
}

export default function Swimmers() {
  const { data, error, isValidating, mutate } = useApi<{ swimmers: Swimmer[] }>('/swimmers')
  if (!data && !error) return <Loading />

  return (
    <Screen refreshing={isValidating} onRefresh={() => mutate()}>
      <ErrorText message={error?.message} />
      {data?.swimmers.length === 0 ? (
        <EmptyState title="No swimmers yet" body="Once the school adds your swimmers, their lessons and badges show here." />
      ) : (
        data?.swimmers.map((s) => <SwimmerCard key={s.id} swimmer={s} />)
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onPrimary, fontSize: 20, fontWeight: '700' },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
})
