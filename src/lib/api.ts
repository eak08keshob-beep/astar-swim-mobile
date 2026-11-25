import * as ImageManipulator from 'expo-image-manipulator'
import { Platform } from 'react-native'

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://www.astarswimmanagement.com').replace(/\/$/, '')

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

const MAX_PHOTO_DIM = 960

export async function uploadSwimmerPhoto(
  swimmerId: number,
  photo: { uri: string; mimeType?: string | null; fileName?: string | null; width?: number; height?: number },
  token: string,
): Promise<{ photoVersion: string }> {
  // Shrink and re-encode to JPEG so camera photos stay well below Vercel's 4.5 MB body limit
  // and avoid HEIC / content:// URI upload issues on iOS and Android.
  let uploadUri = photo.uri
  let type = photo.mimeType ?? 'image/jpeg'
  let name = photo.fileName ?? `photo.${type.split('/')[1] ?? 'jpg'}`

  try {
    const actions: ImageManipulator.Action[] = []
    if (photo.width && photo.height) {
      if (photo.width > MAX_PHOTO_DIM || photo.height > MAX_PHOTO_DIM) {
        actions.push(
          photo.width >= photo.height
            ? { resize: { width: MAX_PHOTO_DIM } }
            : { resize: { height: MAX_PHOTO_DIM } },
        )
      }
    } else {
      actions.push({ resize: { width: MAX_PHOTO_DIM } })
    }
    const shrunk = await ImageManipulator.manipulateAsync(photo.uri, actions, {
      compress: 0.78,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    uploadUri = shrunk.uri
    type = 'image/jpeg'
    name = 'photo.jpg'
  } catch {
    // Fall back to the original asset if image manipulation is unavailable.
  }

  const form = new FormData()
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uploadUri)).blob()
    form.append('photo', new File([blob], name, { type: blob.type || type }))
  } else {
    // React Native's FormData accepts a { uri, name, type } descriptor for files.
    form.append('photo', { uri: uploadUri, name, type } as unknown as Blob)
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/api/app/swimmers/${swimmerId}/photo`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: form,
    })
  } catch {
    throw new ApiError('Could not reach A Star Swim Schools. Check your connection and try again.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 413) {
    throw new ApiError('That photo is too large. Please choose a smaller photo and try again.', 413)
  }
  if (!res.ok) throw new ApiError(data?.error ?? 'Could not save the photo. Please try again.', res.status)
  return data as { photoVersion: string }
}

export type AuthResult = { token: string; user: { id: string; name: string; email: string } }

export type Invite = { code: string; schoolName: string; guardianName: string; email: string | null }

export type Summary = {
  schoolName: string
  accountName?: string
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
  photoVersion: string | null
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

export type AccidentRecord = {
  id: number
  reference: string
  swimmerId: number
  swimmerName: string
  occurredAt: string
  location: string | null
  description: string
  treatment: string | null
  parentSignedAt: string | null
  staffSignedAt: string | null
  pdfPath: string
}

export type SignedDocument = {
  swimmerId: number
  swimmerName: string
  kind: string
  title: string
  reference: string
  signatureName: string
  signedAt: string
  pdfPath: string
}

export type Records = { accidents: AccidentRecord[]; documents: SignedDocument[] }

export type FormField = {
  id: string
  label: string
  type: 'text' | 'date' | 'textarea' | 'yesno' | 'agree'
  required?: boolean
}

export type FormDefinition = {
  kind: string
  title: string
  summary: string
  sections: { title: string; fields: FormField[] }[]
}

export type FormStatus = { answers: Record<string, string>; signatureName: string; signedAt: string }

export type FormSwimmer = {
  id: number
  firstName: string
  lastName: string
  dateOfBirth: string | null
  documents: Record<string, FormStatus>
}

export type Forms = { forms: FormDefinition[]; swimmers: FormSwimmer[] }

/** Forms each swimmer still needs, in the order the school lists them. */
export function outstandingForms(data: Forms | undefined) {
  if (!data) return []
  return data.swimmers.flatMap((s) =>
    data.forms.filter((f) => !s.documents[f.kind]).map((f) => ({ swimmer: s, form: f })),
  )
}

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
