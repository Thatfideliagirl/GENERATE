import { useEffect, useState } from 'react'

/** True while the window is at least this many pixels wide. */
export function useWide(px: number) {
  const q = `(min-width: ${px}px)`
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setWide(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [q])
  return wide
}
