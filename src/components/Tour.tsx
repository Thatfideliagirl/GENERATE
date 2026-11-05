import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

export type TourStep = { target?: string; title: string; text: string }

const KEY = 'generate.tour.'
export const tourDone = (userId: string) => {
  try {
    return localStorage.getItem(KEY + userId) === 'done'
  } catch {
    return true
  }
}
export const resetTour = (userId: string) => {
  try {
    localStorage.removeItem(KEY + userId)
  } catch {
    /* nothing to reset */
  }
}
const markDone = (userId: string) => {
  try {
    localStorage.setItem(KEY + userId, 'done')
  } catch {
    /* the tour may show again next time */
  }
}

/** The first element for a selector list that is actually showing on this screen size. */
function find(sel?: string): HTMLElement | null {
  if (!sel) return null
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
    if (el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden') return el
  }
  return null
}

/**
 * A short guided tour. It dims the page, lights up one part at a time and explains it in a card.
 * Shown once per account on this device; it can be started again from Settings.
 */
export function Tour({ userId, steps: all, onFinish }: { userId: string; steps: TourStep[]; onFinish: (made?: boolean) => void }) {
  // Steps whose part of the page is not on this screen size are left out. Checked once the page has drawn.
  const [steps, setSteps] = useState<TourStep[]>(() => all.filter((st) => !st.target))
  useLayoutEffect(() => setSteps(all.filter((st) => !st.target || find(st.target))), [all])
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[Math.min(i, steps.length - 1)]
  const last = i === steps.length - 1

  const measure = useCallback(() => {
    const el = find(step.target)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step])

  useLayoutEffect(() => {
    const el = find(step.target)
    if (el) {
      const r = el.getBoundingClientRect()
      const fixed = getComputedStyle(el).position === 'fixed' || !!el.closest('.a-side, .a-tabs')
      if (!fixed && (r.top < 80 || r.bottom > window.innerHeight - 220)) el.scrollIntoView({ block: 'center', behavior: 'auto' })
    }
    measure()
  }, [step, measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [measure])

  const finish = (made?: boolean) => {
    markDone(userId)
    onFinish(made)
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight' && !last) setI((x) => x + 1)
      if (e.key === 'ArrowLeft' && i > 0) setI((x) => x - 1)
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  })

  const pad = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardW = Math.min(360, vw - 32)
  let cardStyle: React.CSSProperties = { width: cardW, left: (vw - cardW) / 2, top: Math.max(24, vh / 2 - 120) }
  if (rect) {
    const below = rect.bottom + pad + 14
    const fitsBelow = below + 210 < vh
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 16)
    const sideRoom = rect.right + pad + 14 + cardW < vw - 16
    if (rect.height > vh * 0.5 && sideRoom) cardStyle = { width: cardW, left: rect.right + pad + 14, top: Math.max(16, Math.min(rect.top, vh - 260)) }
    else cardStyle = fitsBelow ? { width: cardW, left, top: below } : { width: cardW, left, top: Math.max(16, rect.top - pad - 14 - 200) }
  }

  return (
    <div className="a-tour" role="dialog" aria-modal="true" aria-label="A quick tour of Generate">
      {rect ? (
        <div className="a-spot" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
      ) : (
        <div className="a-dim" />
      )}
      <div className="a-tourcard" style={cardStyle}>
        <div className="a-tourtop">
          <span>
            {i + 1} of {steps.length}
          </span>
          <button className="a-tourskip" onClick={() => finish()}>
            Skip tour
          </button>
        </div>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="a-tourdots" aria-hidden="true">
          {steps.map((_, k) => (
            <i key={k} className={k === i ? 'on' : undefined} />
          ))}
        </div>
        <div className="a-tourbtns">
          {i > 0 && (
            <button className="btn" onClick={() => setI(i - 1)}>
              Back
            </button>
          )}
          {last ? (
            <button className="btn p" onClick={() => finish(true)}>
              Make my first invoice
            </button>
          ) : (
            <button className="btn p" onClick={() => setI(i + 1)} autoFocus>
              {i === 0 ? 'Show me around' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
