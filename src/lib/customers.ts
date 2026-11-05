import type { Client, Customer, Doc } from './types'
import { uid } from './format'

export const blankCustomer = (): Customer => ({ id: uid(), name: '', email: '', phone: '', address: '', note: '', createdAt: Date.now() })

export const customerFromClient = (c: Client): Customer => ({ ...blankCustomer(), name: c.name.trim(), email: c.email.trim(), phone: c.phone.trim(), address: c.address.trim() })

export const clientFromCustomer = (c: Customer): Client => ({ name: c.name, email: c.email, phone: c.phone, address: c.address })

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** The saved customer a client on a document matches, by name. */
export function findCustomer(list: Customer[], name: string): Customer | undefined {
  const n = norm(name)
  return n ? list.find((c) => norm(c.name) === n) : undefined
}

/** Documents made for this customer: linked by id, or by the same name. */
export function docsFor(c: Customer, docs: Doc[]): Doc[] {
  const n = norm(c.name)
  return docs.filter((d) => d.customerId === c.id || (!!n && norm(d.client.name) === n))
}

export function initialsOfName(name: string): string {
  const w = name.trim().split(/\s+/).filter(Boolean)
  if (!w.length) return '?'
  return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
}

const EMAIL = /[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/
const PHONE = /\+?\d[\d\s()-]{6,}\d/

/**
 * Reads a pasted list or a CSV file: one customer per line, with a name and any of phone, email and address.
 * A header row (name, phone, email, address) is used when present, otherwise each line is read by what it looks like.
 */
export function parseCustomers(text: string): Customer[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return []
  const split = (l: string) => l.split(/\t|,|;/).map((x) => x.trim().replace(/^"|"$/g, ''))
  const head = split(lines[0]).map((h) => h.toLowerCase())
  const hasHead = head.some((h) => /^(name|full name|customer|client)$/.test(h))
  const col = (re: RegExp) => head.findIndex((h) => re.test(h))
  const out: Customer[] = []
  for (const line of hasHead ? lines.slice(1) : lines) {
    const cells = split(line)
    const c = blankCustomer()
    if (hasHead) {
      const get = (re: RegExp) => {
        const i = col(re)
        return i >= 0 ? cells[i] ?? '' : ''
      }
      c.name = get(/name|customer|client/)
      c.phone = get(/phone|mobile|whatsapp|tel/)
      c.email = get(/mail/)
      c.address = get(/address|location/)
    } else {
      for (const cell of cells) {
        if (!c.email && EMAIL.test(cell)) c.email = cell.match(EMAIL)![0]
        else if (!c.phone && PHONE.test(cell)) c.phone = cell.match(PHONE)![0].trim()
        else if (!c.name) c.name = cell
        else if (!c.address) c.address = cell
      }
    }
    if (c.name) out.push(c)
  }
  return out
}

/** Drops people who are already saved (same name) or repeated in the list. */
export function onlyNew(list: Customer[], existing: Customer[]): Customer[] {
  const seen = new Set(existing.map((c) => norm(c.name)))
  return list.filter((c) => {
    const n = norm(c.name)
    if (!n || seen.has(n)) return false
    seen.add(n)
    return true
  })
}

type ContactsApi = { select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[]; email?: string[] }[]> }

/** Phone contacts can be picked on Android phones in Chrome. Other phones and laptops do not offer it yet. */
export const canPickContacts = () => typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window

export async function pickContacts(): Promise<Customer[]> {
  const api = (navigator as unknown as { contacts: ContactsApi }).contacts
  const picked = await api.select(['name', 'tel', 'email'], { multiple: true })
  return picked
    .map((p) => ({ ...blankCustomer(), name: (p.name?.[0] ?? '').trim(), phone: (p.tel?.[0] ?? '').trim(), email: (p.email?.[0] ?? '').trim() }))
    .filter((c) => c.name)
}
