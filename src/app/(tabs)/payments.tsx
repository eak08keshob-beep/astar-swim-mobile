import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Card, ErrorText, Loading, Pill, Screen, SectionLabel } from '../../components/ui'
import type { Invoice, Schedule } from '../../lib/api'
import { formatMoney, longDate, shortDate } from '../../lib/format'
import { colors, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'

function nextPayment(schedule: Schedule) {
  const today = new Date().toISOString().slice(0, 10)
  return schedule.rows.find((r) => r.paymentDate >= today)?.paymentDate ?? null
}

function statusTone(status: string): 'red' | 'grey' | 'blue' {
  if (status === 'paid') return 'blue'
  if (status === 'void' || status === 'cancelled') return 'grey'
  return 'red'
}

export default function Payments() {
  const schedules = useApi<{ schedules: Schedule[] }>('/payment-schedules')
  const invoices = useApi<{ invoices: Invoice[] }>('/invoices')

  if (!schedules.data && !invoices.data && !schedules.error && !invoices.error) return <Loading />
  const unpaid = (invoices.data?.invoices ?? []).filter((i) => i.status === 'unpaid' || i.status === 'overdue')
  const owed = unpaid.reduce((sum, i) => sum + i.amountCents, 0)

  return (
    <Screen
      refreshing={schedules.isValidating || invoices.isValidating}
      onRefresh={() => {
        schedules.mutate()
        invoices.mutate()
      }}
    >
      <ErrorText message={schedules.error?.message ?? invoices.error?.message} />

      <Card style={owed ? { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft } : undefined}>
        <Text style={type.label}>Outstanding</Text>
        <Text style={[type.title, owed ? { color: colors.danger } : null]}>{formatMoney(owed)}</Text>
        <Text style={type.small}>
          {owed
            ? `${unpaid.length} ${unpaid.length === 1 ? 'invoice' : 'invoices'} to pay. Pay by bank transfer with your swimmer's name as the reference.`
            : 'You are all paid up. Thank you!'}
        </Text>
      </Card>

      <SectionLabel>Payment schedules</SectionLabel>
      {schedules.data?.schedules.length === 0 ? (
        <Card>
          <Text style={type.small}>The school hasn&apos;t published a payment schedule for your classes yet.</Text>
        </Card>
      ) : (
        schedules.data?.schedules.map((s) => {
          const next = nextPayment(s)
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() => router.push(`/schedule/${s.id}`)}
              style={({ pressed }) => [styles.schedule, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.scheduleIcon}>
                <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={type.heading}>{s.heading || s.name}</Text>
                <Text style={type.small}>{next ? `Next payment due ${longDate(next)}` : 'All payments in this schedule have passed'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          )
        })
      )}

      <SectionLabel>Invoices</SectionLabel>
      {invoices.data?.invoices.length === 0 ? (
        <Card>
          <Text style={type.small}>No invoices yet.</Text>
        </Card>
      ) : (
        invoices.data?.invoices.map((inv) => (
          <Card key={inv.id} style={styles.invoice}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={type.body}>{inv.description}</Text>
              <Text style={type.small}>
                {inv.status === 'paid' && inv.paidAt
                  ? `Paid ${shortDate(inv.paidAt)}`
                  : inv.dueDate
                    ? `Due ${shortDate(inv.dueDate)}`
                    : `Issued ${shortDate(inv.createdAt)}`}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[type.body, { fontWeight: '700' }]}>{formatMoney(inv.amountCents)}</Text>
              <Pill label={inv.status.charAt(0).toUpperCase() + inv.status.slice(1)} tone={statusTone(inv.status)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  schedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
  },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoice: { flexDirection: 'row', alignItems: 'center', gap: space.md },
})
