import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { Button, Card, ErrorText, Field, Screen, StaffLoginLink } from '../components/ui'
import { ApiError, api, type AuthResult, type Invite } from '../lib/api'
import { useSession } from '../lib/session'
import { type } from '../lib/theme'

export default function Join() {
  const params = useLocalSearchParams<{ code?: string }>()
  const { signIn } = useSession()
  const [code, setCode] = useState(params.code ?? '')
  const [invite, setInvite] = useState<Invite | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [busy, setBusy] = useState(false)

  async function lookUp(value = code) {
    const trimmed = value.trim()
    if (!trimmed) return setError('Enter the code from your welcome email')
    setBusy(true)
    setError(null)
    try {
      const found = await api<Invite>(`/invite/${encodeURIComponent(trimmed)}`)
      setInvite(found)
      setName(found.guardianName)
      setEmail(found.email ?? '')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (params.code) lookUp(params.code)
    // Only look up a code that arrived from a link, once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code])

  async function createAccount() {
    if (!invite) return
    setBusy(true)
    setError(null)
    try {
      const result = await api<AuthResult>('/auth/sign-up', {
        method: 'POST',
        body: { code: invite.code, name, email, password },
      })
      await signIn(result.token)
    } catch (e) {
      setAlreadyRegistered(e instanceof ApiError && e.status === 409 && e.message.includes('already have an account'))
      setError(e instanceof ApiError ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (!invite) {
    return (
      <Screen>
        <Text style={type.body}>Enter the invite code from your A Star Swim Schools welcome email.</Text>
        <Field
          label="Invite code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="e.g. 7KQ2-M9XD"
          returnKeyType="go"
          onSubmitEditing={() => lookUp()}
        />
        <ErrorText message={error} />
        <Button label="Continue" onPress={() => lookUp()} loading={busy} />
        <StaffLoginLink />
      </Screen>
    )
  }

  return (
    <Screen>
      <Card>
        <Text style={type.heading}>Welcome to {invite.schoolName}</Text>
        <Text style={type.small}>Create your parent account to see your family&apos;s swimmers, payments and messages.</Text>
      </Card>
      <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder="At least 8 characters"
        onSubmitEditing={createAccount}
      />
      <ErrorText message={error} />
      <Button label="Create account" onPress={createAccount} loading={busy} />
      {alreadyRegistered ? (
        <Button
          label="Sign in instead"
          variant="secondary"
          onPress={() => router.replace({ pathname: '/sign-in', params: { code: invite.code, email } })}
        />
      ) : null}
    </Screen>
  )
}
