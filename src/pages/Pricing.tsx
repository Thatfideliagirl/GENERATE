import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter, SiteHeader, useStartPath } from '../components/home/site'
import { usePageTitle } from '../components/home/usePageTitle'

const FREE = [
  'Invoices, receipts and contracts',
  'Your logo, details and signature on everything',
  'Sign any PDF or photo of a document',
  'Send on WhatsApp, with friendly, firm and final reminders',
  'Part payments and a dashboard that keeps count',
  'Six layouts, six fonts, any colour and any currency',
]

const MORE = ['A gallery of ready made templates', 'Upload your own design and fill it in', 'More ways to make every document yours']

/** Pricing lives on its own page: the free plan today, and Generate more, which is on its way. */
export default function Pricing() {
  const start = useStartPath()
  usePageTitle('Pricing · Generate')
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="h-root">
      <SiteHeader />
      <main className="h-in h-price">
        <Link className="h-back" to="/">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
          Back to home
        </Link>
        <div className="h-phead">
          <p className="h-lbl">Pricing</p>
          <h1>
            Free to start. Free to <em className="h-s">stay.</em>
          </h1>
          <p className="h-lede">Everything you need to bill, get paid and sign is free. No card, no trial that runs out.</p>
        </div>
        <div className="h-plans">
          <section className="h-plan" aria-labelledby="p-free">
            <p className="h-pname" id="p-free">
              Generate
            </p>
            <p className="h-pprice">
              Free<span>for as long as you use it</span>
            </p>
            <ul>
              {FREE.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link className="h-btn h-p" to={start}>
              Start free →
            </Link>
          </section>
          <section className="h-plan h-more" aria-labelledby="p-more">
            <p className="h-pname" id="p-more">
              Generate more
            </p>
            <p className="h-pprice">
              Coming soon<span>for businesses that want more choice</span>
            </p>
            <ul>
              {MORE.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <span className="h-soon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="5" y="10.5" width="14" height="10" rx="2" />
                <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
              </svg>
              We will tell you when it opens
            </span>
          </section>
        </div>
        <p className="h-pnote">What is free today stays free. Generate more will only add things, it will never take away what you already have.</p>
      </main>
      <SiteFooter />
    </div>
  )
}
