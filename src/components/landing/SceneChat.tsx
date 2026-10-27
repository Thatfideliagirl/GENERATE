import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './useReveal'

/** Moments in the conversation, in milliseconds from the start of each round. */
const AT = [350, 1150, 2400, 3100, 4700, 6500]
const ROUND = 12000

/**
 * The conversation drawn over the phone screen in the picture: the invoice goes out, the client sees it,
 * types, and replies. It repeats while it is on screen, and stays finished for people who prefer less motion.
 */
export function SceneChat({ message, play }: { message: string; play: boolean }) {
  const still = prefersReducedMotion()
  const [n, setN] = useState(still ? AT.length : 0)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (still || !play) return
    setN(0)
    const timers = AT.map((ms, i) => setTimeout(() => setN(i + 1), ms))
    const again = setTimeout(() => setRound((r) => r + 1), ROUND)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(again)
    }
  }, [play, round, still])

  return (
    <div className="lp-sc" aria-hidden="true">
      <div className="lp-sc-in" key={round}>
        {n >= 1 && (
          <div className="sc out file">
            <span className="sc-doc" />
            <span>
              <b>Invoice-0042.pdf</b>
              <i>125 KB · PDF</i>
            </span>
          </div>
        )}
        {n >= 2 && (
          <div className="sc out">
            {message}
            <span className={'sc-time' + (n >= 3 ? ' seen' : '')}>10:24 AM ✓✓</span>
          </div>
        )}
        {n === 4 && (
          <div className="sc in typing">
            <i />
            <i />
            <i />
          </div>
        )}
        {n >= 5 && (
          <div className="sc in">
            Received, thank you for sending the invoice.
            <span className="sc-time">10:25 AM</span>
          </div>
        )}
        {n >= 6 && (
          <div className="sc in">
            Okay, I will make the payment today.
            <span className="sc-time">10:26 AM</span>
          </div>
        )}
      </div>
    </div>
  )
}
