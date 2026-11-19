import { useEffect, useRef, useState } from 'react'
import type { Doc, Profile } from '../lib/types'
import { makePdf, pdfName, saveFile } from '../lib/pdf'
import { playPrinter, setSoundOn, soundOn } from '../lib/sound'
import { PaperPreview } from './PaperPreview'

const FEED = 3.2
const LINES = 26

/**
 * A little receipt printer. The receipt that feeds out is the real one, exactly as it looks in the preview
 * and in the PDF, while the PDF is made and downloaded.
 */
export function ReceiptPrinter({ doc, profile, onClose }: { doc: Doc; profile: Profile; onClose: () => void }) {
  const [state, setState] = useState<'printing' | 'done' | 'failed'>('printing')
  const [sound, setSound] = useState(soundOn)
  const started = useRef(false)
  const stop = useRef<() => void>(() => {})

  useEffect(() => {
    if (started.current) return
    started.current = true
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduce) stop.current = playPrinter(FEED, LINES)
    const minTime = new Promise((r) => setTimeout(r, reduce ? 300 : (FEED + 0.5) * 1000))
    Promise.all([makePdf(doc, profile), minTime])
      .then(([blob]) => {
        saveFile(pdfName(doc), blob)
        setState('done')
      })
      .catch(() => setState('failed'))
  }, [doc, profile])

  useEffect(() => () => stop.current(), [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && state !== 'printing' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [state, onClose])

  const toggleSound = () => {
    const on = !sound
    setSound(on)
    setSoundOn(on)
    if (!on) stop.current()
  }

  return (
    <div className="rp-veil" role="dialog" aria-modal="true" aria-label="Printing your receipt">
      <div className="rp-stage">
        <div className="rp-printer">
          <div className="rp-top">
            <span className={`rp-led ${state}`} aria-hidden="true" />
            <span className="rp-brand">Generate</span>
            <button className="rp-snd" onClick={toggleSound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'} title={sound ? 'Sound on' : 'Sound off'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                {sound ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="m16 9.5 5 5m0-5-5 5" />}
              </svg>
            </button>
          </div>
          <div className="rp-slot" aria-hidden="true" />
        </div>

        <div className="rp-feed">
          <div className={`rp-slip ${state !== 'printing' ? 'out' : ''}`} style={{ animationDuration: `${FEED}s` }}>
            <PaperPreview doc={doc} profile={profile} className="rp-doc" />
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
