import { initialsOf } from '../lib/initials'

/** The business initials drawn as a logo: a thin brass ring and bold serif letters. It takes the colour of the text around it. */
export function Monogram({ name, size = 58, className = '' }: { name: string; size?: number; className?: string }) {
  const text = initialsOf(name)
  return (
    <span
      className={'mg ' + className}
      style={{ width: size, height: size, fontSize: Math.round(size * (text.length > 1 ? 0.4 : 0.5)) }}
      aria-hidden="true"
    >
      <span>{text}</span>
    </span>
  )
}
