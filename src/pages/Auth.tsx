import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell, AuthField } from '../components/AuthShell'
import { BUSINESS_TYPES, TRADES } from '../lib/constants'
import { auth, AuthError, isEmail, isPhone } from '../data/auth'
import { useAuth } from '../data/session'
import { useStore } from '../data/store'
import { repo } from '../data/repo'
import { defaultProfile, emptyData } from '../lib/factory'

type Errors = Record<string, string>

function useAlreadyIn() {
  const { session } = useAuth()
  const { data } = useStore()
  return session ? (data.profile ? '/app' : '/setup') : null
}

export function SignUp() {
  const nav = useNavigate()
  const { signUp } = useAuth()
  const goto = useAlreadyIn()
  const [v, setV] = useState({ name: '', business: '', email: '', whatsapp: '', bizType: 'solo', trade: 'other', password: '' })
  const [errs, setErrs] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [show, setShow] = useState(false)
  if (goto && !busy) return <Navigate to={goto} replace />

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => {
    setV((x) => ({ ...x, [k]: e.target.value }))
    setErrs((x) => ({ ...x, [k]: '' }))
    setFormErr('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const bad: Errors = {}
    if (!v.name.trim()) bad.name = 'Enter your name.'
    if (!v.business.trim()) bad.business = 'Enter your business name.'
    if (!isEmail(v.email)) bad.email = 'Enter a valid email, like name@example.com.'
    if (!isPhone(v.whatsapp)) bad.whatsapp = 'Enter your WhatsApp number, for example 0803 123 4567.'
    if (v.password.length < 8) bad.password = 'Use at least 8 characters.'
    setErrs(bad)
    if (Object.keys(bad).length) return
    setBusy(true)
    try {
      // The details just given become the start of the business profile. Setup adds the logo and signature.
      await signUp(v, (s) =>
        repo.save(
          {
            ...emptyData(),
            profile: {
              ...defaultProfile(),
              name: v.business.trim(),
              owner: v.name.trim(),
              email: v.email.trim(),
              phone: v.whatsapp.trim(),
              bizType: v.bizType,
              trade: v.trade,
            },
          },
          s.userId,
        ),
      )
      nav('/setup', { replace: true })
    } catch (err) {
      setFormErr(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      lead="It takes about two minutes. You can add your logo and signature on the next screen."
      foot={
        <>
          Already have an account? <Link to="/signin">Sign in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-row">
          <AuthField id="su-name" label="Your name" value={v.name} onChange={set('name')} error={errs.name} autoComplete="name" placeholder="Amaka Obi" />
          <AuthField id="su-biz" label="Business name" value={v.business} onChange={set('business')} error={errs.business} autoComplete="organization" placeholder="Amaka Obi Studio" />
        </div>
        <AuthField id="su-email" label="Email" type="email" value={v.email} onChange={set('email')} error={errs.email} autoComplete="email" inputMode="email" placeholder="you@example.com" />
        <AuthField
          id="su-wa"
          label="WhatsApp number"
          type="tel"
          value={v.whatsapp}
          onChange={set('whatsapp')}
          error={errs.whatsapp}
          autoComplete="tel"
          inputMode="tel"
          placeholder="0803 123 4567"
          hint="This is the number the send on WhatsApp button uses."
        />
        <div className="auth-row">
          <div className="auth-f">
            <label htmlFor="su-type">Which describes you best</label>
            <select id="su-type" value={v.bizType} onChange={set('bizType')}>
              {BUSINESS_TYPES.map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="auth-f">
            <label htmlFor="su-trade">What you sell or do</label>
            <select id="su-trade" value={v.trade} onChange={set('trade')}>
              {Object.entries(TRADES).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="auth-f pw">
          <label htmlFor="su-pw">Password</label>
          <div className="auth-pw">
            <input id="su-pw" type={show ? 'text' : 'password'} value={v.password} onChange={set('password')} autoComplete="new-password" aria-invalid={!!errs.password} aria-describedby="su-pw-e" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          <span className={errs.password ? 'auth-e' : 'auth-h'} id="su-pw-e" role={errs.password ? 'alert' : undefined}>
            {errs.password || 'At least 8 characters.'}
          </span>
        </div>
        {formErr && (
          <p className="auth-formerr" role="alert">
            {formErr}
          </p>
        )}
        <button className="lp-btn brass auth-submit" type="submit" disabled={busy}>
          {busy ? 'Creating your account' : 'Create account'}
        </button>
        <p className="auth-fine">
          By creating an account you agree to how we handle your details in the <Link to="/privacy">privacy page</Link>.
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
