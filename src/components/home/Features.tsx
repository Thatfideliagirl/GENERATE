import { useEffect, useRef, useState } from 'react'
import { Stroke } from './site'

/** Small, real looking pages. Each one shows what that kind of document looks like when it leaves Generate. */
function InvoiceSheet() {
  return (
    <div className="h-sheet h-inv">
      <div className="h-shd">
        <span className="h-mg">AO</span>
        <em>Invoice</em>
      </div>
      <div className="h-sbd">
        <small>Billed to</small>
        <b>Tunde Bello</b>
        <div className="h-sl">
          <span>Logo design</span>
          <span className="h-num">₦80,000</span>
        </div>
        <div className="h-sl">
          <span>Brand guide</span>
          <span className="h-num">₦45,000</span>
        </div>
        <div className="h-sl h-paidrow">
          <span>Paid so far</span>
          <span className="h-num">₦50,000</span>
        </div>
        <div className="h-stot">
          <span>Balance</span>
          <b className="h-num">₦75,000</b>
        </div>
        <span className="h-pill h-part">Part paid</span>
      </div>
    </div>
  )
}

function ReceiptSheet() {
  return (
    <div className="h-sheet h-rec">
      <div className="h-sbd">
        <div className="h-rtop">
          <span className="h-mg">AO</span>
          <span>
            Receipt <span className="h-num">0041</span>
          </span>
        </div>
        <small>Received from</small>
        <b>Chioma Eze</b>
        <p className="h-ramt h-num">₦45,000</p>
        <small>For small chops platter, 50 guests</small>
        <span className="h-stamp" aria-hidden="true">
          Paid
        </span>
        <div className="h-sg">
          <Stroke />
        </div>
      </div>
    </div>
  )
}

function ContractSheet() {
  return (
    <div className="h-sheet h-con">
      <div className="h-sbd">
        <em className="h-ctitle">Service agreement</em>
        <small>Amaka Obi Studio and Ada Kalu</small>
        <span className="h-ch">1. The work</span>
        <i />
        <i className="h-short" />
        <span className="h-ch">2. Payment</span>
        <i />
        <i className="h-short" />
        <div className="h-signs">
          <div>
            <div className="h-sg">
              <Stroke />
            </div>
            <span>Amaka Obi</span>
          </div>
          <div>
            <div className="h-sg h-blank" />
            <span>Ada Kalu</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignSheet() {
  return (
    <div className="h-sheet h-sig">
      <div className="h-sbd">
        <span className="h-fname">Lease.pdf</span>
        <i className="h-t" />
        <i />
        <i />
        <i className="h-short" />
        <i />
        <i className="h-short" />
        <div className="h-place h-sg">
          <Stroke />
        </div>
        <span className="h-date">12 Oct 2026</span>
      </div>
    </div>
  )
}

const DOCS = [
  { k: 'inv', sheet: <InvoiceSheet />, t: 'Invoices', d: 'Bill a client in a minute. Take a deposit now and the balance updates by itself.' },
  { k: 'rec', sheet: <ReceiptSheet />, t: 'Receipts', d: 'When the money comes in, send a receipt with your name and signature on it.' },
  { k: 'con', sheet: <ContractSheet />, t: 'Contracts', d: 'Start from a ready agreement, change any line, and sign it with your own signature.' },
  { k: 'sig', sheet: <SignSheet />, t: 'Sign a PDF', d: 'Anyone can upload a PDF or a photo of a document, add their signature, initials or the date, and save the signed copy.' },
]

const EXTRAS = [
  ['Create your signature', 'Draw it with your finger, type your name in a handwriting style, or upload a photo of it. We clear the background for you.'],
  ['Send on WhatsApp', 'One tap opens the chat with your client, the message already written.'],
  ['Reminders', 'Friendly, firm or final. Pick a tone and send it.'],
  ['Part payments', 'Every payment is counted, and each one can get its own receipt.'],
  ['Any currency', 'Naira, dollar, pound or euro, chosen on each document.'],
  ['Your look', 'Six layouts, six fonts and any colour, so it feels like your brand.'],
  ['Your logo or initials', 'Upload your logo, or use your initials until you have one.'],
  ['Made for your trade', 'Starter items for hair, food, design, photography, fashion and more.'],
  ['A dashboard that keeps count', 'See what came in, what is waiting and who is late.'],
]

/** What Generate makes: four kinds of document shown as real pages, then the smaller things that come with them. */
export function Features() {
  const sec = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (!sec.current || !('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(sec.current)
    return () => io.disconnect()
  }, [])

  return (
    <section className={'h-sec h-feat' + (seen ? ' h-seen' : '')} id="features" aria-labelledby="ft" ref={sec}>
      <div className="h-in">
        <div className="h-fhead">
          <p className="h-lbl">What you can do</p>
          <h2 id="ft" className="h-big">
            Four documents. One <em className="h-s">app.</em>
          </h2>
          <p className="h-flede">Everything carries your name, your logo and your signature, and goes out from your phone.</p>
        </div>
        <ol className="h-docs">
          {DOCS.map((x, i) => (
            <li key={x.k} className="h-doc" style={{ ['--i' as string]: i }}>
              <div className="h-desk">{x.sheet}</div>
              <span className="h-dno">0{i + 1}</span>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
            </li>
          ))}
        </ol>
        <div className="h-extras">
          <p className="h-xlbl">And the small things that save you time</p>
          <ul>
            {EXTRAS.map(([t, d]) => (
              <li key={t}>
                <b>{t}</b>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
