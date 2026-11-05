import { useEffect, useRef, useState } from 'react'
import { SectionLink, Stroke } from './site'

/** The six screens the phone shows, one per step: chat, setup, make, send, dashboard, sign. */
function Screens({ on }: { on: number }) {
  const cls = (n: number) => 'h-sc' + (on === n ? ' h-on' : '')
  return (
    <div className="h-scr">
      <div className={cls(0)} data-s="0">
        <div className="h-wah">
          <i />
          <span>
            Mr. Wale<small>online</small>
          </span>
        </div>
        <div className="h-wab">
          <span className="h-day">Today</span>
          <div className="h-bu h-bout">
            Good morning, Mr. Wale. Your invoice for the logo design is ready.<small>10:20 ✓✓</small>
          </div>
          <div className="h-bu h-bin">Good morning. Thank you, please send it.</div>
          <div className="h-bu h-bout">
            <div className="h-file">
              <u>PDF</u>
              <span>
                <b>Invoice-0042.pdf</b>1 page · 84 KB
              </span>
            </div>
            Hello Mr. Wale, here is your invoice from Amaka Obi Studio for ₦125,000, due on Friday. If you have any questions, please reach out. Thank you for your business.
            <small>10:24 ✓✓</small>
          </div>
          <div className="h-bu h-bin">Received with thanks. I will pay today.</div>
        </div>
      </div>

      <div className={cls(1)} data-s="1">
        <div className="h-ah">
          Set up your business<small>1 of 3</small>
        </div>
        <div className="h-prog">
          <i style={{ width: '34%' }} />
        </div>
        <div className="h-fld">
          <span>Business name</span>
          <b>Amaka Obi Studio</b>
        </div>
        <div className="h-fld">
          <span>WhatsApp number</span>
          <b>0803 123 4567</b>
        </div>
        <div className="h-row2">
          <span className="h-mg">AO</span>
          <span className="h-ghost">Upload your logo, or keep your initials</span>
        </div>
        <div className="h-fld" style={{ paddingBottom: 4 }}>
          <span>Your signature</span>
        </div>
        <div className="h-sigbox">
          <Stroke />
        </div>
        <div className="h-chips">
          <span className="h-chip h-on">Draw</span>
          <span className="h-chip">Type</span>
          <span className="h-chip">Upload</span>
        </div>
        <div className="h-pbtn">Continue</div>
      </div>

      <div className={cls(2)} data-s="2">
        <div className="h-ah">
          New document<small>Draft</small>
        </div>
        <div className="h-tabs">
          <span className="h-on">Invoice</span>
          <span>Receipt</span>
          <span>Contract</span>
        </div>
        <div className="h-fld">
          <span>Client</span>
          <b>Tunde Bello</b>
        </div>
        <div>
          <div className="h-it">
            <span>
              Logo design<small>1 × ₦80,000</small>
            </span>
            <b className="h-num">₦80,000</b>
          </div>
          <div className="h-it">
            <span>
              Brand guide<small>1 × ₦45,000</small>
            </span>
            <b className="h-num">₦45,000</b>
          </div>
          <div className="h-it" style={{ color: 'var(--clay)' }}>
            <span>+ Add item</span>
          </div>
        </div>
        <div className="h-chips">
          <span className="h-chip h-on">₦ Naira</span>
          <span className="h-chip">$</span>
          <span className="h-chip">£</span>
          <span className="h-chip">€</span>
        </div>
        <div className="h-sw">
          Take a deposit first
          <i />
        </div>
        <div className="h-tot">
          <span>Total</span>
          <b className="h-num">₦125,000</b>
        </div>
        <div className="h-pbtn">Preview</div>
      </div>

      <div className={cls(3)} data-s="3">
        <div className="h-ah">
          Invoice 0042<small>Ready</small>
        </div>
        <div className="h-paper">
          <div className="h-ph">
            <span className="h-row2">
              <span className="h-mg">AO</span>Amaka Obi Studio
            </span>
            <em>Invoice</em>
          </div>
          <div className="h-pb">
            <div style={{ color: 'var(--mu)' }}>Billed to</div>
            <b>Tunde Bello</b>
            <div className="h-it" style={{ marginTop: 8 }}>
              <span>Logo design</span>
              <span className="h-num">₦80,000</span>
            </div>
            <div className="h-it">
              <span>Brand guide</span>
              <span className="h-num">₦45,000</span>
            </div>
            <div className="h-tot" style={{ marginTop: 4 }}>
              <span>Total due</span>
              <b className="h-num" style={{ fontSize: 15 }}>
                ₦125,000
              </b>
            </div>
            <div className="h-sg">
              <Stroke />
            </div>
          </div>
        </div>
        <div className="h-two">
          <span>Download PDF</span>
          <span className="h-w">Send on WhatsApp</span>
        </div>
      </div>

      <div className={cls(4)} data-s="4">
        <div className="h-hi">
          Good morning, <em>Amaka.</em>
        </div>
        <div className="h-tiles">
          <div className="h-dk">
            <b className="h-num">₦480k</b>Received
          </div>
          <div>
            <b className="h-num">₦75k</b>Waiting
          </div>
          <div>
            <b>1</b>Part paid
          </div>
          <div>
            <b>2</b>Overdue
          </div>
        </div>
        <div className="h-lst">
          {[
            ['Tunde Bello', 'Invoice 0042', 'part', 'Part paid'],
            ['Chioma Eze', 'Receipt 0041', 'paid', 'Paid'],
            ['Ola Peters', 'Invoice 0039', 'late', 'Overdue'],
            ['Ada Kalu', 'Contract 0007', 'paid', 'Signed'],
          ].map(([n, d, c, t]) => (
            <div className="h-it" key={d}>
              <span>
                {n}
                <small>{d}</small>
              </span>
              <span className={'h-pill h-' + c}>{t}</span>
            </div>
          ))}
        </div>
        <div className="h-nav">
          <span className="h-on">Home</span>
          <span>Documents</span>
          <span>New</span>
          <span>Sign</span>
          <span>Profile</span>
        </div>
      </div>

      <div className={cls(5)} data-s="5">
        <div className="h-ah">
          Sign a document<small>Lease.pdf</small>
        </div>
        <div className="h-pdf">
          <div className="h-pg">
            <i className="h-t" />
            <i />
            <i />
            <i className="h-s" />
            <i />
            <i className="h-s" />
            <i />
            <div className="h-place h-sg">
              <Stroke />
            </div>
          </div>
        </div>
        <div className="h-tools">
          <span className="h-on">Signature</span>
          <span>Initials</span>
          <span>Date</span>
          <span>Text</span>
          <span>Line</span>
        </div>
        <div className="h-pbtn">Save signed PDF</div>
      </div>
    </div>
  )
}

type Step = { s: number; side: 'l' | 'r'; id?: string; no: string; h: [string, string, string?]; p: string; tags?: string[] }

const STEPS: Step[] = [
  { s: 1, side: 'l', id: 'how', no: '01', h: ['Start with your', 'details.'], p: 'Add your logo, business information and signature once. We’ll remember them for you.' },
  { s: 2, side: 'r', no: '02', h: ['Make the', 'document.'], p: 'Choose an invoice, receipt or contract. Add your client and the details of the job.', tags: ['Part payments', 'Any currency', 'Six layouts'] },
  { s: 3, side: 'l', no: '03', h: ['Send it your', 'way.'], p: 'Download it as a PDF or send it straight to your client on WhatsApp.' },
  { s: 4, side: 'r', no: 'Your dashboard', h: ['See where every', 'naira', ' is.'], p: 'Each invoice shows its status by itself. Add a part payment and the balance updates. Send a friendly, firm or final reminder in one tap.' },
  { s: 5, side: 'l', id: 'sign', no: 'Sign any document', h: ['Got a PDF to sign?', 'Done.'], p: 'Open any PDF or photo of a document, drop your signature, initials or the date where they belong, and save the signed copy.' },
]

/**
 * One phone carries the whole story. It stays pinned while the steps scroll past,
 * and shows the screen of whichever step is nearest the middle of the window.
 */
export function PhoneStory() {
  const [on, setOn] = useState(0)
  const box = useRef<HTMLElement>(null)

  useEffect(() => {
    let ticking = false
    const pick = () => {
      ticking = false
      const steps = box.current?.querySelectorAll<HTMLElement>('.h-step')
      if (!steps) return
      const mid = window.innerHeight / 2
      let best = 0
      let bd = Infinity
      steps.forEach((st) => {
        const r = st.getBoundingClientRect()
        if (r.height < 2) return
        const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid))
        if (d < bd) {
          bd = d
          best = Number(st.dataset.s)
        }
      })
      setOn(best)
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(pick)
      }
    }
    // Shrink the phone so the whole of it fits in the window, on short laptop screens too.
    const fit = () => {
      const el = box.current
      if (!el) return
      const vh = window.innerHeight
      const w = window.innerWidth
      if (w >= 960) {
        const k = Math.max(0.55, Math.min(1, (vh - 48) / 620))
        el.style.setProperty('--phs', String(k))
        el.style.setProperty('--pht', Math.max(16, Math.round((vh - 620 * k) / 2)) + 'px')
      } else {
        const base = w <= 400 ? 0.72 : 0.8
        const k = Math.max(0.55, Math.min(base, (vh - 96) / 620))
        el.style.setProperty('--phs', String(k))
        el.style.setProperty('--pht', '70px')
      }
    }
    const onResize = () => {
      fit()
      pick()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    fit()
    pick()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section className="h-in h-story" aria-label="How Generate works, shown on a phone" ref={box}>
      <div className="h-pin" aria-hidden="true">
        <div className="h-phone">
          <Screens on={on} />
        </div>
        <div className="h-dots">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <i key={i} className={i === on ? 'h-on' : undefined} />
          ))}
        </div>
      </div>

      <div className={'h-step h-r h-chatsp' + (on === 0 ? ' h-cur' : '')} data-s="0">
        <div className="h-tx">
          <span className="h-no">Where you’re going</span>
          <h2>
            Your client gets it on <em className="h-s">WhatsApp.</em>
          </h2>
          <p>An invoice with your name on it, delivered and read. Here is how you get there.</p>
          <SectionLink to="how" className="h-go">
            How to get started <span aria-hidden="true">↓</span>
          </SectionLink>
        </div>
      </div>
      {STEPS.map((st) => (
        <div key={st.s} id={st.id} className={'h-step h-' + st.side + (on === st.s ? ' h-cur' : '')} data-s={st.s}>
          <div className="h-tx">
            <span className="h-no">{st.no}</span>
            <h2>
              {st.h[0]} <em className="h-s">{st.h[1]}</em>
              {st.h[2]}
            </h2>
            <p>{st.p}</p>
            {st.tags && (
              <ul>
                {st.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </section>
  )
}
