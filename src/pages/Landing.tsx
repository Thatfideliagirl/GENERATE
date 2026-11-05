import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PhoneStory } from '../components/home/PhoneStory'
import { WhoFor } from '../components/home/WhoFor'
import { Features } from '../components/home/Features'
import { Faq } from '../components/home/Faq'
import { FreeSign } from '../components/home/FreeSign'
import { SiteFooter, SiteHeader, TypingSearch, useStartPath } from '../components/home/site'
import { usePageTitle } from '../components/home/usePageTitle'

const HERO_SEARCH = ['Sign a PDF in a minute', 'Make an invoice for Tunde', 'Send a receipt on WhatsApp', 'See who has paid this month']
const END_SEARCH = ['Make an invoice for Tunde', 'Sign a contract today', 'Remind Ola about invoice 0039']

const RIBBON: [string, string][] = [
  ['Documents that carry', 'your name.'],
  ['Send it before they', 'forget.'],
  ['Every naira,', 'accounted for.'],
  ['Signed, sent,', 'sorted.'],
  ['Made for', 'your business.'],
]

/** One quiet moving line. The words repeat three times so the loop never shows a gap. */
function Ribbon() {
  const all = [...RIBBON, ...RIBBON, ...RIBBON]
  return (
    <div className="h-marq" aria-hidden="true">
      <div className="h-r1">
        {all.map(([a, b], i) => (
          <span key={i}>
            {a} <em>{b}</em>
            <i />
          </span>
        ))}
      </div>
    </div>
  )
}

/** The home page: hero, the phone story, who it is for, features, questions and a last call to start. */
export default function Landing() {
  const start = useStartPath()
  const { state } = useLocation() as { state: { section?: string } | null }
  const nav = useNavigate()
  usePageTitle('Generate: invoices, receipts and contracts with your name on them')

  // Arriving from another page with a section to show, for example from Privacy back to the questions.
  useEffect(() => {
    const to = state?.section
    if (!to) return
    requestAnimationFrame(() => document.getElementById(to)?.scrollIntoView())
    nav('.', { replace: true, state: null })
  }, [state, nav])

  // A fresh visit starts at the top, not where the last page was scrolled to.
  useEffect(() => {
    if (!state?.section) window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-root">
      <SiteHeader />
      <main>
        <section className="h-in h-hero" aria-labelledby="h">
          <TypingSearch phrases={HERO_SEARCH} />
          <h1 id="h">
            Send it today. Know when it’s <em className="h-s">paid.</em>
          </h1>
          <p className="h-lede">
            Invoices, receipts and contracts with your logo and signature. Send them on WhatsApp, and see who has paid, who paid part and who is late.
          </p>
          <div className="h-cta">
            <Link className="h-btn h-p" to={start}>
              Start free →
            </Link>
            <a
              className="h-btn"
              href="#/?section=how"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              See how it works
            </a>
          </div>
        </section>

        <PhoneStory />
        <Ribbon />
        <WhoFor />
        <Features />
        <Faq />
        <FreeSign />

        <section className="h-in h-sec h-end" aria-labelledby="en">
          <div className="h-endbox">
            <h2 id="en">
              Your next client is waiting on a <em className="h-s">document.</em>
            </h2>
            <p>Free to use. Setup takes less than two minutes.</p>
            <TypingSearch phrases={END_SEARCH} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
