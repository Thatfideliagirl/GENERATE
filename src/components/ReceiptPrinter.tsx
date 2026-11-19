import { useEffect, useRef, useState } from 'react'
import type { Doc, Profile } from '../lib/types'
import { totals } from '../lib/calc'
import { fmtDate, money } from '../lib/format'
import { makePdf, pdfName, saveFile } from '../lib/pdf'

/**
 * A little receipt printer that feeds out a paper slip while the real PDF is made.
 * The slip is only for the moment; the downloaded file is the proper receipt.
 */
export function ReceiptPrinter({ doc, profile, onClose }: { doc: Doc; profile: Profile; onClose: () => void }) {
  const [state, setState] = useState<'printing' | 'done' | 'failed'>('printing')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const minTime = new Promise((r) => setTimeout(r, reduce ? 300 : 3200))
    Promise.all([makePdf(doc, profile), minTime])
      .then(([blob]) => {
        saveFile(pdfName(doc), blob)
        setState('done')
      })
      .catch(() => setState('failed'))
  }, [doc, profile])

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && state !== 'printing' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [state, onClose])

  const t = totals(doc)
  const c = doc.currency
  const rows = doc.items.filter((i) => i.d || Number(i.p))

  return (
    <div className="rp-veil" role="dialog" aria-modal="true" aria-label="Printing your receipt">
      <div className="rp-stage">
        <div className="rp-printer" aria-hidden="true">
          <div className="rp-top">
            <span className={`rp-led ${state}`} />
            <span className="rp-brand">Generate</span>
          </div>
          <div className="rp-slot" />
        </div>

        <div className="rp-feed">
          <div className={`rp-slip ${state !== 'printing' ? 'out' : ''}`}>
            <div className="rp-paper">
              <div className="rp-c rp-biz">{profile.name}</div>
              {profile.address && <div className="rp-c rp-mu">{profile.address}</div>}
              {profile.phone && <div className="rp-c rp-mu">{profile.phone}</div>}
              <div className="rp-rule" />
              <div className="rp-c rp-kind">Receipt</div>
              <div className="rp-row"><span>No.</span><span>{doc.number}</span></div>
              <div className="rp-row"><span>Date</span><span>{fmtDate(doc.issueDate)}</span></div>
              {doc.client.name && <div className="rp-row"><span>For</span><span>{doc.client.name}</span></div>}
              <div className="rp-rule" />
              {rows.map((i, k) => (
                <div key={k} className="rp-item">
                  <div>{i.d || 'Item'}</div>
                  <div className="rp-row rp-mu">
                    <span>{Number(i.q) || 1} × {money(i.p, c)}</span>
                    <span>{money((Number(i.q) || 0) * (Number(i.p) || 0), c)}</span>
                  </div>
                </div>
              ))}
              <div className="rp-rule" />
              {t.disc > 0 && <div className="rp-row"><span>Discount</span><span>−{money(t.disc, c)}</span></div>}
              {t.vat > 0 && <div className="rp-row"><span>VAT {t.rate}%</span><span>{money(t.vat, c)}</span></div>}
              <div className="rp-row rp-total"><span>Total</span><span>{money(t.total, c)}</span></div>
              {doc.method && <div className="rp-row rp-mu"><span>Paid by</span><span>{doc.method}</span></div>}
              <div className="rp-rule" />
              <div className="rp-c rp-thanks">Thank you</div>
              <div className="rp-c rp-mu rp-small">Made with Generate</div>
            </div>
            <div className="rp-tear" />
          </div>
        </div>

        <div className="rp-msg" aria-live="polite">
          {state === 'printing' && <p>Printing your receipt…</p>}
          {state === 'done' && (
            <>
              <p>Your receipt is ready. The PDF is in your downloads.</p>
              <button className="btn p" onClick={onClose} autoFocus>Done</button>
            </>
          )}
          {state === 'failed' && (
            <>
              <p>Could not make the PDF. Try again.</p>
              <button className="btn" onClick={onClose} autoFocus>Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
