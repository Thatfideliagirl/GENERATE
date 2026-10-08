import type { Doc, Profile, Style } from '../../lib/types'
import { newDoc, sampleDocAndProfile } from '../../lib/factory'
import { addDays } from '../../lib/format'

/** A handwritten looking signature, used as the picture on sample documents. */
const SIGNATURE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60"><g fill="none" stroke="#14251F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M6 40 C14 8 28 8 26 30 C25 46 14 50 22 38 C30 24 42 24 40 38 C39 46 48 44 54 32"/>' +
  '<path d="M54 32 C62 22 70 24 68 36 C74 28 84 26 90 34 C98 44 112 20 124 26 C134 32 140 40 166 28"/>' +
  '<path d="M36 50 C80 54 130 50 176 46"/></g></svg>'
export const SIGNATURE = 'data:image/svg+xml,' + encodeURIComponent(SIGNATURE_SVG)

export type Sample = { doc: Doc; profile: Profile }

const withSignature = (s: Sample): Sample => {
  s.profile.signature = SIGNATURE
  s.doc.useSig = true
  return s
}

/** The same documents the app makes, filled with example details. */
export function invoiceSample(style: Style, business = 'Amaka Obi Studio', client = 'Tunde Bello'): Sample {
  const s = sampleDocAndProfile(style)
  s.profile.name = business
  s.profile.bank.name = business
  s.doc.client.name = client
  return withSignature(s)
}

export function receiptSample(style: Style, business = 'Amaka Obi Studio', client = 'Tunde Bello'): Sample {
  const s = invoiceSample(style, business, client)
  s.doc.type = 'receipt'
  s.doc.status = 'paid'
  s.doc.dueDate = ''
  s.doc.notes = 'Thank you for your payment.'
  return s
}

const CONTRACT_BODY = `# The work
{{business}} will design a logo and a brand guide for {{client}}.

# Payment
{{client}} will pay {{fee}}. Half is paid before work starts and half on delivery.

# Changes
Two rounds of changes are included. More rounds are priced separately.`

export function contractSample(style: Style, business = 'Amaka Obi Studio', client = 'Tunde Bello'): Sample {
  const { profile } = invoiceSample(style, business, client)
  const doc = newDoc('contract', profile, '0007', { title: 'Service agreement', body: CONTRACT_BODY })
  doc.client.name = client
  doc.fee = '125000'
  doc.style = style
  doc.start = addDays(doc.issueDate, 3)
  doc.end = addDays(doc.issueDate, 30)
  doc.useSig = true
  return { doc, profile }
}
