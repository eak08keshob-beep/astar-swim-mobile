import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { LockScreen } from '../components/lock-screen'
import { Loading } from '../components/ui'
import { AppLockProvider, useAppLock } from '../lib/app-lock'
import { SessionProvider, useSession } from '../lib/session'
import { colors } from '../lib/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

function RootNavigator() {
  const { token, ready } = useSession()
  const lock = useAppLock()

  useEffect(() => {
    if (ready && lock.checked) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [ready, lock.checked])

  if (!ready || !lock.checked) return <Loading />

  return (
    <>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="message/[id]" options={{ title: 'Message' }} />
        <Stack.Screen name="schedule/[id]" options={{ title: 'Payment schedule' }} />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="join" options={{ title: 'Join with a code' }} />
        <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Reset password' }} />
      </Stack.Protected>
      <Stack.Screen name="staff-login" options={{ headerShown: false }} />
    </Stack>
    {lock.locked ? <LockScreen /> : null}
    </>
  )
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <AppLockProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AppLockProvider>
    </SessionProvider>
  )
}
