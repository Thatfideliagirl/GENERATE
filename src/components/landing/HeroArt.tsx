import { useEffect, useState } from 'react'
import { prefersReducedMotion, useReveal } from './useReveal'

const TOTAL = 125000

/**
 * Coco's picture of the pencil with an invoice, a contract and a receipt.
 * The total on the invoice is baked into the picture, so a small patch the colour of the paper
 * sits over it and counts up to the same figure.
 */
export function HeroArt() {
  const [still] = useState(prefersReducedMotion)
  const [n, setN] = useState(still ? TOTAL : 0)
  const [ref, seen] = useReveal<HTMLDivElement>(0.35)

  useEffect(() => {
    if (still || !seen) return
    let raf = 0
    const start = performance.now() + 500
    const run = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - start) / 1700))
      setN(TOTAL * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [still, seen])

  return (
    <div ref={ref} className="lp-hero-img">
      <img
        src="./images/hero.webp"
        width={1536}
        height={1024}
        alt="A smiling pencil leaning on an invoice, a contract and a receipt, each in the Generate green and ivory."
        decoding="async"
      />
      <span className="lp-count num" aria-hidden="true">
        ₦{Math.round(n).toLocaleString('en-NG')}
      </span>
    </div>
  )
}
