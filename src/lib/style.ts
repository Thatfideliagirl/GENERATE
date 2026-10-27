import type { Style } from './types'
import { ACCENTS, STYLE_DEFAULTS } from './constants'
import { isHex } from './format'

export const accentOf = (s: Style): string =>
  ACCENTS[s.accent] ?? (isHex(s.accent) ? s.accent : ACCENTS.emerald)

export const textOf = (s: Style): string => (isHex(s.text) ? s.text : '#14251F')

export const paperOf = (s: Style): string => (s.paper === 'ivory' ? '#FBF8F1' : '#FFFFFF')

export const layoutOf = (s: Style): string => s.layout || STYLE_DEFAULTS.layout
export const fontOf = (s: Style): string => s.font || STYLE_DEFAULTS.font
