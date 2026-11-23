import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export type ActiveRole = 'parent' | 'staff' | null

const ROLE_KEY = 'astar.active_role'
const STAFF_LAST_URL_KEY = 'astar.staff_last_url'

export async function getActiveRole(): Promise<ActiveRole> {
  try {
    if (Platform.OS === 'web') {
      return (globalThis.localStorage?.getItem(ROLE_KEY) as ActiveRole) ?? null
    }
    return ((await SecureStore.getItemAsync(ROLE_KEY)) as ActiveRole) ?? null
  } catch {
    return null
  }
}

export async function setActiveRole(role: ActiveRole): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (role) globalThis.localStorage?.setItem(ROLE_KEY, role)
      else globalThis.localStorage?.removeItem(ROLE_KEY)
    } else {
      if (role) await SecureStore.setItemAsync(ROLE_KEY, role)
      else await SecureStore.deleteItemAsync(ROLE_KEY)
    }
  } catch {}
}

export async function getStaffLastUrl(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(STAFF_LAST_URL_KEY) ?? null
    }
    return (await SecureStore.getItemAsync(STAFF_LAST_URL_KEY)) ?? null
  } catch {
    return null
  }
}

export async function setStaffLastUrl(url: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (url) globalThis.localStorage?.setItem(STAFF_LAST_URL_KEY, url)
      else globalThis.localStorage?.removeItem(STAFF_LAST_URL_KEY)
    } else {
      if (url) await SecureStore.setItemAsync(STAFF_LAST_URL_KEY, url)
      else await SecureStore.deleteItemAsync(STAFF_LAST_URL_KEY)
    }
  } catch {}
}
