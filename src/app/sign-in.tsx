import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Text } from 'react-native'
import { Button, ErrorText, Field, Screen } from '../components/ui'
import { ApiError, api, type AuthResult } from '../lib/api'
import { useSession } from '../lib/session'
import { type } from '../lib/theme'

export default function SignIn() {
  const params = useLocalSearchParams<{ code?: string; email?: string }>()
  const { signIn } = useSession()
  const [email, setEmail] = useState(params.email ?? '')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState(params.code ?? '')
  const [showCode, setShowCode] = useState(!!params.code)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const result = await api<AuthResult>('/auth/sign-in', {
        method: 'POST',
        body: { email, password, ...(code.trim() ? { code: code.trim() } : {}) },
      })
      await signIn(result.token)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setShowCode(true)
      setError(e instanceof ApiError ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <Text style={type.body}>Sign in with the email and password you used for A Star Swim Schools.</Text>
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
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={submit}
      />
      {showCode ? (
        <Field
          label="Invite code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="From your welcome email"
        />
      ) : null}
      <ErrorText message={error} />
      <Button label="Sign in" onPress={submit} loading={busy} />
      <Button
        label="Forgot password?"
        variant="secondary"
        onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
      />
      {!showCode ? (
        <Button label="Link another family with a code" variant="secondary" onPress={() => setShowCode(true)} />
      ) : null}
    </Screen>
  )
}
