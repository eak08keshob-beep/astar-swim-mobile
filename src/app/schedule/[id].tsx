import Ionicons from '@expo/vector-icons/Ionicons'
import { Stack, useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, ErrorText, Loading, Screen } from '../../components/ui'
import type { Schedule, ScheduleLesson } from '../../lib/api'
import { longDate, shortDate } from '../../lib/format'
import { colors, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'

function LessonCell({ lesson, week }: { lesson: ScheduleLesson; week: number }) {
  const tone = lesson.closed ? styles.closed : lesson.badges ? styles.badges : null
  return (
    <View style={[styles.cell, tone]}>
      <Text style={styles.week}>Week {week}</Text>
      <Text style={[styles.date, lesson.closed && { textDecorationLine: 'line-through', color: colors.danger }]}>
        {shortDate(lesson.date)}
      </Text>
      {lesson.closed ? <Text style={[styles.tag, { color: colors.danger }]}>Closed</Text> : null}
      {lesson.badges ? (
        <View style={styles.tagRow}>
          <Ionicons name="star" size={11} color={colors.gold} />
          <Text style={[styles.tag, { color: '#8A5A00' }]}>Badges</Text>
        </View>
      ) : null}
      {lesson.note ? <Text style={styles.note}>{lesson.note}</Text> : null}
    </View>
  )
}

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, error } = useApi<{ schedules: Schedule[] }>('/payment-schedules')
  if (!data && !error) return <Loading />

  const schedule = data?.schedules.find((s) => String(s.id) === id)
  const today = new Date().toISOString().slice(0, 10)
  const nextIndex = schedule?.rows.findIndex((r) => r.paymentDate >= today) ?? -1

  return (
    <Screen>
      <Stack.Screen options={{ title: schedule?.heading || schedule?.name || 'Payment schedule' }} />
      <ErrorText message={error?.message} />
      {!schedule ? (
        <EmptyState title="Schedule not found" body="It may have been replaced by a newer schedule." />
      ) : (
        <>
          {schedule.legend.length > 0 ? (
            <Card style={{ gap: space.xs }}>
              {schedule.legend.map((l) => (
                <View key={l.kind} style={styles.legendRow}>
                  <View style={[styles.swatch, l.kind === 'closed' ? styles.closed : styles.badges]} />
                  <Text style={[type.small, { flex: 1 }]}>{l.text}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {schedule.rows.map((row, i) => {
            const isNext = i === nextIndex
            const past = row.paymentDate < today
            return (
              <Card key={row.paymentDate} style={{ ...(isNext ? styles.next : {}), ...(past ? { opacity: 0.6 } : {}) }}>
                <View style={styles.rowHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.label}>Payment due Thursday</Text>
                    <Text style={type.heading}>{longDate(row.paymentDate)}</Text>
                  </View>
                  {isNext ? (
                    <View style={styles.nextPill}>
                      <Text style={styles.nextPillText}>Next</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.grid}>
                  {row.lessons.map((lesson, w) => (
                    <LessonCell key={lesson.date} lesson={lesson} week={w + 1} />
                  ))}
                </View>
              </Card>
            )
          })}

          {schedule.footerText ? (
            <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
              <Text style={[type.small, { color: colors.text }]}>{schedule.footerText}</Text>
            </Card>
          ) : null}

          {schedule.payTo?.map((account) => (
            <Card key={account.label}>
              <Text style={type.label}>Pay into</Text>
              <Text style={[type.small, { color: colors.text, fontWeight: '700' }]}>{account.line}</Text>
            </Card>
          ))}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  cell: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 70,
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    gap: 2,
  },
  badges: { backgroundColor: colors.goldSoft },
  closed: { backgroundColor: colors.dangerSoft },
  week: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  date: { fontSize: 15, fontWeight: '700', color: colors.text },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tag: { fontSize: 11, fontWeight: '700' },
  note: { fontSize: 11, color: colors.muted },
  next: { borderColor: colors.primary, borderWidth: 1.5 },
  nextPill: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: space.sm, paddingVertical: 3 },
  nextPillText: { color: colors.onPrimary, fontSize: 12, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  swatch: { width: 14, height: 14, borderRadius: 4 },
})
