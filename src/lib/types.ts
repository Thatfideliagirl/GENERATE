export type DocType = 'invoice' | 'receipt' | 'contract'
export type DocStatus = 'draft' | 'sent' | 'paid' | 'part' | 'overdue' | 'signed'

export interface Style {
  layout: string
  font: string
  accent: string
  text: string
  paper: 'white' | 'ivory'
}

export interface Item {
  d: string
  q: string
  p: string
}

export interface Payment {
  amt: string
  date: string
  method: string
}

export interface Client {
  name: string
  email: string
  phone: string
  address: string
}

export interface Doc {
  id: string
  type: DocType
  number: string
  status: DocStatus
  issueDate: string
  dueDate: string
  client: Client
  items: Item[]
  discount: string
  vat: boolean
  vatRate: number
  notes: string
  method: string
  useSig: boolean
  /** Show the profile's social media handles at the bottom of the document. */
  showSocials?: boolean
  style: Style
  currency: string
  payments: Payment[]
  fromId?: string
  title?: string
  body?: string
  fee?: string
  start?: string
  end?: string
  createdAt: number
  updatedAt: number
}

export interface Socials {
  instagram: string
  twitter: string
  tiktok: string
}

export interface Profile {
  name: string
  owner: string
  email: string
  phone: string
  address: string
  currency: string
  vat: boolean
  vatRate: number
  bank: { bank: string; acct: string; name: string }
  logo: string
  /** Show the business initials as the logo while there is no logo picture. */
  useInitials?: boolean
  signature: string
  socials?: Socials
  bizType: string
  /** Filled in when bizType is other. */
  bizOther?: string
  trade: string
  /** Filled in when trade is other. */
  tradeOther?: string
  style: Style
}

export interface SavedTemplate {
  id: string
  title: string
  body: string
}

export interface AppData {
  profile: Profile | null
  docs: Doc[]
  templates: SavedTemplate[]
  seq: Record<DocType, number>
}
