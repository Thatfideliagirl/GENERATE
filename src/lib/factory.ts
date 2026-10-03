import type { AppData, Doc, DocType, Profile, Style } from './types'
import { addDays, clone, today, uid } from './format'

export const defaultStyle = (): Style => ({
  layout: 'classic',
  font: 'editorial',
  accent: 'emerald',
  text: '#14251F',
  paper: 'white',
})

export const defaultProfile = (): Profile => ({
  name: '',
  owner: '',
  email: '',
  phone: '',
  address: '',
  currency: '₦',
  vat: false,
  vatRate: 7.5,
  bank: { bank: '', acct: '', name: '' },
  logo: '',
  signature: '',
  socials: { instagram: '', twitter: '', tiktok: '' },
  bizType: 'solo',
  trade: 'other',
  style: defaultStyle(),
})

export const emptyData = (): AppData => ({
  profile: null,
  docs: [],
  templates: [],
  seq: { invoice: 0, receipt: 0, contract: 0 },
})

export const nextNumber = (data: AppData, type: DocType) =>
  String((data.seq[type] || 0) + 1).padStart(4, '0')

export function newDoc(
  type: DocType,
  profile: Profile,
  number: string,
  template?: { title: string; body: string },
): Doc {
  const now = Date.now()
  const doc: Doc = {
    id: uid(),
    type,
    number,
    status: type === 'receipt' ? 'paid' : 'draft',
    issueDate: today(),
    dueDate: type === 'invoice' ? addDays(today(), 7) : '',
    client: { name: '', email: '', phone: '', address: '' },
    items: type === 'contract' ? [] : [{ d: '', q: '1', p: '' }],
    discount: '',
    vat: profile.vat,
    vatRate: profile.vatRate,
    notes: '',
    method: 'Bank transfer',
    useSig: !!profile.signature,
    showSocials: hasSocials(profile),
    style: clone(profile.style),
    currency: profile.currency,
    payments: [],
    createdAt: now,
    updatedAt: now,
  }
  if (type === 'contract') {
    doc.title = template?.title ?? 'Agreement'
    doc.body = template?.body ?? ''
    doc.fee = ''
    doc.start = ''
    doc.end = ''
  }
  return doc
}

/** Sample document used by the landing page demo. */
export function sampleDocAndProfile(style: Style): { doc: Doc; profile: Profile } {
  const profile: Profile = {
    ...defaultProfile(),
    name: 'Your brand',
    owner: 'Your name',
    email: 'hello@yourbrand.com',
    phone: '0803 000 0000',
    address: 'Lagos, Nigeria',
    bank: { bank: 'Your bank', acct: '0123456789', name: 'Your brand' },
    style,
  }
  const doc: Doc = {
    id: 'sample',
    type: 'invoice',
    number: '0042',
    status: 'sent',
    issueDate: today(),
    dueDate: addDays(today(), 7),
    client: { name: 'Amaka Obi', email: '', phone: '', address: '' },
    items: [
      { d: 'Logo design', q: '1', p: '80000' },
      { d: 'Brand guide', q: '1', p: '45000' },
    ],
    discount: '',
    vat: false,
    vatRate: 7.5,
    notes: 'Thank you for your business.',
    method: 'Bank transfer',
    useSig: false,
    style,
    currency: '₦',
    payments: [],
    createdAt: 0,
    updatedAt: 0,
  }
  return { doc, profile }
}

/** True when the profile has at least one social media handle. */
export const hasSocials = (p: Profile): boolean => !!p.socials && Object.values(p.socials).some((v) => v.trim())
