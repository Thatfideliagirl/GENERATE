import { useEffect, useState } from 'react'
import { prefersReducedMotion, useReveal } from './useReveal'

const TOTAL = 125000
const fmt = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG')

/**
 * A receipt that writes itself once: the name, the items, the total adding up,
 * a signature drawn stroke by stroke, then a stamp. It plays one time on load.
 * With reduced motion it simply shows the finished receipt.
 */
export function HeroDoc() {
  const [still] = useState(prefersReducedMotion)
  const [total, setTotal] = useState(still ? TOTAL : 0)
  const [ref, seen] = useReveal<HTMLDivElement>(0.55)

  useEffect(() => {
    if (still || !seen) return
    let raf = 0
    const start = performance.now() + 1800
    const run = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - start) / 900))
      setTotal(TOTAL * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [still, seen])

  return (
    <div ref={ref} className={'lp-doc' + (still ? ' still' : seen ? ' play' : ' wait')} aria-label="A receipt writing itself: logo design and brand guide, total 125,000 naira, signed and stamped paid.">
      <div className="lp-doc-head">
        <span className="lp-doc-name">Amaka Obi Studio</span>
        <span className="lp-label">Receipt 0042</span>
      </div>
      <div className="lp-doc-to">
        <span className="lp-label">Received from</span>
        <b className="lp-type">Tunde Bello</b>
      </div>
      <ul className="lp-doc-lines">
        <li style={{ ['--d' as string]: '1.3s' }}>
          <span>Logo design</span>
          <span className="num">₦80,000</span>
        </li>
        <li style={{ ['--d' as string]: '1.7s' }}>
          <span>Brand guide</span>
          <span className="num">₦45,000</span>
        </li>
      </ul>
      <div className="lp-doc-total">
        <span className="lp-label">Amount paid</span>
        <span className="num">{fmt(total)}</span>
      </div>
      <div className="lp-doc-sign">
        <svg viewBox="0 0 200 60" width="150" height="45" aria-hidden="true" focusable="false">
          <path pathLength="1" className="s1" d="M6 40 C14 8 28 8 26 30 C25 46 14 50 22 38 C30 24 42 24 40 38 C39 46 48 44 54 32" />
          <path pathLength="1" className="s2" d="M54 32 C62 22 70 24 68 36 C74 28 84 26 90 34 C98 44 112 20 124 26 C134 32 140 40 166 28" />
          <path pathLength="1" className="s3" d="M36 50 C80 54 130 50 176 46" />
        </svg>
        <span className="lp-doc-stamp" aria-hidden="true">Paid</span>
      </div>
    </div>
  )
}
