import * as SecureStore from 'expo-secure-store'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import { api } from './api'
import { setActiveRole } from './user-role'

const TOKEN_KEY = 'astar.session'

const storage = {
  get: () =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.getItem(TOKEN_KEY) ?? null) : SecureStore.getItemAsync(TOKEN_KEY),
  set: (value: string) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.setItem(TOKEN_KEY, value)) : SecureStore.setItemAsync(TOKEN_KEY, value),
  clear: () =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.removeItem(TOKEN_KEY)) : SecureStore.deleteItemAsync(TOKEN_KEY),
}

type Session = {
  token: string | null
  ready: boolean
  signIn: (token: string) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    storage
      .get()
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setReady(true))
  }, [])

  const signIn = useCallback(async (next: string) => {
    await storage.set(next)
    await setActiveRole('parent')
    setToken(next)
  }, [])

  const signOut = useCallback(async () => {
    const current = token
    setToken(null)
    await storage.clear()
    await setActiveRole(null)
    if (current) api('/auth/sign-out', { token: current, method: 'POST', body: {} }).catch(() => {})
  }, [token])

  const value = useMemo(() => ({ token, ready, signIn, signOut }), [token, ready, signIn, signOut])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}
