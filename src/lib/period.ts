/** Time filters shared by the home screen and the document pages. */
export type Period = 'today' | 'week' | 'month' | 'year' | 'all'

export const PERIODS: [Period, string][] = [
  ['today', 'Today'],
  ['week', 'This week'],
  ['month', 'This month'],
  ['year', 'This year'],
  ['all', 'All time'],
]

export const isoDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

/** The first day of the period as yyyy-mm-dd. Weeks start on Monday. Compare with >= on dates in the same form. */
export function startOf(p: Period): string {
  const d = new Date()
  if (p === 'all') return '0000-00-00'
  if (p === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  if (p === 'month') d.setDate(1)
  if (p === 'year') d.setMonth(0, 1)
  return isoDay(d)
}

export const periodName = (p: Period) => PERIODS.find((x) => x[0] === p)![1].toLowerCase()
