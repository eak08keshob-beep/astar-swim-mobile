import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Text } from 'react-native'
import { Button, ErrorText, Field, Screen } from '../components/ui'
import { ApiError, api } from '../lib/api'
import { type } from '../lib/theme'

type Step = 'email' | 'code' | 'no-email' | 'done'

export default function ForgotPassword() {
  const params = useLocalSearchParams<{ email?: string }>()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(params.email ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function requestCode() {
    setBusy(true)
    setError(null)
    try {
      const result = await api<{ emailAvailable: boolean }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })
      setStep(result.emailAvailable ? 'code' : 'no-email')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword() {
    setBusy(true)
    setError(null)
    try {
      await api('/auth/reset-password', { method: 'POST', body: { email, code, password } })
      setStep('done')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function backToSignIn() {
    router.replace({ pathname: '/sign-in', params: { email } })
  }

  if (step === 'done') {
    return (
      <Screen>
        <Text style={type.title}>Password changed</Text>
        <Text style={type.body}>You can now sign in with your new password.</Text>
        <Button label="Sign in" onPress={backToSignIn} />
      </Screen>
    )
  }

  if (step === 'no-email') {
    return (
      <Screen>
        <Text style={type.title}>Ask the school to reset it</Text>
        <Text style={type.body}>
          Email reset codes are not available yet. Contact A Star Swim Schools and they can set a new password
          for you, then sign in with it.
        </Text>
        <Button label="Back to sign in" onPress={backToSignIn} />
      </Screen>
    )
  }

  if (step === 'code') {
    return (
      <Screen>
        <Text style={type.body}>
          If {email} has an account, we have emailed a 6-digit code. It expires in 10 minutes.
        </Text>
        <Field
          label="Code from your email"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
        />
        <Field
          label="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="At least 8 characters"
          onSubmitEditing={resetPassword}
        />
        <ErrorText message={error} />
        <Button label="Change password" onPress={resetPassword} loading={busy} />
        <Button label="Send a new code" variant="secondary" onPress={requestCode} disabled={busy} />
      </Screen>
    )
  }

  return (
    <Screen>
      <Text style={type.body}>Enter the email you signed up with and we will send you a code to reset your password.</Text>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        onSubmitEditing={requestCode}
      />
      <ErrorText message={error} />
      <Button label="Send reset code" onPress={requestCode} loading={busy} />
    </Screen>
  )
}
