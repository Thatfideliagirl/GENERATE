import type { Doc, Profile } from './types'
import { DOC_LABEL } from './constants'
import { balanceOf, statusOf } from './calc'
import { fmtDate, money, today } from './format'

export type NoteKind = 'late' | 'soon' | 'draft' | 'setup' | 'welcome' | 'ask'
export interface Note {
  id: string
  kind: NoteKind
  title: string
  text: string
  to: string
  /** Higher shows first. */
  weight: number
}

const days = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 864e5)

/**
 * Notifications worked out from the person's own documents and profile, so they need no server:
 * late invoices, invoices due in the next three days, drafts left unsent, and missing setup details.
 */
export function notesFor(docs: Doc[], profile: Profile): Note[] {
  const t = today()
  const out: Note[] = []
  for (const d of docs) {
    const who = d.client.name || 'A client'
    const st = statusOf(d)
    if (d.type === 'invoice' && st === 'overdue') {
      const late = Math.max(1, days(t, d.dueDate))
      out.push({
        id: `late:${d.id}:${d.dueDate}`,
        kind: 'late',
        title: `${who} is late`,
        text: `${DOC_LABEL[d.type]} ${d.number} for ${money(balanceOf(d), d.currency)} was due ${late === 1 ? 'yesterday' : late + ' days ago'}. Send a reminder.`,
        to: `/app/doc/${d.id}`,
        weight: 300 + late,
      })
    } else if (d.type === 'invoice' && (st === 'sent' || st === 'part') && d.dueDate) {
      const left = days(d.dueDate, t)
      if (left >= 0 && left <= 3)
        out.push({
          id: `soon:${d.id}:${d.dueDate}`,
          kind: 'soon',
          title: `${who} pays ${left === 0 ? 'today' : left === 1 ? 'tomorrow' : 'in ' + left + ' days'}`,
          text: `${DOC_LABEL[d.type]} ${d.number}, ${money(balanceOf(d), d.currency)}, due ${fmtDate(d.dueDate)}.`,
          to: `/app/doc/${d.id}`,
          weight: 200 - left,
        })
    }
    if (d.type === 'contract' && d.clientComment && st !== 'signed') {
      out.push({
        id: `ask:${d.id}:${d.clientComment.at}`,
        kind: 'ask',
        title: `${d.clientComment.name || who} asked for a change`,
        text: `"${d.clientComment.text.slice(0, 90)}" on contract ${d.number}.`,
        to: `/app/doc/${d.id}`,
        weight: 400,
      })
    }
    if (st === 'draft' && d.type !== 'receipt') {
      const age = days(t, new Date(d.updatedAt).toISOString().slice(0, 10))
      if (age >= 2)
        out.push({
          id: `draft:${d.id}`,
          kind: 'draft',
          title: `${DOC_LABEL[d.type]} ${d.number} is still a draft`,
          text: `For ${who}. Open it and send it when you are ready.`,
          to: `/app/doc/${d.id}`,
          weight: 100,
        })
    }
  }
  if (!profile.bank.acct)
    out.push({ id: 'setup:bank', kind: 'setup', title: 'Add your bank details', text: 'They print on your invoices so clients know where to pay.', to: '/app/profile/edit', weight: 50 })
  if (!profile.signature)
    out.push({ id: 'setup:sig', kind: 'setup', title: 'Add your signature', text: 'Draw, type or upload it once and it goes on every document.', to: '/app/profile/edit', weight: 40 })
  if (!docs.length)
    out.push({ id: 'welcome', kind: 'welcome', title: 'Welcome to Generate', text: 'Make your first invoice. Your name and details are already on it.', to: '/app/new/invoice', weight: 10 })
  return out.sort((a, b) => b.weight - a.weight)
}

const KEY = 'generate.seen.'
export function seenSet(userId: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY + userId) || '[]'))
  } catch {
    return new Set()
  }
}
export function markSeen(userId: string, ids: string[]) {
  try {
    const all = [...new Set([...seenSet(userId), ...ids])].slice(-500)
    localStorage.setItem(KEY + userId, JSON.stringify(all))
  } catch {
    /* seen again next visit */
  }
}
