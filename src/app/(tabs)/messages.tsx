import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSWRConfig } from 'swr'
import { SwipeToDelete } from '../../components/swipe-to-delete'
import { EmptyState, ErrorText, Loading, Screen } from '../../components/ui'
import { api, type MessageSummary } from '../../lib/api'
import { markNotificationsRead } from '../../lib/background-engine'
import { relativeDate } from '../../lib/format'
import { useSession } from '../../lib/session'
import { colors, radius, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'

type Inbox = { messages: MessageSummary[] }

export default function Messages() {
  const { token } = useSession()
  const { mutate: mutateGlobal } = useSWRConfig()
  const { data, error, isValidating, mutate } = useApi<Inbox>('/messages')
  const [deleteError, setDeleteError] = useState<string>()

  useEffect(() => {
    markNotificationsRead().catch(() => {})
  }, [])
  if (!data && !error) return <Loading />

  const deleteMessage = async (id: number) => {
    setDeleteError(undefined)
    await mutate(
      async (current) => {
        await api(`/messages/${id}`, { token, method: 'DELETE' })
        return current && { messages: current.messages.filter((m) => m.id !== id) }
      },
      {
        optimisticData: (current) => ({ messages: (current?.messages ?? []).filter((m) => m.id !== id) }),
        rollbackOnError: true,
        revalidate: false,
      },
    ).catch((e: Error) => setDeleteError(e.message))
    mutateGlobal((key) => Array.isArray(key) && key[0] === '/me')
  }

  return (
    <Screen refreshing={isValidating} onRefresh={() => mutate()}>
      <ErrorText message={deleteError ?? error?.message} />
      {data?.messages.length === 0 ? (
        <EmptyState title="No messages yet" body="Announcements and updates from the school will arrive here." />
      ) : (
        <>
          {data?.messages.length ? <Text style={styles.hint}>Swipe left on a message to delete it</Text> : null}
          {data?.messages.map((m) => {
            const unread = !m.readAt
            return (
              <SwipeToDelete key={m.id} label={m.subject} onDelete={() => deleteMessage(m.id)}>
                <Pressable
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
              </SwipeToDelete>
            )
          })}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  hint: { ...type.small, fontSize: 13, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.card,
  },
  unread: { borderColor: colors.primarySoft },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  newPill: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2, marginTop: 2 },
  newText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
})
