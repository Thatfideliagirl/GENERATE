import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BRAND } from '../lib/constants'

/** The frame around sign in, sign up and reset: a green wall on one side, paper on the other. */
export function AuthShell({ title, lead, children, foot, wide }: { title: string; lead: string; children: ReactNode; foot?: ReactNode; wide?: boolean }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Link to="/" className="auth-logo" aria-label={`${BRAND} home`}>
          <img src="./logo.png" alt={BRAND} width={180} height={40} />
        </Link>
        <div className="auth-pitch">
          <p className="lp-label">Invoices, receipts and contracts</p>
          <p className="auth-big">
            Documents that carry <em>your name.</em>
          </p>
          <ul>
            <li>Free to use</li>
            <li>Works on your phone</li>
            <li>Send on WhatsApp</li>
          </ul>
        </div>
      </aside>
      <main className="auth-main">
        <div className={'auth-card' + (wide ? ' wide' : '')}>
          <Link to="/" className="auth-back">
            Back to home
          </Link>
          <h1>{title}</h1>
          <p className="auth-lead">{lead}</p>
          {children}
          {foot && <p className="auth-foot">{foot}</p>}
        </div>
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
