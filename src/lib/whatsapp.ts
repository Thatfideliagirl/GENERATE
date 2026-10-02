import type { Doc, Profile } from './types'
import { DOC_LABEL } from './constants'
import { balanceOf, totals } from './calc'
import { fmtDate, money } from './format'
import { resolveText } from './text'

export type ReminderTone = 'friendly' | 'firm' | 'final'

/** Turns a Nigerian number like 0803 123 4567 into the international form WhatsApp needs. */
export function waLink(phone: string, message: string): string {
  let digits = (phone || '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '234' + digits.slice(1)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function sendMessage(doc: Doc, profile: Profile): string {
  const name = doc.client.name || ''
  if (doc.type === 'contract') {
    return `Hello ${name}, here is the ${resolveText(doc.title, doc, profile)} from ${profile.name}. Please review and sign.`
  }
  const due = doc.type === 'invoice' && doc.dueDate ? `, due ${fmtDate(doc.dueDate)}` : ''
  return `Hello ${name}, ${DOC_LABEL[doc.type]} ${doc.number} from ${profile.name} for ${money(totals(doc).total, doc.currency)}${due}. Thank you.`
}

export function reminderMessage(doc: Doc, profile: Profile, tone: ReminderTone): string {
  const name = doc.client.name || ''
  const amount = money(balanceOf(doc), doc.currency)
  const ref = `${DOC_LABEL[doc.type].toLowerCase()} ${doc.number}`
  const due = doc.dueDate ? fmtDate(doc.dueDate) : ''
  if (tone === 'friendly') {
    return `Hello ${name}, a quick reminder that ${ref} from ${profile.name} for ${amount}${due ? ' is due on ' + due : ' is waiting for payment'}. Please let me know once it is done. Thank you.`
  }
  if (tone === 'firm') {
    return `Hello ${name}, ${ref} from ${profile.name} for ${amount} is now overdue${due ? ' (due ' + due + ')' : ''}. Please make the payment today and send me the transfer receipt here.`
  }
  return `Hello ${name}, this is a final reminder about ${ref} from ${profile.name} for ${amount}${due ? ', due on ' + due : ''}. Please pay within 48 hours or contact me today so we can agree on a plan.`
}
