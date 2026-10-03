import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TRADES, TRADE_ITEMS } from '../../lib/constants'
import { prefersReducedMotion, useReveal } from './useReveal'

function CountUp({ to, prefix = '' }: { to: number; prefix?: string }) {
  const [n, setN] = useState(prefersReducedMotion() ? to : 0)
  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf = 0
    const t0 = performance.now()
    const run = (now: number) => {
      const k = Math.min(1, (now - t0) / 1100)
      setN(to * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return (
    <span className="num">
      {prefix}
      {Math.round(n).toLocaleString('en-NG')}
    </span>
  )
}

/** Steps through a list on a timer so a visual can show several states. */
function useCycle(length: number, ms: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (prefersReducedMotion()) return
    const id = setInterval(() => setI((x) => (x + 1) % length), ms)
    return () => clearInterval(id)
  }, [length, ms])
  return i
}

function SheetsVisual() {
  return (
    <div className="fv fv-sheets">
      {['Contract', 'Receipt', 'Invoice'].map((t, i) => (
        <div key={t} className={'fv-sheet s' + i}>
          <span>{t}</span>
          <i />
          <i />
          <i />
        </div>
      ))}
    </div>
  )
}

function NameVisual() {
  return (
    <div className="fv fv-name">
      <div className="fv-doc">
        <div className="fv-doc-head">
          <span className="fv-logo">A</span>
          <b>Amaka Obi Studio</b>
        </div>
        <i />
        <i />
        <div className="fv-sig">
          <svg viewBox="0 0 200 60" width="120" height="36" aria-hidden="true">
            <path pathLength="1" d="M6 40 C14 8 28 8 26 30 C25 46 14 50 22 38 C30 24 42 24 40 38 C39 46 48 44 54 32 C62 22 70 24 68 36 C74 28 84 26 90 34 C98 44 112 20 124 26 C134 32 140 40 166 28" />
          </svg>
        </div>
      </div>
      <div className="fv-swatches" aria-hidden="true">
        {['#0F4D3C', '#1F3A5F', '#7A1F2B', '#5B2A4E', '#0E6B73'].map((c) => (
          <span key={c} style={{ background: c }} />
        ))}
      </div>
    </div>
  )
}

function PartVisual() {
  return (
    <div className="fv fv-part">
      <div className="fv-card">
        <p className="fv-k">Invoice 0042</p>
        <p className="fv-big num">₦125,000</p>
        <div className="fv-track">
          <span />
        </div>
        <div className="fv-two">
          <span>
            Paid <b className="num">₦50,000</b>
          </span>
          <span>
            Balance <b className="num">₦75,000</b>
          </span>
        </div>
      </div>
    </div>
  )
}

function DashVisual() {
  const tiles: [string, number, string][] = [
    ['Waiting to be paid', 75000, '₦'],
    ['Part paid', 1, ''],
    ['Received', 480000, '₦'],
    ['Overdue', 2, ''],
  ]
  return (
    <div className="fv fv-dash">
      {tiles.map(([k, n, p]) => (
        <div key={k}>
          <span>{k}</span>
          <b>
            <CountUp to={n} prefix={p} />
          </b>
        </div>
      ))}
      <em>Example figures</em>
    </div>
  )
}

function ChatVisual() {
  return (
    <div className="fv fv-chat">
      <div className="lp-msg file">
        <div className="lp-fileicon" />
        <span>
          <b>Invoice-0042.pdf</b>
          <i>1 page · PDF</i>
        </span>
      </div>
      <div className="lp-msg text">
        Hello Tunde, a quick reminder that invoice 0042 for ₦75,000 is waiting for payment. Thank you.
        <span className="lp-ticks2">10:04 ✓✓</span>
      </div>
      <div className="fv-tones">
        {['Friendly', 'Firm', 'Final'].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function CurrencyVisual() {
  const marks = ['₦', '$', '£', '€']
  const i = useCycle(4, 1500)
  return (
    <div className="fv fv-cur">
      <p className="fv-big num" key={i}>
        {marks[i]}125,000
      </p>
      <div>
        {marks.map((m, k) => (
          <span key={m} className={k === i ? 'on' : ''}>
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}

function PdfVisual() {
  return (
    <div className="fv fv-pdf">
      <div className="fv-page">
        <span>Invoice</span>
        <i />
        <i />
        <i />
        <b className="num">₦125,000</b>
      </div>
      <p>
        <b>Invoice-0042.pdf</b>
        <span>One tidy page</span>
      </p>
    </div>
  )
}

function TradeVisual() {
  const keys = Object.keys(TRADES).filter((k) => k !== 'other')
  const i = useCycle(keys.length, 1800)
  return (
    <div className="fv fv-trade">
      <div>
        {keys.map((k, n) => (
          <span key={k} className={n === i ? 'on' : ''}>
            {TRADES[k]}
          </span>
        ))}
      </div>
      <ul key={i}>
        {TRADE_ITEMS[keys[i]].slice(0, 4).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

const FEATURES: { t: string; d: string; v: ReactNode }[] = [
  { t: 'Invoices, receipts and contracts', d: 'Three kinds of document in one place. Start a contract from a template and change any line.', v: <SheetsVisual /> },
  { t: 'Your name on everything', d: 'Your logo, details and signature, set up once. Six layouts, six fonts and any colour you like.', v: <NameVisual /> },
  { t: 'Part payments', d: 'Take a deposit now and the balance later. The balance on the invoice updates by itself.', v: <PartVisual /> },
  { t: 'A dashboard that keeps count', d: 'See what is waiting to be paid, what is part paid, what came in and what is overdue.', v: <DashVisual /> },
  { t: 'Send on WhatsApp', d: 'One tap opens WhatsApp to your client with the message ready. Friendly, firm and final reminders too.', v: <ChatVisual /> },
  { t: 'Any currency', d: 'Naira, dollar, pound or euro on every document.', v: <CurrencyVisual /> },
  { t: 'A clean PDF', d: 'One tidy page you can save, print or send anywhere.', v: <PdfVisual /> },
  { t: 'Made for your trade', d: 'Starter items for hair, food, design, photography, fashion and consulting.', v: <TradeVisual /> },
]

const STEP_MS = 5200

/** A list of features on one side and a small animated picture of the chosen one on the other. */
export function FeatureStage() {
  const [active, setActive] = useState(0)
  const [hold, setHold] = useState(false)
  const [ref, seen] = useReveal<HTMLDivElement>(0.25)
  const still = useRef(prefersReducedMotion()).current

  useEffect(() => {
    if (still || hold || !seen) return
    const id = setTimeout(() => setActive((a) => (a + 1) % FEATURES.length), STEP_MS)
    return () => clearTimeout(id)
  }, [active, hold, seen, still])

  return (
    <div ref={ref} className={'lp-fs rv' + (seen ? ' in' : '')} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <div className="lp-fs-stage" role="tabpanel" aria-live="polite">
        <div className="lp-fs-view" key={active}>
          {FEATURES[active].v}
        </div>
      </div>
      <ul className="lp-fs-list" role="tablist" aria-label="Features">
        {FEATURES.map((f, i) => (
          <li key={f.t}>
            <button type="button" role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>
              <span className="lp-fs-n num">{String(i + 1).padStart(2, '0')}</span>
              <span className="lp-fs-t">{f.t}</span>
              <span className="lp-fs-d">{f.d}</span>
              {i === active && !still && !hold && seen && <span className="lp-fs-bar" key={'b' + active} style={{ animationDuration: STEP_MS + 'ms' }} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
