import type { Customer, Profile } from './types'

export interface ReadyMessage {
  id: string
  title: string
  hint: string
  text: string
}

/** A greeting that suits the time of year. */
function seasonal(first: string, biz: string, now = new Date()): { title: string; text: string } {
  const m = now.getMonth()
  const d = now.getDate()
  if (m === 11 && d >= 10) return { title: 'Christmas greeting', text: `Merry Christmas, ${first}! Thank you for being with ${biz} this year. Wishing you and your family joy, peace and plenty.` }
  if (m === 0 && d <= 10) return { title: 'New Year greeting', text: `Happy New Year, ${first}! Thank you for your support last year. We cannot wait to serve you again this year. From all of us at ${biz}.` }
  if (m === 9 && d <= 3) return { title: 'Independence Day greeting', text: `Happy Independence Day, ${first}! Proudly Nigerian, proudly serving you. From all of us at ${biz}.` }
  return { title: 'Warm greeting', text: `Hello ${first}, just checking in to say thank you for your support. We hope you are well, and we are here whenever you need us. From all of us at ${biz}.` }
}

/** Ready messages for one customer, filled with their name and the business's details. They can be changed before sending. */
export function readyMessages(c: Customer, profile: Profile, owed: string): ReadyMessage[] {
  const first = c.name.trim().split(' ')[0] || 'there'
  const biz = profile.name
  const bank = profile.bank
  const fest = seasonal(first, biz)
  const list: ReadyMessage[] = [
    {
      id: 'thanks',
      title: 'Say thank you',
      hint: 'After a sale or a payment',
      text: `Hello ${first}, thank you so much for choosing ${biz}. It was a joy working with you, and we hope to see you again soon.`,
    },
  ]
  if (owed) {
    list.push({
      id: 'owe',
      title: 'Remind them what they owe',
      hint: `${owed} still to pay`,
      text: `Hello ${first}, I hope you are well. A gentle reminder that ${owed} is still outstanding with ${biz}. Please let me know once you have paid. Thank you.`,
    })
  }
  list.push(
    {
      id: 'new',
      title: 'New stock or a sale',
      hint: 'Tell them what is new',
      text: `Hello ${first}, good news from ${biz}! We have something new for you this week. Reply to this message and I will send you the details and prices.`,
    },
    { id: 'fest', title: fest.title, hint: 'Suits the time of year', text: fest.text },
  )
  if (bank?.acct) {
    list.push({
      id: 'pay',
      title: 'Send your payment details',
      hint: `${bank.bank || 'Your bank'}, ${bank.acct}`,
      text: `Hello ${first}, here are the payment details for ${biz}:\n\nBank: ${bank.bank}\nAccount number: ${bank.acct}\nAccount name: ${bank.name || biz}\n\nPlease send the proof of payment here once done. Thank you.`,
    })
  }
  list.push({ id: 'hello', title: 'Just say hello', hint: 'Write your own message', text: `Hello ${first}, ` })
  return list
}
