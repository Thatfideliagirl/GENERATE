import type { ReactNode } from 'react'
import { useReveal } from './useReveal'

interface Props {
  /** Path to the finished image, for example ./images/hero.webp. Leave empty to show the marked placeholder. */
  src?: string
  alt: string
  /** What the picture should show. Printed on the placeholder so nothing is guessed. */
  brief: string
  width: number
  height: number
  eager?: boolean
  className?: string
  tilt?: number
  children?: ReactNode
}

/**
 * A photo that slides onto the page like a sheet of paper onto a desk.
 * Without a file it shows a plain placeholder block in the brand colours.
 */
export function Photo({ src, alt, brief, width, height, eager, className = '', tilt = -1.6, children }: Props) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.12)
  return (
    <div
      ref={ref}
      className={`lp-photo rise${seen || eager ? ' in' : ''} ${className}`}
      style={{ aspectRatio: `${width} / ${height}`, ['--tilt' as string]: `${tilt}deg` }}
    >
      {src ? (
        <img src={src} alt={alt} width={width} height={height} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      ) : (
        <div className="lp-ph" role="img" aria-label={`Placeholder image. ${alt}`}>
          <span className="lp-cap">Photo goes here</span>
          <span className="lp-brief">{brief}</span>
        </div>
      )}
      {children}
    </div>
  )
}
