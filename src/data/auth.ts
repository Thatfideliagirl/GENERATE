import { ADMIN_EMAILS } from '../lib/constants'

/**
 * Accounts and sign in.
 *
 * Today this is a demo that keeps accounts on the person's own device (localAuth), so every screen can be built and tried.
 * When Supabase is ready, write supabaseAuth with the same functions, then change the single line at the bottom of this file.
 *
 * Privacy rule for the owner page: listSignups() returns who signed up. It must never return documents.
 */
export interface SignUpInput {
  name: string
  business: string
  email: string
  whatsapp: string
  bizType: string
  trade: string
  password: string
}

export interface Account {
  id: string
  name: string
  business: string
  email: string
  whatsapp: string
  bizType: string
  trade: string
  createdAt: number
}

export interface Session {
  userId: string
  email: string
  role: 'user' | 'admin'
}

export interface AuthService {
  /** True when accounts live only on this device. The owner page tells the truth about it. */
  demo: boolean
  getSession(): Promise<Session | null>
  getAccount(userId: string): Promise<Account | null>
  signUp(input: SignUpInput): Promise<Session>
  signIn(email: string, password: string): Promise<Session>
  signOut(): Promise<void>
  sendReset(email: string): Promise<void>
  /** Owner only. Names, business, type, trade, date and email. No documents. */
  listSignups(): Promise<Account[]>
}

export class AuthError extends Error {}

const ACCOUNTS = 'generate.accounts.v1'
const SESSION = 'generate.session.v1'

interface Stored extends Account {
  hash: string
}

const read = (): Stored[] => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS) || '[]')
  } catch {
    return []
  }
}
const write = (list: Stored[]) => localStorage.setItem(ACCOUNTS, JSON.stringify(list))

async function hash(text: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('generate:' + text))
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return btoa(unescape(encodeURIComponent(text)))
  }
}

const roleOf = (email: string): Session['role'] => (ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user')
const toSession = (a: Account): Session => ({ userId: a.id, email: a.email, role: roleOf(a.email) })
const strip = ({ hash: _h, ...a }: Stored): Account => a

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
/** Accepts 0803 123 4567, +234 803 123 4567 and 234803... */
export const isPhone = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.length >= 10 && d.length <= 15
}

export const localAuth: AuthService = {
  demo: true,
  async getSession() {
    try {
      const id = localStorage.getItem(SESSION)
      const a = id ? read().find((x) => x.id === id) : null
      return a ? toSession(a) : null
    } catch {
      return null
    }
  },
  async getAccount(userId) {
    const a = read().find((x) => x.id === userId)
    return a ? strip(a) : null
  },
  async signUp(input) {
    const email = input.email.trim().toLowerCase()
    const list = read()
    if (list.some((a) => a.email === email)) throw new AuthError('There is already an account with that email. Try signing in.')
    const account: Stored = {
      id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: input.name.trim(),
      business: input.business.trim(),
      email,
      whatsapp: input.whatsapp.trim(),
      bizType: input.bizType,
      trade: input.trade,
      createdAt: Date.now(),
      hash: await hash(input.password),
    }
    write([...list, account])
    localStorage.setItem(SESSION, account.id)
    return toSession(account)
  },
  async signIn(emailIn, password) {
    const email = emailIn.trim().toLowerCase()
    const a = read().find((x) => x.email === email)
    if (!a || a.hash !== (await hash(password))) throw new AuthError('That email and password do not match. Check them and try again.')
    localStorage.setItem(SESSION, a.id)
    return toSession(a)
  },
  async signOut() {
    localStorage.removeItem(SESSION)
  },
  async sendReset(email) {
    // Nothing can be emailed from a demo. The real service sends the link.
    await new Promise((r) => setTimeout(r, 400))
    void email
  },
  async listSignups() {
    const s = await this.getSession()
    if (!s || s.role !== 'admin') throw new AuthError('Only the owner can see this.')
    return read()
      .map(strip)
      .sort((a, b) => b.createdAt - a.createdAt)
  },
}

// To switch to Supabase later, import your new service here and export it instead.
export const auth: AuthService = localAuth
