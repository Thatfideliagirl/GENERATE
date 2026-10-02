import { useReveal } from './useReveal'

/** A small contract whose signature draws itself when it scrolls into view. */
export function SignSheet() {
  const [ref, seen] = useReveal<HTMLDivElement>(0.4)
  return (
    <div ref={ref} className={'lp-contract' + (seen ? ' signed' : '')} aria-label="A service agreement being signed.">
      <p className="lp-label">Service agreement</p>
      <h3>Logo and brand guide</h3>
      <ol>
        <li>
          <b>Work.</b> Amaka Obi Studio will design a logo and a brand guide for Tunde Bello.
        </li>
        <li>
          <b>Fee.</b> <span className="num">₦125,000</span>, with <span className="num">₦50,000</span> paid before work starts.
        </li>
        <li>
          <b>Changes.</b> Two rounds of changes are included. More rounds are charged separately.
        </li>
      </ol>
      <div className="lp-sig-row">
        <div>
          <svg viewBox="0 0 200 60" width="140" height="42" aria-hidden="true" focusable="false">
            <path pathLength="1" className="s1" d="M6 40 C14 8 28 8 26 30 C25 46 14 50 22 38 C30 24 42 24 40 38 C39 46 48 44 54 32" />
            <path pathLength="1" className="s2" d="M54 32 C62 22 70 24 68 36 C74 28 84 26 90 34 C98 44 112 20 124 26 C134 32 140 40 166 28" />
          </svg>
          <span>Amaka Obi</span>
        </div>
        <div>
          <i />
          <span>Tunde Bello</span>
        </div>
      </div>
    </div>
  )
}
