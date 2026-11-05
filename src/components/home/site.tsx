import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../data/session'
import { CONTACT } from '../../lib/constants'

/** The signature stroke used across the site. It is the brand mark, drawn in when it comes into view. */
export const SIGNATURE =
  'M6 40 C14 8 28 8 26 30 C25 46 14 50 22 38 C30 24 42 24 40 38 C39 46 48 44 54 32 C62 22 70 24 68 36 C74 28 84 26 90 34 C98 44 112 20 124 26 C134 32 140 40 166 28'

export function Stroke({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 60" aria-hidden="true" focusable="false">
      <path pathLength={1} d={SIGNATURE} />
    </svg>
  )
}

/** Where a Start button goes: the app for people who are signed in, sign up for everyone else. */
export function useStartPath() {
  const { session } = useAuth()
  return session ? '/app' : '/signup'
}

export function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Scrolls to a section of the home page. From another page it opens the home page first, then scrolls. */
export function SectionLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const go = (e: MouseEvent) => {
    e.preventDefault()
    if (pathname !== '/') {
      nav('/', { state: { section: to } })
      return
    }
    document.getElementById(to)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' })
  }
  return (
    <a href={'#/?section=' + to} className={className} onClick={go}>
      {children}
    </a>
  )
}

/** A search bar that types what you can do by itself. It is a link, so a click or Enter opens sign up. */
export function TypingSearch({ phrases, label = 'Start free' }: { phrases: string[]; label?: string }) {
  const start = useStartPath()
  const [text, setText] = useState(phrases[0])
  useEffect(() => {
    if (reducedMotion()) return
    let i = 0
    let c = phrases[0].length
    let del = true
    const t = window.setInterval(() => {
      if (del) {
        c--
        if (c <= 0) {
          del = false
          i = (i + 1) % phrases.length
        }
      } else {
        c++
        if (c >= phrases[i].length) {
          del = true
          c = phrases[i].length + 12
        }
      }
      setText(phrases[i].slice(0, Math.max(0, Math.min(c, phrases[i].length))) || ' ')
    }, 70)
    return () => window.clearInterval(t)
  }, [phrases])
  return (
    <Link className="h-search" to={start} aria-label={label + ': create your account'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="h-q" aria-hidden="true">
        {text}
      </span>
      <b>{label}</b>
    </Link>
  )
}

export function SiteHeader() {
  const { session } = useAuth()
  return (
    <header className="h-in h-top">
      <Link to="/" aria-label="Generate, home">
        <img className="h-logo" src="./logo.png" alt="Generate" width="143" height="32" />
      </Link>
      <nav aria-label="Main">
        <SectionLink to="how">How it works</SectionLink>
        <SectionLink to="who">Who it is for</SectionLink>
        <SectionLink to="features">Features</SectionLink>
        <Link to="/pricing">Pricing</Link>
        <SectionLink to="faq">FAQ</SectionLink>
      </nav>
      <span className="h-sp" />
      {session ? (
        <Link className="h-btn h-p" to="/app">
          Open Generate
        </Link>
      ) : (
        <>
          <Link className="h-si" to="/signin">
            Sign in
          </Link>
          <Link className="h-btn h-p" to="/signup">
            Start free
          </Link>
        </>
      )}
    </header>
  )
}

function waLink(n: string) {
  const d = n.replace(/\D/g, '')
  return 'https://wa.me/' + (d.startsWith('0') ? '234' + d.slice(1) : d)
}

export function SiteFooter() {
  const talk = [
    CONTACT.whatsapp && { k: 'WhatsApp', v: CONTACT.whatsapp, href: waLink(CONTACT.whatsapp) },
    CONTACT.email && { k: 'Email', v: CONTACT.email, href: 'mailto:' + CONTACT.email },
  ].filter(Boolean) as { k: string; v: string; href: string }[]
  const follow = [
    CONTACT.instagram && { k: 'Instagram', href: 'https://instagram.com/' + CONTACT.instagram.replace('@', '') },
    CONTACT.tiktok && { k: 'TikTok', href: 'https://tiktok.com/@' + CONTACT.tiktok.replace('@', '') },
    CONTACT.x && { k: 'X', href: 'https://x.com/' + CONTACT.x.replace('@', '') },
  ].filter(Boolean) as { k: string; href: string }[]
  return (
    <footer>
      <div className="h-in">
        <div className="h-fgrid">
          <div>
            <img className="h-logo" src="./logo.png" alt="Generate" width="143" height="32" loading="lazy" />
            <span className="h-ftag">Documents that carry your name, wherever you work.</span>
          </div>
          <div>
            <h4>Product</h4>
            <SectionLink to="how">How it works</SectionLink>
            <SectionLink to="features">Features</SectionLink>
            <Link to="/pricing">Pricing</Link>
            <SectionLink to="faq">FAQ</SectionLink>
          </div>
          {talk.length > 0 && (
            <div>
              <h4>Talk to us</h4>
              {talk.map((t) => (
                <a key={t.k} href={t.href} target="_blank" rel="noreferrer">
                  {t.k} <span className="h-fv">{t.v}</span>
                </a>
              ))}
            </div>
          )}
          {follow.length > 0 && (
            <div>
              <h4>Follow</h4>
              {follow.map((f) => (
                <a key={f.k} href={f.href} target="_blank" rel="noreferrer">
                  {f.k}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="h-fbase">
          <span>© {new Date().getFullYear()} Generate. All rights reserved.</span>
          <span className="h-flinks">
            <Link to="/privacy">Privacy</Link>
            <span>Your documents stay on your account.</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
