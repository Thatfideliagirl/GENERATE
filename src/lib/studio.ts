import type { Profile } from './types'
import { TRADE_ITEMS } from './constants'
import { fmtDate, today } from './format'

/**
 * The template gallery: things a business makes and shares beyond invoices and receipts.
 * Each category has its own fields and five designs with their own names.
 * Everything is drawn on a fixed size card (540 wide) and saved as a picture twice that size.
 */

export type CatId = 'pricelist' | 'thankyou' | 'paycard' | 'promo' | 'festive' | 'delivery'

export interface Row {
  a: string
  b: string
  c: string
  /** Highlighted line, like a best seller. */
  h?: boolean
}

export type Align = '' | 'l' | 'c' | 'r'
export type PicShape = 'square' | 'rounded' | 'circle'

/** How the design is shown: what to include, colours, background, fonts, sizes and an added picture. */
export interface CardOptions {
  showLogo: boolean
  /** A logo picked just for this design. Empty uses the profile logo. */
  logo: string
  showPhone: boolean
  showSocials: boolean
  showSign: boolean
  /** The small "Made with Generate" line. */
  mark: boolean
  align: Align
  /** Main colour. Empty keeps the design's own colour. */
  color: string
  /** Background colour. Empty keeps the design's own background. */
  bg: string
  bgImage: string
  /** How strongly the background picture shows, 0 to 1. */
  bgOpacity: number
  headFont: string
  textFont: string
  headSize: number
  textSize: number
  pic: string
  /** Picture height divided by width. */
  picAspect: number
  /** Top left corner of the picture as a fraction of the card. */
  picX: number
  picY: number
  /** Picture width as a fraction of the card. */
  picW: number
  picShape: PicShape
}

export const DEFAULT_OPTIONS: CardOptions = {
  showLogo: true,
  logo: '',
  showPhone: true,
  showSocials: true,
  showSign: false,
  mark: true,
  align: '',
  color: '',
  bg: '',
  bgImage: '',
  bgOpacity: 0.35,
  headFont: '',
  textFont: '',
  headSize: 1,
  textSize: 1,
  pic: '',
  picAspect: 1,
  picX: 0.5,
  picY: 0.12,
  picW: 0.4,
  picShape: 'rounded',
}

export const optionsOf = (c: CardContent): CardOptions => ({ ...DEFAULT_OPTIONS, ...(c.o || {}) })

/** Fonts people can choose for headings and text. All of them are already loaded by the app. */
export const CARD_FONTS: [string, string][] = [
  ['', 'The design\'s own'],
  ["'Geist', sans-serif", 'Modern'],
  ["'Hanken Grotesk', sans-serif", 'Bold and clean'],
  ["'Fraunces', serif", 'Classic serif'],
  ["'Playfair Display', serif", 'Elegant'],
  ["'Bodoni Moda', serif", 'Fashion'],
  ["'Cormorant Garamond', serif", 'Soft serif'],
  ["'Instrument Serif', serif", 'Editorial'],
  ["'Caveat', cursive", 'Handwritten'],
  ["'Dancing Script', cursive", 'Casual script'],
  ["'Great Vibes', cursive", 'Flowing script'],
]

/** One flat set of fields. Each category uses the ones it needs. */
export interface CardContent {
  title: string
  subtitle: string
  big: string
  message: string
  to: string
  from: string
  items: Row[]
  dates: string
  code: string
  cta: string
  bank: string
  acct: string
  acctName: string
  number: string
  date: string
  address: string
  phone: string
  currency: string
  o?: Partial<CardOptions>
}

export type FieldKind = 'text' | 'area' | 'items'

export interface Field {
  key: keyof CardContent
  label: string
  kind?: FieldKind
  hint?: string
  /** For item lists: the labels of the three columns, an empty label hides the column. */
  cols?: [string, string, string]
}

export interface StyleDef {
  id: string
  name: string
  blurb: string
  /** Festive styles carry their own words for the day. */
  title?: string
  message?: string
}

export interface Category {
  id: CatId
  name: string
  word: string
  lead: string
  /** What you do with it, shown on the category tile. */
  use: string
  size: { w: number; h: number }
  fields: Field[]
  styles: StyleDef[]
  /** Delivery notes are documents, so they also download as a PDF. */
  pdf?: boolean
  /** Designs that have a place for the owner's signature. */
  sign?: boolean
}

export const CATEGORIES: Category[] = [
  {
    id: 'pricelist',
    name: 'Price list and menu',
    word: 'price list',
    lead: 'Type what you sell and your prices once. Pick a design and share it as a picture on WhatsApp, your status or Instagram.',
    use: 'For your status, your page and anyone who asks "how much?"',
    size: { w: 540, h: 675 },
    fields: [
      { key: 'title', label: 'Heading' },
      { key: 'subtitle', label: 'Small line under the heading' },
      { key: 'items', label: 'What you sell', kind: 'items', cols: ['Item', 'Price', 'Short note'] },
      { key: 'currency', label: 'Currency sign', hint: 'For example ₦, $ or £' },
      { key: 'message', label: 'Note at the bottom', kind: 'area', hint: 'Delivery, opening hours, how to order' },
    ],
    styles: [
      { id: 'ledger', name: 'Ledger', blurb: 'Cream paper, serif type and dotted lines, like a classic menu' },
      { id: 'chalk', name: 'Chalkboard', blurb: 'Handwritten on a green board, warm and friendly' },
      { id: 'market', name: 'Market Day', blurb: 'Bold blocks of your colour with prices that jump out' },
      { id: 'boutique', name: 'Boutique', blurb: 'Quiet, centred and elegant, with plenty of space' },
      { id: 'midnight', name: 'Midnight', blurb: 'Deep navy with gold prices, for a premium feel' },
    ],
  },
  {
    id: 'thankyou',
    name: 'Thank you card',
    word: 'thank you card',
    lead: 'A warm note for a customer after they buy or pay. People remember who thanked them.',
    use: 'Send after a sale, a payment or a first order',
    size: { w: 540, h: 675 },
    sign: true,
    fields: [
      { key: 'title', label: 'Big words' },
      { key: 'to', label: 'Who it is for', hint: 'Their name, or leave it empty' },
      { key: 'message', label: 'Your message', kind: 'area' },
      { key: 'from', label: 'Signed by' },
    ],
    styles: [
      { id: 'script', name: 'Handwritten', blurb: 'Ivory card with flowing script, like a note by hand' },
      { id: 'bloom', name: 'Bloom', blurb: 'Soft blush with gentle round shapes' },
      { id: 'kraft', name: 'Kraft Tag', blurb: 'A brown paper gift tag on a string' },
      { id: 'gold', name: 'Gold Leaf', blurb: 'Black and gold with a fine frame' },
      { id: 'clean', name: 'Clean Note', blurb: 'White, simple and modern with one line of your colour' },
    ],
  },
  {
    id: 'paycard',
    name: 'Payment details card',
    word: 'payment card',
    lead: 'Your bank details on one neat card, ready whenever someone asks "how do I pay you?". No more typing them out.',
    use: 'Send it before a payment, pin it on your status',
    size: { w: 540, h: 675 },
    fields: [
      { key: 'title', label: 'Heading' },
      { key: 'bank', label: 'Bank' },
      { key: 'acct', label: 'Account number' },
      { key: 'acctName', label: 'Account name' },
      { key: 'message', label: 'Note', kind: 'area', hint: 'For example: send your proof of payment on WhatsApp' },
      { key: 'phone', label: 'WhatsApp number' },
    ],
    styles: [
      { id: 'slip', name: 'Bank Slip', blurb: 'A tidy slip with your colour across the top' },
      { id: 'card', name: 'Debit Card', blurb: 'Your details drawn on a bank card' },
      { id: 'roll', name: 'Receipt Roll', blurb: 'A long paper roll, like a till receipt' },
      { id: 'bold', name: 'Bold Block', blurb: 'Your colour from edge to edge, the number in big type' },
      { id: 'simple', name: 'Simple', blurb: 'White and clean, easy to read on any phone' },
    ],
  },
  {
    id: 'promo',
    name: 'Promo flyer',
    word: 'promo flyer',
    lead: 'Announce a sale, a discount or new stock. Big words up front, the details after.',
    use: 'For a sale, a discount, new stock or an event',
    size: { w: 540, h: 675 },
    fields: [
      { key: 'big', label: 'The big words', hint: 'For example 20% OFF or NEW IN' },
      { key: 'title', label: 'What it is' },
      { key: 'message', label: 'Details', kind: 'area' },
      { key: 'dates', label: 'When' },
      { key: 'code', label: 'Code or offer', hint: 'Leave empty if there is none' },
      { key: 'cta', label: 'What people should do' },
    ],
    styles: [
      { id: 'bigsale', name: 'Big Sale', blurb: 'Huge numbers in your colour on warm cream' },
      { id: 'tag', name: 'Price Tag', blurb: 'A swing tag on a dark background' },
      { id: 'spot', name: 'Spotlight', blurb: 'Navy with a soft glow behind the offer' },
      { id: 'news', name: 'Newsprint', blurb: 'Front page news, with headline and columns' },
      { id: 'sticker', name: 'Sticker', blurb: 'Bright and playful with a round sticker' },
    ],
  },
  {
    id: 'festive',
    name: 'Festive cards',
    word: 'festive card',
    lead: 'Greet your customers on the days that matter. Each design is made for its day, the words are yours to change.',
    use: 'Christmas, Sallah, New Year, Independence Day and Easter',
    size: { w: 540, h: 675 },
    fields: [
      { key: 'title', label: 'Greeting' },
      { key: 'message', label: 'Your message', kind: 'area' },
      { key: 'from', label: 'From' },
    ],
    styles: [
      { id: 'evergreen', name: 'Evergreen', blurb: 'Christmas in deep green and gold', title: 'Merry Christmas', message: 'Thank you for being with us this year. Wishing you and your family joy, peace and plenty.' },
      { id: 'crescent', name: 'Crescent', blurb: 'Sallah in deep teal with a golden moon', title: 'Eid Mubarak', message: 'May this Sallah bring you peace, joy and blessings. Thank you for your support.' },
      { id: 'confetti', name: 'Confetti', blurb: 'New Year with colour falling from the top', title: 'Happy New Year', message: 'Thank you for a wonderful year. We cannot wait to serve you again in the new one.' },
      { id: 'greenwhite', name: 'Green White Green', blurb: 'Independence Day in our colours', title: 'Happy Independence Day', message: 'Proudly Nigerian, proudly serving you. Happy Independence Day.' },
      { id: 'lilies', name: 'Easter Morning', blurb: 'Easter in soft morning light', title: 'Happy Easter', message: 'Wishing you a joyful Easter filled with hope, love and new beginnings.' },
    ],
  },
  {
    id: 'delivery',
    name: 'Delivery note',
    word: 'delivery note',
    lead: 'Goes with the goods. Lists what was sent, and has space for the customer to sign when it arrives.',
    use: 'For shops and brands that send goods',
    size: { w: 540, h: 764 },
    pdf: true,
    sign: true,
    fields: [
      { key: 'number', label: 'Number' },
      { key: 'date', label: 'Date' },
      { key: 'to', label: 'Deliver to' },
      { key: 'address', label: 'Address', kind: 'area' },
      { key: 'phone', label: 'Their phone' },
      { key: 'items', label: 'What is in the package', kind: 'items', cols: ['Item', 'Quantity', 'Note'] },
      { key: 'message', label: 'Note for the rider or the customer', kind: 'area' },
    ],
    styles: [
      { id: 'classic', name: 'Classic', blurb: 'Your colour across the top, everything in its place' },
      { id: 'courier', name: 'Courier Label', blurb: 'Big number and a barcode, like a shipping label' },
      { id: 'stamp', name: 'Warehouse', blurb: 'Strong black type and a stamp box' },
      { id: 'boxed', name: 'Boxed', blurb: 'Every part in its own neat box' },
      { id: 'minimal', name: 'Minimal', blurb: 'Light and simple, nothing extra' },
    ],
  },
]

export const catOf = (id: string | undefined): Category | undefined => CATEGORIES.find((c) => c.id === id)

export const styleOf = (cat: Category, id: string | undefined): StyleDef => cat.styles.find((s) => s.id === id) ?? cat.styles[0]

const PRICES: Record<string, string[]> = {
  hair: ['25000', '15000', '20000', '85000', '10000'],
  food: ['35000', '30000', '4500', '3000', '50000'],
  design: ['80000', '45000', '30000', '250000', '10000'],
  photo: ['40000', '30000', '150000', '2500', '60000'],
  fashion: ['45000', '8000', '15000', '5000', '10000'],
  consult: ['50000', '150000', '300000', '120000', '15000'],
}

const NOTES: Record<string, string[]> = {
  hair: ['Closure or frontal', 'Wash and steam', 'Knotless or box', '22 inches', 'Colour and style'],
  food: ['Serves 10', '8 inch, any flavour', 'Jollof, chicken, salad', 'Within the city', 'Tables and decor'],
  design: ['Three options', 'Colours and type', '10 designs', 'Up to five pages', 'After two rounds'],
  photo: ['One hour', 'Up to 5 minutes', 'Full day', 'Per photo', 'Aerial shots'],
  fashion: ['Measurements taken', 'Per piece', 'Per yard', 'In studio', 'Ready in 3 days'],
  consult: ['One hour', 'Half day', 'Full day', 'Written plan', '30 minutes'],
}

/** Starting words for a category, filled with the business's own details. */
export function defaultContent(cat: CatId, profile: Profile, styleId?: string): CardContent {
  const trade = TRADE_ITEMS[profile.trade] ? profile.trade : 'food'
  const names = TRADE_ITEMS[trade]
  const owner = profile.owner || profile.name
  const base: CardContent = {
    title: '',
    subtitle: '',
    big: '',
    message: '',
    to: '',
    from: owner && owner !== profile.name ? `${owner}, ${profile.name}` : profile.name,
    items: [],
    dates: '',
    code: '',
    cta: '',
    bank: profile.bank?.bank || '',
    acct: profile.bank?.acct || '',
    acctName: profile.bank?.name || profile.name,
    number: '0001',
    date: fmtDate(today()),
    address: '',
    phone: profile.phone || '',
    currency: profile.currency || '₦',
  }
  switch (cat) {
    case 'pricelist':
      return {
        ...base,
        title: 'Price list',
        subtitle: profile.trade === 'other' && profile.tradeOther ? profile.tradeOther : 'Prices and packages',
        items: names.map((a, i) => ({ a, b: PRICES[trade][i], c: NOTES[trade][i] })),
        message: 'Send us a message on WhatsApp to order.',
      }
    case 'thankyou':
      return {
        ...base,
        o: { showSign: !!profile.signature },
        title: 'Thank you',
        to: '',
        message: 'Thank you for choosing us. It was a joy working with you, and we hope to see you again soon.',
      }
    case 'paycard':
      return { ...base, title: 'Pay us here', message: 'Please send your proof of payment on WhatsApp.' }
    case 'promo':
      return {
        ...base,
        big: '20% OFF',
        title: 'Our biggest sale this year',
        message: `Everything at ${profile.name} is 20% off for one week only. Come early, while stock lasts.`,
        dates: 'This week only',
        code: '',
        cta: 'Send us a message to order',
      }
    case 'festive': {
      const c = catOf('festive')!
      const s = styleOf(c, styleId)
      return { ...base, title: s.title || '', message: s.message || '' }
    }
    case 'delivery':
      return {
        ...base,
        to: 'Mr. Wale',
        address: '',
        phone: '',
        items: [
          { a: names[0], b: '1', c: '' },
          { a: names[1], b: '1', c: '' },
        ],
        message: 'Please check your items before you sign.',
      }
  }
}

/** Keeps what someone typed for each category on this device, so they can come back to it. */
export function loadContent(userId: string, cat: CatId): CardContent | null {
  try {
    const raw = localStorage.getItem(`generate.studio.${userId}.${cat}`)
    return raw ? (JSON.parse(raw) as CardContent) : null
  } catch {
    return null
  }
}

export function saveContent(userId: string, cat: CatId, c: CardContent) {
  try {
    localStorage.setItem(`generate.studio.${userId}.${cat}`, JSON.stringify(c))
  } catch {
    /* kept for this visit only */
  }
}

export const fileName = (cat: Category, style: StyleDef, profile: Profile) =>
  `${profile.name} ${cat.word} ${style.name}`.replace(/[\\/:*?"<>|]+/g, '').trim()
