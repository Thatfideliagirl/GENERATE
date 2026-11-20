import { useEffect, useRef, useState } from 'react'
import { reducedMotion } from './site'

const ROLES = [
  {
    name: 'Freelancers',
    tags: 'Design · Photo · Writing',
    img: { src: './landing/freelancer.webp', w: 614, h: 768, alt: 'A freelancer at her laptop, smiling at the camera.' },
    cap: ['Look professional from your first client.', 'Send invoices and contracts with your own name and signature.', 'Logo design', '₦80,000'],
  },
  {
    name: 'Shop owners',
    tags: 'Food · Hair · Fashion',
    img: { src: './landing/shop.webp', w: 614, h: 768, alt: 'A food seller in an apron holding his phone beside packed orders.' },
    cap: ['Know who has paid, and who has not.', 'Every invoice, receipt and agreement in one place.', 'Small chops platter', '₦45,000'],
  },
  {
    name: 'Growing brands',
    tags: 'Teams · Agencies',
    img: { src: './landing/brand.webp', w: 920, h: 1150, alt: 'Two cofounders smiling, one holding a printed document.' },
    cap: ['One look on everything you send.', 'Your logo, colours and signature on every document.', 'Event setup', '₦350,000'],
  },
  {
    name: 'Anyone',
    tags: 'One invoice or a hundred',
    img: { src: './landing/anyone.webp', w: 614, h: 768, alt: 'A consultant in a head wrap holding a printed document.' },
    cap: ['If you need an invoice, Generate is for you.', 'One document or a hundred. Free to start.', 'Consulting session', '₦50,000'],
  },
]

/** Four kinds of people. It moves on by itself until someone taps or points at one, then it stays put. */
export function WhoFor() {
  const [at, setAt] = useState(0)
  const [held, setHeld] = useState(false)
  const sec = useRef<HTMLElement>(null)

  useEffect(() => {
    if (held || reducedMotion() || !('IntersectionObserver' in window) || !sec.current) return
    let timer = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !timer) timer = window.setInterval(() => setAt((a) => (a + 1) % ROLES.length), 4200)
        if (!e.isIntersecting && timer) {
          window.clearInterval(timer)
          timer = 0
        }
      },
      { threshold: 0.4 },
    )
    io.observe(sec.current)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [held])

  const choose = (i: number) => {
    setAt(i)
    setHeld(true)
  }
  const r = ROLES[at]

  return (
    <section className="h-sec h-who" id="who" aria-labelledby="wh" ref={sec}>
      <div className="h-in h-wrap">
        <div>
          <p className="h-lbl">Who it is for</p>
          <h2 id="wh" className="h-big">
            Made for <em className="h-s">your</em> business.
          </h2>
          <ul className={'h-roles' + (held ? ' h-held' : '')} role="tablist" aria-label="Who it is for">
            {ROLES.map((x, i) => (
              <li key={x.name}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={i === at}
                  aria-controls="who-panel"
                  onClick={() => choose(i)}
                  onMouseEnter={() => choose(i)}
                >
                  <span>{x.name}</span>
                  <small>{x.tags}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="h-stage" role="tabpanel" id="who-panel" aria-live="polite">
          <span className="h-tag">{r.name}</span>
          {ROLES.map((x, i) => (
            <img
              key={x.name}
              className={i === at ? 'h-on' : undefined}
              src={x.img.src}
              alt={i === at ? x.img.alt : ''}
              width={x.img.w}
              height={x.img.h}
              loading={i === 0 ? undefined : 'lazy'}
            />
          ))}
          <div className="h-cap">
            <b>{r.cap[0]}</b>
            <p>{r.cap[1]}</p>
            <div className="h-it">
              <span>{r.cap[2]}</span>
              <span className="h-num">{r.cap[3]}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
