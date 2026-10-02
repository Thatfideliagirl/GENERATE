import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../lib/constants'
import type { Style } from '../lib/types'
import { sampleDocAndProfile } from '../lib/factory'
import { LookControls } from '../components/LookControls'
import { PaperPreview } from '../components/PaperPreview'
import { useStore } from '../data/store'

const STEPS = [
  { t: 'Set up once', d: 'Add your logo, business details and signature.' },
  { t: 'Fill in the job', d: 'Choose an invoice, receipt or contract and add your customer and items.' },
  { t: 'Send it', d: 'Download the PDF or send it straight on WhatsApp.' },
]

const FEATURES = [
  { t: 'Part payments', d: 'Take a deposit now and the balance later. What is left updates by itself.' },
  { t: 'Reminders that sound right', d: 'Friendly, firm or final messages, ready to send on WhatsApp.' },
  { t: 'Contracts with your signature', d: 'Start from a template, change what you like, and sign with your own signature.' },
  { t: 'Any currency', d: 'Choose naira, dollar, pound or euro on every document.' },
  { t: 'A dashboard that keeps count', d: 'See what is waiting to be paid, what came in and what is overdue.' },
  { t: 'Made for your trade', d: 'Quick items for hair, food, design, photography, fashion and consulting.' },
]

const AUDIENCE = [
  { t: 'Freelancers', d: 'Look professional from your very first client.' },
  { t: 'Small businesses', d: 'Keep every invoice, receipt and agreement in one place.' },
  { t: 'Growing brands', d: 'One consistent look on everything you send out.' },
]

export default function Landing() {
  const nav = useNavigate()
  const { data } = useStore()
  const [look, setLook] = useState<Style>({ layout: 'classic', font: 'editorial', accent: 'emerald', text: '#14251F', paper: 'white' })
  const sample = useMemo(() => sampleDocAndProfile(look), [look])
  const hasProfile = !!data.profile
  const go = () => nav(hasProfile ? '/app' : '/setup')
  const cta = hasProfile ? 'Open my dashboard' : 'Start free'

  return (
    <div className="landing">
      <header className="lp-top">
        <nav className="lp-nav">
          <img className="lp-logo" src="./logo.png" alt={BRAND} />
          <button className="btn p" onClick={go}>
            {cta}
          </button>
        </nav>
      </header>
      <div className="lp-hero">
        <div className="in">
          <div>
            <h1>Documents that carry your name.</h1>
            <p>Invoices, receipts and contracts with your logo, your signature and your own look. Make one in a minute and send it on WhatsApp.</p>
            <button className="btn br" onClick={go}>
              {cta}
            </button>
            <p className="sm">Free to use. Works on your phone.</p>
          </div>
          <div className="lp-stack" aria-hidden="true">
            <div className="lp-inv">
              <div className="lp-row">
                <b>Invoice 0042</b>
                <span className="soft">Due Friday</span>
              </div>
              <div className="lp-rule" />
              <div className="lp-row">
                <span>Logo design</span>
                <span>₦80,000</span>
              </div>
              <div className="lp-row">
                <span>Brand guide</span>
                <span>₦45,000</span>
              </div>
              <div className="lp-total">₦125,000</div>
            </div>
            <div className="lp-rec">
              <b>Receipt 0042</b>
              <div className="lp-stampwrap">
                <span className="lp-stamp">Paid</span>
              </div>
              <span className="soft">Thank you, Amaka</span>
            </div>
          </div>
        </div>
      </div>

      <section className="lp-sec">
        <h2>From setup to sent in three steps</h2>
        <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <b className="n">{i + 1}</b>
              <div>
                <b className="t">{s.t}</b>
                {s.d}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-sec">
        <h2>Make it look like your brand</h2>
        <div className="lp-demo">
          <LookControls style={look} onChange={(patch) => setLook((s) => ({ ...s, ...patch }))} />
          <PaperPreview doc={sample.doc} profile={sample.profile} className="demo" />
        </div>
      </section>

      <section className="lp-sec">
        <h2>Built for how you get paid</h2>
        <div className="lp-feat">
          {FEATURES.map((f) => (
            <div key={f.t}>
              <b>{f.t}</b>
              {f.d}
            </div>
          ))}
        </div>
      </section>

      <section className="lp-sec">
        <h2>Who it is for</h2>
        <div className="lp-feat">
          {AUDIENCE.map((f) => (
            <div key={f.t}>
              <b>{f.t}</b>
              {f.d}
            </div>
          ))}
        </div>
      </section>

      <section className="lp-end">
        <h2>Your documents stay yours.</h2>
        <p>Free to start. Setup takes about two minutes.</p>
        <button className="btn br" onClick={go}>
          {cta}
        </button>
      </section>
      <footer className="lp-foot">
        <img src="./logo.png" alt={BRAND} />
        Your profile and documents are saved on your own device. You can download a backup from your profile at any time.</footer>
    </div>
  )
}
