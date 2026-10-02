import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, TRADES, TRADE_ITEMS } from '../lib/constants'
import type { Doc, Style } from '../lib/types'
import { defaultStyle, sampleDocAndProfile } from '../lib/factory'
import { addDays, today } from '../lib/format'
import { reminderMessage } from '../lib/whatsapp'
import { LookControls } from '../components/LookControls'
import { PaperPreview } from '../components/PaperPreview'
import { HeroDoc } from '../components/landing/HeroDoc'
import { Photo } from '../components/landing/Photo'
import { useReveal } from '../components/landing/useReveal'
import { useStore } from '../data/store'

/**
 * Finished pictures go in public/images as webp. Put the path here and the
 * placeholder block is replaced, for example: hero: './images/hero.webp'
 */
const IMAGES: { hero?: string; desk?: string; signing?: string } = {}

/** Sample prices for the live demo, matched to the first two starter items of each trade. */
const PRICES: Record<string, [number, number]> = {
  hair: [60000, 25000],
  food: [45000, 30000],
  design: [80000, 45000],
  photo: [70000, 35000],
  fashion: [55000, 20000],
  consult: [50000, 30000],
  other: [80000, 45000],
}

function Rise({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.15)
  return (
    <div ref={ref} className={`rise${seen ? ' in' : ''} ${className}`}>
      {children}
    </div>
  )
}

export default function Landing() {
  const nav = useNavigate()
  const { data } = useStore()
  const hasProfile = !!data.profile
  const go = () => nav(hasProfile ? '/app' : '/setup')
  const cta = hasProfile ? 'Open my dashboard' : 'Start free'

  const [look, setLook] = useState<Style>({ layout: 'classic', font: 'editorial', accent: 'emerald', text: '#14251F', paper: 'white' })
  const [biz, setBiz] = useState('')
  const [client, setClient] = useState('')
  const [trade, setTrade] = useState('design')

  const sample = useMemo(() => {
    const s = sampleDocAndProfile(look)
    const names = TRADE_ITEMS[trade] ?? ['Logo design', 'Brand guide']
    const [a, b] = PRICES[trade] ?? PRICES.other
    s.doc.items = [
      { d: names[0], q: '1', p: String(a) },
      { d: names[1], q: '1', p: String(b) },
    ]
    s.profile.name = biz.trim() || 'Your brand'
    s.profile.bank.name = biz.trim() || 'Your brand'
    s.doc.client.name = client.trim() || 'Your client'
    return s
  }, [look, biz, client, trade])

  const story = useMemo(() => {
    const base = sampleDocAndProfile(defaultStyle())
    const profile = { ...base.profile, name: 'Amaka Obi Studio' }
    const doc: Doc = {
      ...base.doc,
      client: { name: 'Tunde', email: '', phone: '', address: '' },
      dueDate: addDays(today(), 2),
      payments: [{ amt: '50000', date: today(), method: 'Bank transfer' }],
    }
    return reminderMessage(doc, profile, 'friendly')
  }, [])

  return (
    <div className="landing">
      <header className="lp-top">
        <nav className="lp-nav" aria-label="Main">
          <img className="lp-logo" src="./logo.png" alt={BRAND} width={180} height={40} />
          <ul className="lp-links">
            <li><a href="#how">How it works</a></li>
            <li><a href="#try">Try it</a></li>
            <li><a href="#features">What it does</a></li>
            <li><a href="#who">Who it is for</a></li>
          </ul>
          <button className="lp-btn ghost" onClick={go}>
            {cta}
          </button>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-text">
            <p className="lp-label lp-kicker">Invoices, receipts and contracts</p>
            <h1 className="lp-h1">
              Documents that carry <em>your name.</em>
            </h1>
            <p className="lp-lede">
              Your logo, your details and your signature on every one. Make it in a minute, then send it on WhatsApp before your client forgets.
            </p>
            <div className="lp-cta-row">
              <button className="lp-btn brass" onClick={go}>
                {cta}
              </button>
              <a className="lp-btn line" href="#how">
                See how it works
              </a>
            </div>
            <ul className="lp-ticks">
              <li>Free to use</li>
              <li>Works on your phone</li>
              <li>No design skills needed</li>
            </ul>
          </div>
          <div className="lp-hero-art">
            <Photo
              src={IMAGES.hero}
              alt="A pen resting on a signed contract with a brass seal, on a deep green desk."
              brief="Hero image: a pen resting on a contract with a brass seal, deep green desk, warm light. No text in the picture."
              width={900}
              height={1100}
              eager
              tilt={0}
              className="lp-hero-photo"
            />
            <HeroDoc />
          </div>
        </section>

        <section className="lp-statement" id="how" aria-labelledby="what">
          <div className="lp-statement-text">
            <p className="lp-label">How it works</p>
            <h2 className="lp-h2" id="what">
              From setup to sent in three steps.
            </h2>
            <ol className="lp-steps">
              <li>
                <span className="lp-n num">01</span>
                <div>
                  <h3>Set up once</h3>
                  <p>Add your logo, your business details and your signature. You never type them again.</p>
                </div>
              </li>
              <li>
                <span className="lp-n num">02</span>
                <div>
                  <h3>Fill in the job</h3>
                  <p>Pick an invoice, receipt or contract. Add your client and what you did. The adding up is done for you.</p>
                </div>
              </li>
              <li>
                <span className="lp-n num">03</span>
                <div>
                  <h3>Send it</h3>
                  <p>Download the PDF or send it straight on WhatsApp.</p>
                </div>
              </li>
            </ol>
          </div>
          <Photo
            src={IMAGES.desk}
            alt="A desk seen from above with a phone showing an invoice, ivory paper and a brass pen."
            brief="Flat lay: a desk with a phone showing an invoice, ivory paper, a brass pen. No text in the picture."
            width={700}
            height={1000}
            tilt={1.4}
            className="lp-desk"
          />
        </section>

        <section className="lp-try" id="try" aria-labelledby="try">
          <div className="lp-try-head">
            <p className="lp-label">Try it now</p>
            <h2 className="lp-h2" id="try">
              Type your name. Watch the invoice change.
            </h2>
          </div>
          <div className="lp-try-grid">
            <div className="lp-try-fields">
              <label className="lp-field">
                <span>Your business name</span>
                <input value={biz} onChange={(e) => setBiz(e.target.value)} placeholder="Amaka Obi Studio" maxLength={40} autoComplete="off" />
              </label>
              <label className="lp-field">
                <span>Your client</span>
                <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Tunde Bello" maxLength={40} autoComplete="off" />
              </label>
              <label className="lp-field">
                <span>What you do</span>
                <select value={trade} onChange={(e) => setTrade(e.target.value)}>
                  {Object.entries(TRADES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div className="lp-looks">
                <p className="lp-label">Change the look</p>
                <LookControls style={look} onChange={(patch) => setLook((s) => ({ ...s, ...patch }))} />
              </div>
            </div>
            <div className="lp-try-paper">
              <PaperPreview doc={sample.doc} profile={sample.profile} className="lp-sheet" />
            </div>
          </div>
        </section>

        <section className="lp-story" id="features" aria-labelledby="story">
          <div className="lp-story-in">
            <p className="lp-label lp-on-dark">Part payments and reminders</p>
            <h2 className="lp-h2 lp-on-dark" id="story">
              Built for how you get paid. Tunde pays half, you still know what is left.
            </h2>
            <ol className="lp-days">
              <li>
                <span className="lp-day">Monday</span>
                <p>
                  You send invoice 0042 for <span className="num">₦125,000</span>. Tunde says he will pay soon.
                </p>
              </li>
              <li>
                <span className="lp-day">Wednesday</span>
                <p>
                  A deposit of <span className="num">₦50,000</span> comes in. You add the payment and the balance becomes{' '}
                  <span className="num">₦75,000</span> on its own.
                </p>
              </li>
              <li>
                <span className="lp-day">Friday</span>
                <p>The balance is still open. Pick a friendly, firm or final tone and send this.</p>
                <blockquote className="lp-wa">
                  {story}
                  <span className="lp-wa-meta">WhatsApp</span>
                </blockquote>
              </li>
            </ol>
            <dl className="lp-feats">
              <div><dt>Any currency</dt><dd>Naira, dollar, pound or euro on every document.</dd></div>
              <div><dt>A dashboard that counts</dt><dd>What is waiting, what came in and what is overdue.</dd></div>
              <div><dt>Made for your trade</dt><dd>Quick items for hair, food, design, photography, fashion and consulting.</dd></div>
            </dl>
          </div>
        </section>

        <section className="lp-sign" aria-labelledby="sign">
          <Photo
            src={IMAGES.signing}
            alt="A close up of a hand signing a document."
            brief="Close up of a hand signing a document. No text in the picture."
            width={1000}
            height={700}
            tilt={-1.2}
            className="lp-sign-photo"
          />
          <div className="lp-sign-text">
            <p className="lp-label">Contracts and signatures</p>
            <h2 className="lp-h2" id="sign">
              Put it in writing. Sign it as you.
            </h2>
            <Rise>
              <p className="lp-body">
                Start from one of three contract templates and change any line. Draw your signature with a finger, upload it, or type it
                in a style you like. It sits on the page next to your client's name.
              </p>
              <p className="lp-small">The templates are starting points, not legal advice. Have a lawyer read a contract before you rely on it.</p>
            </Rise>
          </div>
        </section>

        <section className="lp-who" id="who" aria-labelledby="who">
          <p className="lp-label">Who it is for</p>
          <h2 className="lp-h2" id="who">
            If someone still owes you, this is for you.
          </h2>
          <ul className="lp-lines">
            <li>The freelancer who wants the first client to take them seriously.</li>
            <li>The shop owner with a notebook of who paid what, and a worry that a page is missing.</li>
            <li>The hair stylist, caterer, tailor or photographer who gets asked for a receipt after the money has gone.</li>
            <li>The growing brand that wants every document to look like it came from the same desk.</li>
          </ul>
        </section>

        <section className="lp-end" aria-labelledby="end">
          <h2 className="lp-h2 lp-on-dark" id="end">
            Your next client is waiting on a document.
          </h2>
          <p className="lp-on-dark lp-sub">Setup takes about two minutes.</p>
          <button className="lp-btn brass" onClick={go}>
            {cta}
          </button>
        </section>
      </main>

      <footer className="lp-foot">
        <img src="./logo.png" alt={BRAND} width={150} height={33} loading="lazy" />
        <p>For now your profile and documents are stored on your own device. Download a backup from your profile whenever you like.</p>
      </footer>
    </div>
  )
}
