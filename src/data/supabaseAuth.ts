import type { SupabaseClient, Session as SbSession } from '@supabase/supabase-js'
import { AuthError } from './auth'
import type { Account, AuthService, Session } from './auth'

/** Turns what Supabase says into a sentence a person can act on. */
function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'That email and password do not match. Check them and try again.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'There is already an account with that email. Try signing in.'
  if (m.includes('email not confirmed')) return 'Open the link we emailed you to confirm your account, then sign in.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries. Wait a few minutes and try again.'
  if (m.includes('password') && m.includes('characters')) return 'Choose a password of at least 8 characters.'
  if (m.includes('same password')) return 'Choose a password you have not used before.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Could not reach the server. Check your connection and try again.'
  return 'Something went wrong. Please try again.'
}

const back = (hashRoute: string) => `${window.location.origin}${window.location.pathname}#${hashRoute}`

/** Real accounts on Supabase. The owner is whoever is listed in the app_admins table. */
export function createSupabaseAuth(sb: SupabaseClient): AuthService {
  const toSession = async (s: SbSession): Promise<Session> => {
    const { data } = await sb.rpc('is_admin')
    return { userId: s.user.id, email: s.user.email ?? '', role: data === true ? 'admin' : 'user' }
  }

  return {
    demo: false,

    async getSession() {
      const { data } = await sb.auth.getSession()
      return data.session ? toSession(data.session) : null
    },

    subscribe(onChange) {
      const { data } = sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') return onChange(null)
        if (!session || !['SIGNED_IN', 'PASSWORD_RECOVERY', 'USER_UPDATED'].includes(event)) return
        // Asking the database inside this callback can stall it, so wait a beat.
        setTimeout(() => toSession(session).then(onChange, () => undefined), 0)
      })
      return () => data.subscription.unsubscribe()
    },

    async getAccount(userId) {
      const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (!data) return null
      return {
        id: data.id,
        name: data.full_name,
        business: data.business_name,
        email: data.email,
        whatsapp: '',
        bizType: data.business_type,
        trade: data.trade,
        createdAt: new Date(data.created_at).getTime(),
      }
    },

    async signUp(input) {
      const { data, error } = await sb.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: { full_name: input.name.trim(), business_name: input.business.trim(), business_type: input.bizType, trade: input.trade },
          emailRedirectTo: back('/app'),
        },
      })
      if (error) throw new AuthError(friendly(error.message))
      // When the email already has an account Supabase answers with no error and no identities.
      if (data.user && data.user.identities && data.user.identities.length === 0) throw new AuthError(friendly('already registered'))
      return data.session ? toSession(data.session) : null
    },

    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
      if (error || !data.session) throw new AuthError(friendly(error?.message ?? 'invalid login'))
      return toSession(data.session)
    },

    async signOut() {
      await sb.auth.signOut()
    },

    async sendReset(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: back('/reset') })
      if (error && /rate limit|too many/i.test(error.message)) throw new AuthError(friendly(error.message))
    },

    async updatePassword(password) {
      const { error } = await sb.auth.updateUser({ password })
      if (error) throw new AuthError(friendly(error.message))
    },

    async listSignups() {
      const s = await this.getSession()
      if (!s || s.role !== 'admin') throw new AuthError('Only the owner can see this.')
      const { data, error } = await sb.from('profiles').select('id, full_name, business_name, business_type, trade, email, created_at').order('created_at', { ascending: false }).limit(5000)
      if (error) throw new AuthError(friendly(error.message))
      return (data ?? []).map(
        (r): Account => ({
          id: r.id,
          name: r.full_name,
          business: r.business_name,
          email: r.email,
          whatsapp: '',
          bizType: r.business_type,
          trade: r.trade,
          createdAt: new Date(r.created_at).getTime(),
        }),
      )
    },
  }
}
