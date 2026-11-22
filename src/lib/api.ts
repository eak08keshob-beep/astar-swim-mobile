const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://www.astarswimmanagement.com').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type RequestOptions = { token?: string | null; method?: 'GET' | 'POST' | 'DELETE'; body?: unknown }

export async function api<T>(path: string, { token, method = 'GET', body }: RequestOptions = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}/api/app${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Could not reach A Star Swim Schools. Check your connection and try again.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data?.error ?? 'Something went wrong. Please try again.', res.status)
  return data as T
}

export type AuthResult = { token: string; user: { id: string; name: string; email: string } }

export type Invite = { code: string; schoolName: string; guardianName: string; email: string | null }

export type Summary = {
  schoolName: string
  guardianName: string
  email: string | null
  phone: string | null
  unpaidCount: number
  unpaidCents: number
  unreadCount: number
}

export type Lesson = {
  classId: number
  name: string
  dayOfWeek: number
  startTime: string
  durationMinutes: number
  location: string | null
  instructorFirstName: string | null
}

export type Swimmer = {
  id: number
  firstName: string
  lastName: string
  dateOfBirth: string | null
  levelName: string | null
  levelColor: string | null
  lessons: Lesson[]
  badges: { id: number; name: string; color: string | null; awardedOn: string }[]
}

export type Invoice = {
  id: number
  description: string
  amountCents: number
  dueDate: string | null
  status: string
  paidAt: string | null
  createdAt: string
}

export type MessageSummary = {
  id: number
  subject: string
  body: string
  sentByName: string | null
  createdAt: string
  readAt: string | null
}

export type Reply = { id: number; body: string; fromRole: string; authorName: string | null; createdAt: string }

export type MessageDetail = MessageSummary & { replies: Reply[] }

export type ScheduleLesson = { date: string; badges?: boolean; closed?: boolean; note?: string }

export type Schedule = {
  id: number
  name: string
  heading: string | null
  publishedAt: string | null
  rows: { paymentDate: string; lessons: ScheduleLesson[] }[]
  footerText: string | null
  payTo?: { label: string; line: string }[]
  legend: { kind: 'badges' | 'closed'; text: string }[]
}
