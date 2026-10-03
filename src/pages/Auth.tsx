import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell, AuthField } from '../components/AuthShell'
import { ProfileForm } from '../components/ProfileForm'
import type { Profile } from '../lib/types'
import { auth, AuthError, isEmail, isPhone } from '../data/auth'
import { useAuth } from '../data/session'
import { useStore } from '../data/store'
import { repo } from '../data/repo'
import { defaultProfile, emptyData } from '../lib/factory'


function useAlreadyIn() {
  const { session } = useAuth()
  const { data } = useStore()
  return session ? (data.profile ? '/app' : '/setup') : null
}

export function SignUp() {
  const nav = useNavigate()
  const { signUp } = useAuth()
  const goto = useAlreadyIn()
  const [profile, setProfile] = useState<Profile>(defaultProfile())
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState('')
  const errRef = useRef<HTMLParagraphElement>(null)
  if (goto && !busy) return <Navigate to={goto} replace />

  const change = (patch: Partial<Profile>) => {
    setProfile((p) => ({ ...p, ...patch }))
    setFormErr('')
  }

  const fail = (msg: string) => {
    setFormErr(msg)
    setBusy(false)
    setTimeout(() => errRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const p = { ...profile, name: profile.name.trim(), owner: profile.owner.trim(), email: profile.email.trim(), phone: profile.phone.trim() }
    if (!p.name) return fail('Enter your business name.')
    if (!p.owner) return fail('Enter your name.')
    if (!isEmail(p.email)) return fail('Enter a valid email, like name@example.com.')
    if (!isPhone(p.phone)) return fail('Enter your phone or WhatsApp number, for example 0803 123 4567.')
    if (p.bizType === 'other' && !(p.bizOther ?? '').trim()) return fail('Tell us what describes you, or pick one from the list.')
    if (p.trade === 'other' && !(p.tradeOther ?? '').trim()) return fail('Tell us what you sell or do, or pick one from the list.')
    if (password.length < 8) return fail('Choose a password of at least 8 characters.')
    setBusy(true)
    try {
      await signUp(
        {
          name: p.owner,
          business: p.name,
          email: p.email,
          whatsapp: p.phone,
          bizType: p.bizType === 'other' ? (p.bizOther ?? '').trim() : p.bizType,
          trade: p.trade === 'other' ? (p.tradeOther ?? '').trim() : p.trade,
          password,
        },
        (s) => repo.save({ ...emptyData(), profile: p }, s.userId),
      )
      nav('/app', { replace: true })
    } catch (err) {
      fail(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <AuthShell
      wide
      title="Set up your business"
      lead="Add your details once. Every document you make carries your name, your logo and your signature."
      foot={
        <>
          Already have an account? <Link to="/signin">Sign in</Link>
        </>
      }
    >
      <form className="auth-form auth-long" onSubmit={submit} noValidate>
        <ProfileForm profile={profile} onChange={change} showLook={false} />

        <div className="sec">
          <h3 className="s">Choose a password</h3>
          <div className="auth-f pw">
            <label htmlFor="su-pw">Password</label>
            <div className="auth-pw">
              <input id="su-pw" type={show ? 'text' : 'password'} value={password} onChange={(e) => (setPassword(e.target.value), setFormErr(''))} autoComplete="new-password" aria-describedby="su-pw-h" />
              <button type="button" onClick={() => setShow((x) => !x)} aria-pressed={show}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
            <span className="auth-h" id="su-pw-h">
              At least 8 characters. You will use it with your email to sign in.
            </span>
          </div>
        </div>

        {formErr && (
          <p className="auth-formerr" role="alert" ref={errRef}>
            {formErr}
          </p>
        )}
        <button className="lp-btn brass auth-submit" type="submit" disabled={busy}>
          {busy ? 'Creating your account' : 'Create my account'}
        </button>
        <p className="auth-fine">
          By creating an account you agree to how we handle your details in the <Link to="/privacy">privacy page</Link>. You can choose your default look later, from your profile.
        </p>
        {auth.demo && <p className="auth-demo">Demo mode: accounts are kept on this device until the online service is connected.</p>}
      </form>
    </AuthShell>
  )
}

export function SignIn() {
  const nav = useNavigate()
  const { signIn } = useAuth()
  const goto = useAlreadyIn()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (goto && !busy) return <Navigate to={goto} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isEmail(email) || !pw) return setErr('Enter your email and password.')
    setBusy(true)
    try {
      const s = await signIn(email, pw)
      nav(s.role === 'admin' ? '/admin' : '/app', { replace: true })
    } catch (e2) {
      setErr(e2 instanceof AuthError ? e2.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      lead="Sign in to open your invoices, receipts and contracts."
      foot={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthField id="si-email" label="Email" type="email" value={email} onChange={(e) => (setEmail(e.target.value), setErr(''))} autoComplete="email" inputMode="email" placeholder="you@example.com" />
        <div className="auth-f pw">
          <label htmlFor="si-pw">Password</label>
          <div className="auth-pw">
            <input id="si-pw" type={show ? 'text' : 'password'} value={pw} onChange={(e) => (setPw(e.target.value), setErr(''))} autoComplete="current-password" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          <Link className="auth-forgot" to="/forgot">
            Forgot your password?
          </Link>
        </div>
        {err && (
          <p className="auth-formerr" role="alert">
            {err}
          </p>
        )}
        <button className="lp-btn brass auth-submit" type="submit" disabled={busy}>
          {busy ? 'Signing in' : 'Sign in'}
        </button>
        {auth.demo && <p className="auth-demo">Demo mode: only accounts made on this device can sign in.</p>}
      </form>
    </AuthShell>
  )
}

export function Forgot() {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) return setErr('Enter the email you signed up with.')
    setBusy(true)
    await auth.sendReset(email)
    setBusy(false)
    setSent(true)
  }

  return (
    <AuthShell
      title="Reset your password"
      lead="Enter your email and we will send you a link to choose a new one."
      foot={
        <>
          Remembered it? <Link to="/signin">Sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="auth-sent" role="status">
          <p>
            If there is an account for <b>{email.trim()}</b>, a reset link is on its way. Check your inbox and your spam folder.
          </p>
          {auth.demo && <p className="auth-demo">Demo mode: no email is sent yet. This works once the online service is connected.</p>}
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          <AuthField id="fg-email" label="Email" type="email" value={email} onChange={(e) => (setEmail(e.target.value), setErr(''))} error={err} autoComplete="email" inputMode="email" placeholder="you@example.com" />
          <button className="lp-btn brass auth-submit" type="submit" disabled={busy}>
            {busy ? 'Sending' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
