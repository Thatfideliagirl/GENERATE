import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BRAND } from '../lib/constants'
import { BackIcon } from './Icons'

const SIGNATURE =
  'M6 40 C14 8 28 8 26 30 C25 46 14 50 22 38 C30 24 42 24 40 38 C39 46 48 44 54 32 C62 22 70 24 68 36 C74 28 84 26 90 34 C98 44 112 20 124 26 C134 32 140 40 166 28'

/**
 * The frame around sign in, sign up and reset: one calm card on powder blue, with the logo above it,
 * a switch between Sign in and Start free, and three short promises underneath.
 */
export function AuthShell({ title, lead, children, foot, wide }: { title: string; lead: string; children: ReactNode; foot?: ReactNode; wide?: boolean }) {
  const { pathname } = useLocation()
  const tabs = pathname === '/signin' || pathname === '/signup'
  return (
    <div className="auth auth2">
      <svg className="auth-mark" viewBox="0 0 200 60" aria-hidden="true" focusable="false">
        <path pathLength={1} d={SIGNATURE} />
      </svg>
      <header className="auth-top">
        <Link to="/" className="auth-logo" aria-label={`${BRAND} home`}>
          <img src="./logo.png" alt={BRAND} width={150} height={33} />
        </Link>
        <Link to="/" className="auth-back">
          <BackIcon />
          Back to home
        </Link>
      </header>
      <main className="auth-main">
        <div className={'auth-card' + (wide ? ' wide' : '')}>
          {tabs && (
            <nav className="auth-tabs" aria-label="Sign in or start free">
              <Link to="/signin" className={pathname === '/signin' ? 'on' : ''} aria-current={pathname === '/signin' ? 'page' : undefined}>
                Sign in
              </Link>
              <Link to="/signup" className={pathname === '/signup' ? 'on' : ''} aria-current={pathname === '/signup' ? 'page' : undefined}>
                Start free
              </Link>
            </nav>
          )}
          <h1>{title}</h1>
          <p className="auth-lead">{lead}</p>
          {children}
          {foot && <p className="auth-foot">{foot}</p>}
        </div>
        <ul className="auth-perks" aria-label="Why Generate">
          <li>
            <span aria-hidden="true">₦0</span>Free to use
          </li>
          <li>
            <span aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="7" y="3" width="10" height="18" rx="2.5" />
                <path d="M11 18h2" />
              </svg>
            </span>
            Made for your phone
          </li>
          <li>
            <span aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 19.5 5.6 16A7.6 7.6 0 1 1 8.4 18.6z" />
              </svg>
            </span>
            Send on WhatsApp
          </li>
        </ul>
      </main>
    </div>
  )
}

export function AuthField({
  id,
  label,
  hint,
  error,
  ...rest
}: { id: string; label: string; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={'auth-f' + (error ? ' bad' : '')}>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? id + '-e' : hint ? id + '-h' : undefined} {...rest} />
      {error ? (
        <span className="auth-e" id={id + '-e'} role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className="auth-h" id={id + '-h'}>
            {hint}
          </span>
        )
      )}
    </div>
  )
}
