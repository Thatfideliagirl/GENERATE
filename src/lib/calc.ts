import type { Doc, DocStatus } from './types'
import { today } from './format'

const n = (v: unknown) => Number(v) || 0

export function totals(d: Doc) {
  const sub = d.items.reduce((a, i) => a + n(i.q) * n(i.p), 0)
  const disc = Math.min(n(d.discount), sub)
  const taxable = sub - disc
  const rate = n(d.vatRate)
  const vat = d.vat ? (taxable * rate) / 100 : 0
  return { sub, disc, vat, rate, total: taxable + vat }
}

export const paymentsSum = (d: Doc) => d.payments.reduce((a, p) => a + n(p.amt), 0)

export function paidOf(d: Doc): number {
  const t = totals(d).total
  return d.status === 'paid' ? t : Math.min(paymentsSum(d), t)
}

export const balanceOf = (d: Doc) => Math.max(0, totals(d).total - paidOf(d))

/** The status people see. It is worked out from payments and due dates. */
export function statusOf(d: Doc): DocStatus {
  if (d.type === 'receipt') return 'paid'
  if (d.type !== 'invoice') return d.status
  const total = totals(d).total
  const paid = paidOf(d)
  if (d.status === 'paid' || (total > 0 && paid >= total)) return 'paid'
  const late = !!d.dueDate && d.dueDate < today() && d.status !== 'draft'
  if (paid > 0) return late ? 'overdue' : 'part'
  if (d.status === 'sent' && late) return 'overdue'
  return d.status
}

export function summarise(docs: Doc[]) {
  const waiting: Record<string, number> = {}
  const received: Record<string, number> = {}
  let overdue = 0
  for (const d of docs) {
    const c = d.currency
    if (d.type === 'invoice') {
      const st = statusOf(d)
      const paid = paidOf(d)
      const bal = balanceOf(d)
      if (paid > 0) received[c] = (received[c] || 0) + paid
      if (bal > 0 && (st === 'sent' || st === 'part' || st === 'overdue')) {
        waiting[c] = (waiting[c] || 0) + bal
      }
      if (st === 'overdue') overdue++
    } else if (d.type === 'receipt' && !d.fromId) {
      received[c] = (received[c] || 0) + totals(d).total
    }
  }
  return { waiting, received, overdue, count: docs.length }
}
