import { useEffect, useState } from 'react'
import { Reveal } from './Reveal'
import { SceneChat } from './SceneChat'
import { prefersReducedMotion, useReveal } from './useReveal'

export interface Step {
  t: string
  d: string
}

/**
 * The three steps beside a picture of the pencil with a phone. The steps take turns being highlighted,
 * and the conversation on the phone plays out: the invoice is sent, the client replies.
 */
export function HowSteps({ steps, message }: { steps: Step[]; message: string }) {
  const [active, setActive] = useState(0)
  const [hold, setHold] = useState(false)
  const [ref, seen] = useReveal<HTMLDivElement>(0.3)

  useEffect(() => {
    if (prefersReducedMotion() || hold || !seen) return
    const id = setTimeout(() => setActive((a) => (a + 1) % steps.length), 4200)
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
        <div className="lp-scene-clip">
          <div className="lp-scene" role="img" aria-label="A smiling pencil sitting beside a phone. The invoice has been sent on WhatsApp and the client is replying.">
            <img src="./images/scene.webp" width={1182} height={908} alt="" loading="lazy" decoding="async" />
            <SceneChat message={message} play={seen && !hold} />
            <svg className="lp-plane" viewBox="0 0 48 48" aria-hidden="true" key={seen ? 'go' : 'wait'}>
              <path d="M4 22 44 4 30 44 22 28 4 22Zm18 6 22-24" />
            </svg>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
