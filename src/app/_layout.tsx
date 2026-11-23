import { Stack, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { LockScreen } from '../components/lock-screen'
import { Loading } from '../components/ui'
import { AppLockProvider, useAppLock } from '../lib/app-lock'
import { SessionProvider, useSession } from '../lib/session'
import { colors } from '../lib/theme'
import { getActiveRole, type ActiveRole } from '../lib/user-role'

SplashScreen.preventAutoHideAsync().catch(() => {})

function RootNavigator() {
  const { token, ready: sessionReady } = useSession()
  const lock = useAppLock()
  const [activeRole, setActiveRoleState] = useState<ActiveRole>(null)
  const [roleReady, setRoleReady] = useState(false)

  useEffect(() => {
    getActiveRole().then((role) => {
      setActiveRoleState(role)
      setRoleReady(true)
    })
  }, [])

  useEffect(() => {
    if (sessionReady && lock.checked && roleReady) {
      if (activeRole === 'staff') {
        router.replace('/staff-login')
      }
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [sessionReady, lock.checked, roleReady, activeRole])

  if (!sessionReady || !lock.checked || !roleReady) return <Loading />

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
