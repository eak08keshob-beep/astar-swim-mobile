import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppState, Platform } from 'react-native'
import { useSession } from './session'

const PREF_KEY = 'astar.app-lock'
const RELOCK_AFTER_MS = 60_000

type AppLock = {
  /** The device has Face ID / Touch ID (or Android biometrics) set up. */
  available: boolean
  /** Human name for the method, e.g. "Face ID". */
  label: string
  enabled: boolean
  locked: boolean
  checked: boolean
  unlock: () => Promise<void>
  setEnabled: (next: boolean) => Promise<void>
}

const AppLockContext = createContext<AppLock | null>(null)

async function detectBiometrics() {
  if (Platform.OS === 'web') return { available: false, label: 'Face ID' }
  const [hasHardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ])
  const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  const label =
    Platform.OS === 'ios' ? (face ? 'Face ID' : 'Touch ID') : face ? 'face unlock' : 'fingerprint'
  return { available: hasHardware && enrolled, label }
}

function authenticate(promptMessage: string) {
  return LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: 'Cancel' }).then((r) => r.success)
}

/** Asks for Face ID / Touch ID when the app opens, and again after it has been in the background for a minute. */
export function AppLockProvider({ children }: { children: ReactNode }) {
  const { token, ready: sessionReady } = useSession()
  const [available, setAvailable] = useState(false)
  const [label, setLabel] = useState('Face ID')
  const [enabled, setEnabledState] = useState(true)
  const [locked, setLocked] = useState(false)
  const [checked, setChecked] = useState(false)
  const backgroundedAt = useRef<number | null>(null)
  const active = available && enabled && Boolean(token)

  useEffect(() => {
    if (!sessionReady || checked) return
    Promise.all([detectBiometrics(), Platform.OS === 'web' ? null : SecureStore.getItemAsync(PREF_KEY)])
      .then(([bio, pref]) => {
        const on = pref !== 'off'
        setAvailable(bio.available)
        setLabel(bio.label)
        setEnabledState(on)
        // Only a cold start with a saved sign-in locks; signing in fresh does not.
        setLocked(bio.available && on && Boolean(token))
      })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [sessionReady, checked, token])

  useEffect(() => {
    if (!token) setLocked(false)
  }, [token])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now()
      if (state === 'active' && backgroundedAt.current !== null) {
        if (active && Date.now() - backgroundedAt.current > RELOCK_AFTER_MS) setLocked(true)
        backgroundedAt.current = null
      }
    })
    return () => sub.remove()
  }, [active])

  const unlock = useCallback(async () => {
    if (await authenticate('Unlock A Star Swim Schools')) setLocked(false)
  }, [])

  const setEnabled = useCallback(
    async (next: boolean) => {
      if (!(await authenticate(next ? `Turn on ${label}` : `Turn off ${label}`))) return
      await SecureStore.setItemAsync(PREF_KEY, next ? 'on' : 'off')
      setEnabledState(next)
    },
    [label],
  )

  const value = useMemo(
    () => ({ available, label, enabled, locked: locked && active, checked, unlock, setEnabled }),
    [available, label, enabled, locked, active, checked, unlock, setEnabled],
  )
  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>
}

export function useAppLock() {
  const lock = useContext(AppLockContext)
  if (!lock) throw new Error('useAppLock must be used inside AppLockProvider')
  return lock
}
