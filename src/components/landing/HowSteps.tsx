import { useEffect, useState } from 'react'
import { PhoneChat } from './PhoneChat'
import { Reveal } from './Reveal'
import { prefersReducedMotion, useReveal } from './useReveal'

export interface Step {
  t: string
  d: string
  say: string
}

/**
 * The three steps, a phone with the WhatsApp message, and the pencil leaning on the phone.
 * The pencil talks through each step in turn and hops when the step changes.
 */
export function HowSteps({ steps, message }: { steps: Step[]; message: string }) {
  const [active, setActive] = useState(0)
  const [hold, setHold] = useState(false)
  const [ref, seen] = useReveal<HTMLDivElement>(0.3)

  useEffect(() => {
    if (prefersReducedMotion() || hold || !seen) return
    const id = setTimeout(() => setActive((a) => (a + 1) % steps.length), 3600)
    return () => clearTimeout(id)
  }, [active, hold, seen, steps.length])

  return (
    <div ref={ref} className="lp-how-in" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="lp-how-text">
        <Reveal className="lp-sec-head">
          <p className="lp-label">How it works</p>
          <h2 className="lp-h2" id="how-h">
            From setup to sent in three steps.
          </h2>
        </Reveal>
        <ol className="lp-steps">
          {steps.map((st, i) => (
            <Reveal as="li" key={st.t} delay={0.1 + i * 0.14} className={i === active ? 'cur' : ''}>
              <button type="button" className="lp-step-btn" onClick={() => setActive(i)} aria-current={i === active ? 'step' : undefined}>
                <span className="lp-n num">0{i + 1}</span>
                <span>
                  <span className="lp-step-t">{st.t}</span>
                  <span className="lp-step-d">{st.d}</span>
                </span>
              </button>
            </Reveal>
          ))}
        </ol>
      </div>
      <Reveal delay={0.2} className="lp-how-stage">
        <div className="lp-phone-wrap">
          <p className="lp-say" key={active} aria-hidden="true">
            {steps[active].say}
          </p>
          <PhoneChat message={message} client="Tunde Bello" file="Invoice-0042.pdf" />
          <img className="lp-pencil2" key={'p' + active} src="./images/pencil.webp" width={418} height={900} alt="" loading="lazy" />
        </div>
      </Reveal>
    </div>
  )
}
