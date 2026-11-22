const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']

export const dayName = (day: number) => DAYS[day] ?? ''

export function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(cents / 100)
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${suffix}`
}

function parse(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
}

function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${s}`
}

/** "2nd Jul" */
export function shortDate(value: string) {
  const d = parse(value)
  return `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]}`
}

/** "25th June 2026" */
export function longDate(value: string) {
  const d = parse(value)
  return `${ordinal(d.getDate())} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`
}

export function relativeDate(value: string) {
  const d = parse(value)
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days < 1) return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
  if (days < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return shortDate(value)
}
