import useSWR from 'swr'
import { ApiError, api } from './api'
import { useSession } from './session'

/** Authenticated GET against the parent API. Signs the parent out if their session has expired. */
export function useApi<T>(path: string | null) {
  const { token, signOut } = useSession()
  return useSWR<T, ApiError>(token && path ? [path, token] : null, ([p, t]: [string, string]) => api<T>(p, { token: t }), {
    onError: (error) => {
      if (error.status === 401) signOut()
    },
  })
}
