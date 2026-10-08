import { useEffect, useRef } from 'react'

const FREE = [
  'Invoices, receipts and contracts',
  'Your logo, details and signature on everything',
  'Six layouts, six fonts and any colour',
  'Part payments and a dashboard that keeps count',
  'Send on WhatsApp, with friendly, firm and final reminders',
  'Any currency, and a clean PDF',
]

/**
 * A short panel that drops down under the top strip. It shows the free plan and the paid plan that is on its way.
 * It closes with the button, the Escape key or a click anywhere outside it.
 */
export function PricingDrop({ open, onClose, onStart, cta }: { open: boolean; onClose: () => void; onStart: () => void; cta: string }) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (box.current && !box.current.contains(t) && !t.closest('[data-pricing-toggle]')) onClose()
    }
    document.addEventListener('keydown', key)
    document.addEventListener('mousedown', click)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('mousedown', click)
    }
  }, [open, onClose])

  return (
    <div className={'lp-drop' + (open ? ' open' : '')} id="pricing-panel" aria-hidden={!open}>
      <div className="lp-drop-clip">
        <div className="lp-drop-in" ref={box}>
          <div className="lp-plan free">
            <p className="lp-label">Generate</p>
            <p className="lp-plan-price">Free</p>
            <ul>
              {FREE.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="lp-btn brass" onClick={onStart} tabIndex={open ? 0 : -1}>
              {cta}
            </button>
          </div>
          <div className="lp-plan more" aria-label="Generate more, coming soon">
            <p className="lp-label">Generate more</p>
            <div className="lp-lock">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <rect x="5" y="10.5" width="14" height="10" rx="2" />
                <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
                <circle cx="12" cy="15.5" r="1.1" />
              </svg>
              <span>Coming soon</span>
            </div>
            <i />
            <i />
            <i />
          </div>
          <button type="button" className="lp-drop-x" onClick={onClose} tabIndex={open ? 0 : -1} aria-label="Close pricing">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
