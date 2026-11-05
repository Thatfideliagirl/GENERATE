import { useEffect, useRef, useState, type ReactNode } from 'react'
import { reducedMotion, Stroke } from './site'

/* Each demo is a tiny, real looking piece of Generate. It plays when its item is chosen. */

function SignatureDemo() {
  return (
    <div className="h-st-card">
      <div className="h-st-tabs">
        <span className="on">Draw</span>
        <span>Type</span>
        <span>Upload</span>
      </div>
      <div className="h-st-pad h-sg">
        <Stroke />
      </div>
      <p className="h-st-cap">Your signature, ready for every document.</p>
    </div>
  )
}

function WhatsAppDemo() {
  return (
    <div className="h-st-wa">
      <div className="h-st-wahead">
        <i />
        Tunde Bello
      </div>
      <div className="h-st-wabody">
        <div className="h-st-bub">
          <div className="h-st-file">
            <u>PDF</u>
            <span>
              <b>Invoice-0042.pdf</b>1 page
            </span>
          </div>
          Hello Tunde, here is your invoice for ₦125,000. Thank you.
          <small>10:24 ✓✓</small>
        </div>
      </div>
    </div>
  )
}

function ReminderDemo() {
  return (
    <div className="h-st-card">
      <div className="h-st-tabs">
        <span className="on">Friendly</span>
        <span>Firm</span>
        <span>Final</span>
      </div>
      <div className="h-st-msg">Hi Ola, a gentle reminder that invoice 0039 for ₦75,000 is now due. Thank you for your business.</div>
      <span className="h-st-send">Send on WhatsApp</span>
    </div>
  )
}

function PartDemo() {
  return (
    <div className="h-st-card">
      <div className="h-st-row">
        <span>Invoice 0042</span>
        <b className="h-num">₦125,000</b>
      </div>
      <div className="h-st-bar">
        <i />
      </div>
      <div className="h-st-row h-st-small">
        <span>Paid ₦50,000</span>
        <span>₦75,000 left</span>
      </div>
      <div className="h-st-pays">
        <span>Deposit · 2 Nov</span>
        <b className="h-num">₦50,000</b>
      </div>
      <span className="h-pill h-part">Part paid</span>
    </div>
  )
}

const CURRENCY = [
  ['₦', 'Naira', '125,000'],
  ['$', 'Dollar', '850'],
  ['£', 'Pound', '650'],
  ['€', 'Euro', '750'],
]

function CurrencyDemo({ live }: { live: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!live || reducedMotion()) return
    const t = window.setInterval(() => setI((x) => (x + 1) % CURRENCY.length), 1100)
    return () => window.clearInterval(t)
  }, [live])
  return (
    <div className="h-st-card">
      <span className="h-st-small">Total due</span>
      <b className="h-st-big h-num" key={i}>
        {CURRENCY[i][0]}
        {CURRENCY[i][2]}
      </b>
      <div className="h-st-tabs">
        {CURRENCY.map((c, k) => (
          <span key={c[1]} className={k === i ? 'on' : undefined}>
            {c[0]} {c[1]}
          </span>
        ))}
      </div>
    </div>
  )
}

function LookDemo() {
  return (
    <div className="h-st-look">
      <div className="h-st-mini">
        <div className="h-st-minihead">
          <span>AO</span>
          <em>Invoice</em>
        </div>
        <i />
        <i />
        <i className="s" />
      </div>
      <div className="h-st-tabs h-st-wrap">
        {['Classic', 'Modern', 'Minimal', 'Framed', 'Split', 'Bold'].map((x, k) => (
          <span key={x} className={k === 0 ? 'on' : undefined}>
            {x}
          </span>
        ))}
      </div>
      <p className="h-st-cap">A template gallery is on its way with Generate more.</p>
    </div>
  )
}

function CustomersDemo() {
  return (
    <div className="h-st-card">
      <span className="h-st-small">Who is this for?</span>
      {[
        ['TB', 'Tunde Bello', '0809 999 8888'],
        ['CE', 'Chioma Eze', '0802 555 1234'],
        ['AK', 'Ada Kalu', 'ada@kalu.studio'],
      ].map(([i, n, d], k) => (
        <div key={n} className={'h-st-cus' + (k === 0 ? ' on' : '')}>
          <span className="h-st-av">{i}</span>
          <span>
            <b>{n}</b>
            <small>{d}</small>
          </span>
        </div>
      ))}
    </div>
  )
}

function DashDemo() {
  return (
    <div className="h-st-dash">
      <div className="dk">
        <small>Received</small>
        <b className="h-num">₦480k</b>
      </div>
      <div>
        <small>Waiting</small>
        <b className="h-num">₦75k</b>
      </div>
      <div>
        <small>Part paid</small>
        <b>1</b>
      </div>
      <div>
        <small>Overdue</small>
        <b>2</b>
      </div>
    </div>
  )
}

const THINGS: { t: string; d: string; demo: (live: boolean) => ReactNode }[] = [
  { t: 'Create your signature', d: 'Draw it with your finger, type it in a handwriting style, or upload a photo. We clear the background for you.', demo: () => <SignatureDemo /> },
  { t: 'Send on WhatsApp', d: 'One tap opens the chat with your client, with the document and the message ready.', demo: () => <WhatsAppDemo /> },
  { t: 'Reminders', d: 'Friendly, firm or final. Pick a tone and the message is written for you.', demo: () => <ReminderDemo /> },
  { t: 'Part payments', d: 'Take a deposit now and the balance later. Every payment is counted.', demo: () => <PartDemo /> },
  { t: 'Any currency', d: 'Naira, dollar, pound or euro, chosen on each document.', demo: (live) => <CurrencyDemo live={live} /> },
  { t: 'Looks and templates', d: 'Six layouts, six fonts, any colour, and your logo or initials on top.', demo: () => <LookDemo /> },
  { t: 'Your customers list', d: 'Save the people you work for once. Pick them and their details fill in.', demo: () => <CustomersDemo /> },
  { t: 'A dashboard that keeps count', d: 'See what came in, what is waiting and who is late, at a glance.', demo: () => <DashDemo /> },
]

/**
 * The smaller things that come with every document. A list on one side and a small live demo on the other.
 * It moves on by itself until someone taps or points at an item.
 */
export function SmallThings() {
  const [at, setAt] = useState(0)
  const [held, setHeld] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (held || reducedMotion() || !box.current || !('IntersectionObserver' in window)) return
    let timer = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !timer) timer = window.setInterval(() => setAt((a) => (a + 1) % THINGS.length), 4500)
        if (!e.isIntersecting && timer) {
          window.clearInterval(timer)
          timer = 0
        }
      },
      { threshold: 0.35 },
    )
    io.observe(box.current)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [held])

  const choose = (i: number) => {
    setAt(i)
    setHeld(true)
  }

  return (
    <div className="h-st" ref={box}>
      <p className="h-xlbl h-st-lbl">And the small things that save you time</p>
      <div className="h-st-side">
        <ul className={'h-st-list' + (held ? ' h-held' : '')} role="tablist" aria-label="The small things">
          {THINGS.map((x, i) => (
            <li key={x.t}>
              <button type="button" role="tab" aria-selected={i === at} aria-controls="st-panel" onClick={() => choose(i)} onMouseEnter={() => choose(i)}>
                <span className="h-st-t">{x.t}</span>
                <span className="h-st-d">{x.d}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-st-stage" id="st-panel" role="tabpanel" aria-live="polite">
        <div className="h-st-show" key={at}>
          {THINGS[at].demo(true)}
        </div>
        <p className="h-st-now">
          <b>{THINGS[at].t}</b>
          {THINGS[at].d}
        </p>
      </div>
    </div>
  )
}
