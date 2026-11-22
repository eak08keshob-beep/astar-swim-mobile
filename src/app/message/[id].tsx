import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import { mutate as globalMutate } from 'swr'
import { Button, Card, ErrorText, Field, Loading, Screen } from '../../components/ui'
import { ApiError, api, type MessageDetail } from '../../lib/api'
import { longDate, relativeDate } from '../../lib/format'
import { useSession } from '../../lib/session'
import { colors, space, type } from '../../lib/theme'
import { useApi } from '../../lib/use-api'

const refreshInbox = () =>
  globalMutate((key) => Array.isArray(key) && (key[0] === '/messages' || key[0] === '/me'))

export default function MessageThread() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { token } = useSession()
  const { data, error, mutate } = useApi<{ message: MessageDetail }>(`/messages/${id}`)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const wasUnread = data ? !data.message.readAt : false
  useEffect(() => {
    // Opening the message marks it read on the server.
    if (wasUnread) refreshInbox()
  }, [wasUnread])

  if (!data && !error) return <Loading />
  const message = data?.message

  async function send() {
    if (!reply.trim()) return
    setSending(true)
    setSendError(null)
    try {
      await api(`/messages/${id}`, { token, method: 'POST', body: { body: reply.trim() } })
      setReply('')
      mutate()
    } catch (e) {
      setSendError(e instanceof ApiError ? e.message : 'Could not send your reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: message?.subject ?? 'Message' }} />
      <Screen>
        <ErrorText message={error?.message} />
        {message ? (
          <>
            <Card>
              <Text style={type.heading}>{message.subject}</Text>
              <Text style={type.small}>
                {[message.sentByName, longDate(message.createdAt)].filter(Boolean).join(' · ')}
              </Text>
              <Text style={[type.body, { marginTop: space.sm }]}>{message.body}</Text>
            </Card>

            {message.replies.map((r) => {
              const mine = r.fromRole === 'parent'
              return (
                <View key={r.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[type.body, mine && { color: colors.onPrimary }]}>{r.body}</Text>
                  <Text style={[type.small, { fontSize: 12 }, mine && { color: colors.primarySoft }]}>
                    {mine ? 'You' : r.authorName ?? 'A Star Swim Schools'} · {relativeDate(r.createdAt)}
                  </Text>
                </View>
              )
            })}

            <View style={{ gap: space.sm, marginTop: space.md }}>
              <Field
                label="Reply to the school"
                value={reply}
                onChangeText={setReply}
                multiline
                maxLength={2000}
                placeholder="Write a reply"
                style={styles.replyInput}
              />
              <ErrorText message={sendError} />
              <Button label="Send reply" onPress={send} loading={sending} disabled={!reply.trim()} />
            </View>
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '85%', borderRadius: 16, padding: space.md, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  replyInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: space.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
  },
})
