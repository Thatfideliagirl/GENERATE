import type { Doc, Profile } from './types'
import { balanceOf, paidOf, totals } from './calc'
import { resolveText } from './text'
import { appLink, pack } from './share'

/** What a client sees on the pay page. Only what they need: no other documents, nothing private. */
export interface PayData {
  v: 1
  id: string
  biz: string
  phone: string
  n: string
  cl: string
  cur: string
  total: number
  paid: number
  bal: number
  due: string
  bank: { bank: string; acct: string; name: string }
  items: [string, number][]
}

export async function payLink(doc: Doc, profile: Profile): Promise<string> {
  const t = totals(doc)
  const data: PayData = {
    v: 1,
    id: doc.id,
    biz: profile.name,
    phone: profile.phone,
    n: doc.number,
    cl: doc.client.name,
    cur: doc.currency,
    total: t.total,
    paid: paidOf(doc),
    bal: balanceOf(doc),
    due: doc.dueDate,
    bank: profile.bank,
    items: doc.items.filter((i) => i.d || i.p).slice(0, 8).map((i) => [i.d, (Number(i.q) || 1) * (Number(i.p) || 0)]),
  }
  return appLink('/pay/' + (await pack(data)))
}

/** The contract as the client will read and sign it, with the wording already filled in. */
export interface ContractData {
  v: 1
  id: string
  biz: string
  owner: string
  phone: string
  ownerSigned: boolean
  n: string
  title: string
  body: string
  date: string
  cl: string
}

export async function signLink(doc: Doc, profile: Profile): Promise<string> {
  const data: ContractData = {
    v: 1,
    id: doc.id,
    biz: profile.name,
    owner: profile.owner || profile.name,
    phone: profile.phone,
    ownerSigned: !!(doc.useSig && profile.signature),
    n: doc.number,
    title: resolveText(doc.title, doc, profile),
    body: resolveText(doc.body, doc, profile),
    date: doc.issueDate,
    cl: doc.client.name,
  }
  return appLink('/c/' + (await pack(data)))
}

/** What comes back to the business after the client signs. */
export interface SignedBack {
  v: 1
  id: string
  name: string
  /** The signature, when the client signed. */
  sig?: string
  /** What the client wants changed, when they did not sign. */
  comment?: string
  at: number
}
