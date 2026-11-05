import { useLayoutEffect, useRef, useState } from 'react'
import type { Doc, Profile } from '../lib/types'
import { DocumentPaper } from './DocumentPaper'

/** Shows the 760 pixel wide document shrunk to fit the screen. */
export function PaperPreview({ doc, profile, className = '' }: { doc: Doc; profile: Profile; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | undefined>()

  useLayoutEffect(() => {
    const fit = () => {
      if (!wrap.current || !inner.current) return
      const k = Math.min(1, wrap.current.clientWidth / 760)
      setScale(k)
      setHeight(Math.ceil(inner.current.offsetHeight * k))
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (wrap.current) ro.observe(wrap.current)
    if (inner.current) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div className={'pvw ' + className} ref={wrap} style={{ height }}>
      <div ref={inner} className="pvin" style={{ transform: `scale(${scale})` }}>
        <DocumentPaper doc={doc} profile={profile} />
      </div>
    </div>
  )
}
