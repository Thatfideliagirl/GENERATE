import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { auth } from './authService'
import type { Session, SignUpInput } from './auth'

interface AuthCtx {
  ready: boolean
  session: Session | null
  /** beforeSession runs once the account exists and before the app switches to it, so first data is saved in time. */
  signUp: (input: SignUpInput, beforeSession?: (s: Session) => Promise<void>) => Promise<Session | null>
  signIn: (email: string, password: string) => Promise<Session>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    auth.getSession().then((s) => {
      setSession(s)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    return auth.subscribe?.((s) => setSession((cur) => (cur?.userId === s?.userId && cur?.role === s?.role ? cur : s)))
  }, [])

  const signUp = useCallback(async (input: SignUpInput, beforeSession?: (s: Session) => Promise<void>) => {
    const s = await auth.signUp(input)
    // null means the person must open the link we emailed before the account is active.
    if (!s) return null
    if (beforeSession) await beforeSession(s)
    setSession(s)
    return s
  }, [])
  const signIn = useCallback(async (email: string, password: string) => {
    const s = await auth.signIn(email, password)
    setSession(s)
    return s
  }, [])
  const signOut = useCallback(async () => {
    await auth.signOut()
    setSession(null)
  }, [])

  const value = useMemo(() => ({ ready, session, signUp, signIn, signOut }), [ready, session, signUp, signIn, signOut])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}
