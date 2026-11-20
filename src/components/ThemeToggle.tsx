import { useEffect, useState } from 'react'
import { getTheme, setTheme, type Theme } from '../lib/theme'
import { MoonIcon, SunIcon } from './Icons'

/** Switches between the light Generate look and dark. Every toggle on the page stays in step. */
export function ThemeToggle({ label = false }: { label?: boolean }) {
  const [t, setT] = useState<Theme>(getTheme())
  useEffect(() => {
    const on = (e: Event) => setT((e as CustomEvent<Theme>).detail)
    window.addEventListener('generate-theme', on)
    return () => window.removeEventListener('generate-theme', on)
  }, [])
  const next: Theme = t === 'dark' ? 'light' : 'dark'
  return (
    <button className={'a-theme' + (label ? ' wide' : '')} onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {t === 'dark' ? <SunIcon /> : <MoonIcon />}
      {label && <span>{t === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}
