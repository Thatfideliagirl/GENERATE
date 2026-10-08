export const esc = (v: unknown) => String(v ?? '')

export function money(n: unknown, currency: string): string {
  const v = Number(n) || 0
  return (
    currency +
    v.toLocaleString('en-NG', {
      minimumFractionDigits: v % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    })
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const today = () => toISO(new Date())

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function fmtDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso + 'T00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function longToday(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export const isHex = (v: string | undefined) => /^#[0-9a-f]{6}$/i.test(v || '')

export function uid(): string {
  return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
