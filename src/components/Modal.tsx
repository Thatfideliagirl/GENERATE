import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/** A simple pop up. Press Escape or tap outside the box to close it. */
export function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    box.current?.querySelector<HTMLElement>('input, button, textarea')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox" role="dialog" aria-modal="true" aria-label={label} ref={box}>
        {children}
      </div>
    </div>
  )
}
