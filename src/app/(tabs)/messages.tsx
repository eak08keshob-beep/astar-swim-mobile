import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { EmptyState, ErrorText, Loading, Screen } from '../../components/ui'
import type { MessageSummary } from '../../lib/api'
import { relativeDate } from '../../lib/format'
import { colors, radius, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'
import { markNotificationsRead } from '../../lib/background-engine'

export default function Messages() {
  const { data, error, isValidating, mutate } = useApi<{ messages: MessageSummary[] }>('/messages')

  useEffect(() => {
    markNotificationsRead().catch(() => {})
  }, [])
  if (!data && !error) return <Loading />

  return (
    <Screen refreshing={isValidating} onRefresh={() => mutate()}>
      <ErrorText message={error?.message} />
      {data?.messages.length === 0 ? (
        <EmptyState title="No messages yet" body="Announcements and updates from the school will arrive here." />
      ) : (
        data?.messages.map((m) => {
          const unread = !m.readAt
          return (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityLabel={`${unread ? 'Unread. ' : ''}${m.subject}`}
              onPress={() => router.push(`/message/${m.id}`)}
              style={({ pressed }) => [styles.item, unread && styles.unread, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.icon, { backgroundColor: unread ? colors.primary : colors.primarySoft }]}>
                <Ionicons name="megaphone" size={18} color={unread ? colors.onPrimary : colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.titleRow}>
                  <Text numberOfLines={1} style={[type.body, { flex: 1, fontWeight: unread ? '800' : '600' }]}>
                    {m.subject}
                  </Text>
                  <Text style={[type.small, { fontSize: 12 }]}>{relativeDate(m.createdAt)}</Text>
                </View>
                <Text numberOfLines={2} style={type.small}>
                  {m.body}
                </Text>
                {unread ? (
                  <View style={styles.newPill}>
                    <Text style={styles.newText}>New</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )
        })
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unread: { borderColor: colors.primarySoft },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  newPill: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2, marginTop: 2 },
  newText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
})
