import type { CSSProperties, ReactNode } from 'react'
import { useReveal } from './useReveal'

/** Rises into place once it scrolls into view. Children can be staggered with delay (seconds). */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const [ref, seen] = useReveal<HTMLElement>(0.12)
  return (
    <Tag ref={ref as never} className={`rv${seen ? ' in' : ''} ${className}`} style={{ ['--d' as string]: `${delay}s` } as CSSProperties}>
      {children}
    </Tag>
  )
}
