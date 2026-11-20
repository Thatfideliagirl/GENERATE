/** Light is the Generate look. Dark is a choice people make in Settings; it is never switched on by the phone or laptop. */
export type Theme = 'light' | 'dark'
const KEY = 'generate.theme'

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(t: Theme = getTheme()) {
  document.documentElement.dataset.theme = t
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* the choice lasts for this visit only */
  }
  applyTheme(t)
  window.dispatchEvent(new CustomEvent('generate-theme', { detail: t }))
}

/** The accent colour used for highlights inside the app. Clay is the Generate default. */
export const ACCENT_CHOICES: [string, string][] = [
  ['clay', '#B4603F'],
  ['emerald', '#1E7A5A'],
  ['ocean', '#2D6CB5'],
  ['plum', '#8A3B6E'],
  ['gold', '#A97C1F'],
  ['rose', '#C2546B'],
]
const ACCENT_KEY = 'generate.accent'

export function getAccent(): string {
  try {
    const a = localStorage.getItem(ACCENT_KEY)
    return ACCENT_CHOICES.some(([k]) => k === a) ? (a as string) : 'clay'
  } catch {
    return 'clay'
  }
}

export function applyAccent(name: string = getAccent()) {
  const hex = ACCENT_CHOICES.find(([k]) => k === name)?.[1]
  const root = document.documentElement
  if (!hex || name === 'clay') {
    delete root.dataset.accent
    root.style.removeProperty('--accent-base')
    return
  }
  root.dataset.accent = name
  root.style.setProperty('--accent-base', hex)
}

export function setAccent(name: string) {
  try {
    localStorage.setItem(ACCENT_KEY, name)
  } catch {
    /* lasts for this visit only */
  }
  applyAccent(name)
  window.dispatchEvent(new CustomEvent('generate-accent', { detail: name }))
}
