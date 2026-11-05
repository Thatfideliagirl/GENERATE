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
