import type { DocType, DocStatus } from './types'

export const BRAND = 'Generate'

export const ACCENTS: Record<string, string> = {
  emerald: '#0F4D3C',
  navy: '#1F3A5F',
  charcoal: '#2B2B2B',
  plum: '#5B2A4E',
  burgundy: '#7A1F2B',
  teal: '#0E6B73',
  royal: '#2D4DA8',
  bronze: '#8C6D2F',
}

export const TEXT_COLOURS: Record<string, string> = {
  '#14251F': 'Ink',
  '#2B2B2B': 'Charcoal',
  '#0B3A2D': 'Forest',
  '#1F3A5F': 'Navy',
  '#4A3B2A': 'Brown',
}

export const LAYOUTS: Record<string, string> = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Minimal',
  boxed: 'Framed',
  split: 'Split',
  bold: 'Bold',
}

export const FONTS: Record<string, string> = {
  editorial: 'Editorial',
  serif: 'Classic serif',
  sans: 'Clean sans',
  elegant: 'Elegant',
  rounded: 'Soft',
  mono: 'Typewriter',
}

export const PAPERS: Record<string, string> = { white: 'White', ivory: 'Ivory' }

export const STYLE_DEFAULTS = { layout: 'classic', font: 'editorial', paper: 'white' } as const

export const CURRENCIES: [string, string][] = [
  ['₦', '₦ Naira'],
  ['$', '$ Dollar'],
  ['£', '£ Pound'],
  ['€', '€ Euro'],
]

export const BUSINESS_TYPES: [string, string][] = [
  ['solo', 'Freelancer or solo'],
  ['small', 'Small business'],
  ['large', 'Bigger brand with a team'],
]

export const TRADES: Record<string, string> = {
  hair: 'Hair and beauty',
  food: 'Food and catering',
  design: 'Design and creative',
  photo: 'Photography and video',
  fashion: 'Fashion and tailoring',
  consult: 'Consulting and training',
  other: 'Something else',
}

export const TRADE_ITEMS: Record<string, string[]> = {
  hair: ['Wig install', 'Hair treatment', 'Braiding', 'Hair bundle', 'Wig customisation'],
  food: ['Small chops platter', 'Cake', 'Catering per head', 'Delivery', 'Event setup'],
  design: ['Logo design', 'Brand guide', 'Social media pack', 'Website design', 'Revision round'],
  photo: ['Photo session', 'Video editing', 'Event coverage', 'Edited photos', 'Drone shots'],
  fashion: ['Custom outfit', 'Alterations', 'Fabric', 'Fitting session', 'Rush fee'],
  consult: ['Consulting session', 'Workshop', 'Training day', 'Strategy report', 'Follow up call'],
}

export const DOC_LABEL: Record<DocType, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  contract: 'Contract',
}

export const STATUS_LABEL: Record<DocStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  part: 'Part paid',
  overdue: 'Overdue',
  signed: 'Signed',
}

export const PAY_METHODS = ['Bank transfer', 'Cash', 'POS', 'Card', 'Other']

export const SIGNATURE_FONTS: [string, string][] = [
  ['Great Vibes', 'Flowing'],
  ['Dancing Script', 'Casual'],
  ['Caveat', 'Handwritten'],
]
