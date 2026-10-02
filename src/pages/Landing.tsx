import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, TRADES, TRADE_ITEMS } from '../lib/constants'
import type { Style } from '../lib/types'
import { sampleDocAndProfile } from '../lib/factory'
import { money } from '../lib/format'
import { LookControls } from '../components/LookControls'
import { PaperPreview } from '../components/PaperPreview'
import { HeroDoc } from '../components/landing/HeroDoc'
import { SignSheet } from '../components/landing/SignSheet'
import { useStore } from '../data/store'

/** Sample prices for the live demo and the trades index, matched to the first two starter items of each trade. */
const PRICES: Record<string, [number, number]> = {
  hair: [60000, 25000],
  food: [45000, 30000],
  design: [80000, 45000],
  photo: [70000, 35000],
  fashion: [55000, 20000],
  consult: [50000, 30000],
  other: [80000, 45000],
}

const STEPS = [
  { t: 'Set up once', d: 'Add your logo, your business details and your signature. You never type them again.' },
  { t: 'Fill in the job', d: 'Pick an invoice, receipt or contract. Add your client and what you did. The adding up is done for you.' },
  { t: 'Send it', d: 'Download the PDF or send it straight on WhatsApp.' },
]

const FEATURES = [
  { t: 'Part payments', d: 'Take a deposit now and the balance later. What is left updates by itself.' },
  { t: 'WhatsApp reminders', d: 'Friendly, firm or final. Pick a tone and send it.' },
  { t: 'Contracts with your signature', d: 'Three starter templates. Draw, upload or type your signature.' },
  { t: 'Any currency', d: 'Naira, dollar, pound or euro on every document.' },
  { t: 'A dashboard that keeps count', d: 'What is waiting to be paid, what came in and what is overdue.' },
  { t: 'Made for your trade', d: 'Quick starter items for hair, food, design, photography, fashion and consulting.' },
]

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
  const [kind, setKind] = useState<'invoice' | 'receipt'>('invoice')

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
    s.doc.type = kind
    if (kind === 'receipt') {
      s.doc.status = 'paid'
      s.doc.dueDate = ''
      s.doc.notes = 'Thank you for your payment.'
    }
    return s
  }, [look, biz, client, trade, kind])

  return (
    <div className="landing">
      <header className="lp-top">
        <nav className="lp-nav" aria-label="Main">
          <img className="lp-logo" src="./logo.png" alt={BRAND} width={180} height={40} />
          <ul className="lp-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#who">Who it is for</a></li>
          </ul>
          <div className="lp-nav-end">
            <button className="lp-link-btn" onClick={go}>
              Sign in
            </button>
            <button className="lp-btn ghost" onClick={go}>
              {cta}
            </button>
          </div>
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
            <div className="lp-back one" aria-hidden="true">
              <span className="lp-type">Contract</span>
              <i />
              <i />
              <i />
            </div>
            <div className="lp-back two" aria-hidden="true">
              <span className="lp-type">Invoice</span>
              <i />
              <i />
            </div>
            <HeroDoc />
          </div>
        </section>

        <section className="lp-sec lp-how" id="how" aria-labelledby="how-h">
          <div className="lp-sec-head">
            <p className="lp-label">How it works</p>
            <h2 className="lp-h2" id="how-h">
              From setup to sent in three steps.
            </h2>
          </div>
          <ol className="lp-steps">
            {STEPS.map((st, i) => (
              <li key={st.t}>
                <span className="lp-n num">0{i + 1}</span>
                <div>
                  <h3>{st.t}</h3>
                  <p>{st.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="lp-sec lp-features" id="features" aria-labelledby="feat-h">
          <div className="lp-sec-head">
            <p className="lp-label">Features</p>
            <h2 className="lp-h2" id="feat-h">
              Built for how you get paid.
            </h2>
          </div>
          <dl className="lp-feats">
            {FEATURES.map((f) => (
              <div key={f.t}>
                <dt>{f.t}</dt>
                <dd>{f.d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="lp-sec lp-contracts" aria-labelledby="sign">
          <div className="lp-sign-text">
            <p className="lp-label">Contracts and signatures</p>
            <h2 className="lp-h2" id="sign">
              Put it in writing. Sign it as you.
            </h2>
            <p className="lp-body">
              Start from a template and change any line. Draw your signature with a finger, upload it, or type it in a style you like. It
              sits on the page next to your client's name.
            </p>
            <p className="lp-small">The templates are starting points, not legal advice. Have a lawyer read a contract before you rely on it.</p>
          </div>
          <SignSheet />
        </section>

        <section className="lp-sec lp-who" id="who" aria-labelledby="who-h">
          <div className="lp-sec-head">
            <p className="lp-label">Who it is for</p>
            <h2 className="lp-h2" id="who-h">
              If you invoice people, this is for you.
            </h2>
            <p className="lp-body">Freelancers, shop owners and growing brands. Here is what a first invoice looks like in each trade.</p>
          </div>
          <ul className="lp-index">
            {Object.entries(TRADES)
              .filter(([k]) => k !== 'other')
              .map(([k, name]) => (
                <li key={k}>
                  <span className="lp-trade">{name}</span>
                  <span className="lp-leader" aria-hidden="true" />
                  <span className="lp-eg">
                    {TRADE_ITEMS[k][0]} <b className="num">{money(PRICES[k][0], '₦')}</b>
                  </span>
                </li>
              ))}
          </ul>
        </section>

        <section className="lp-sec lp-try" id="try" aria-labelledby="try-h">
          <div className="lp-sec-head">
            <p className="lp-label">Try it now</p>
            <h2 className="lp-h2" id="try-h">
              Type your name. Watch the document change.
            </h2>
          </div>
          <div className="lp-try-grid">
            <div className="lp-try-fields">
              <div className="seg lp-seg" role="group" aria-label="Document type">
                <button type="button" className={kind === 'invoice' ? 'on' : ''} onClick={() => setKind('invoice')}>
                  Invoice
                </button>
                <button type="button" className={kind === 'receipt' ? 'on' : ''} onClick={() => setKind('receipt')}>
                  Receipt
                </button>
              </div>
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
                <LookControls style={look} onChange={(patch) => setLook((st) => ({ ...st, ...patch }))} />
              </div>
            </div>
            <div className="lp-try-paper">
              <PaperPreview doc={sample.doc} profile={sample.profile} className="lp-sheet" />
            </div>
          </div>
        </section>

        <section className="lp-end" id="pricing" aria-labelledby="end">
          <div className="lp-letter">
            <h2 className="lp-h2" id="end">
              Your next client is waiting on a document.
            </h2>
            <p className="lp-sub">Setup takes less than two minutes.</p>
            <div className="lp-letter-row">
              <button className="lp-btn brass" onClick={go}>
                {cta}
              </button>
              <div className="lp-signline" aria-hidden="true">
                <span>Your name</span>
              </div>
            </div>
            <p className="lp-price">Pricing: Generate is free to use while we build it. Paid plans will be listed here when they are ready.</p>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <img src="./logo.png" alt={BRAND} width={150} height={33} loading="lazy" />
        <p>For now your profile and documents are stored on your own device. Download a backup from your profile whenever you like.</p>
      </footer>
    </div>
  )
}
