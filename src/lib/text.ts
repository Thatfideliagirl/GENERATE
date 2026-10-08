import type { Doc, Profile } from './types'
import { fmtDate, money } from './format'

/** Fills the {{placeholders}} in contract text from the document and profile. */
export function resolveText(text: string | undefined, doc: Doc, profile: Profile): string {
  const values: Record<string, string> = {
    business: profile.name,
    client: doc.client.name || '[client name]',
    owner: profile.owner || profile.name,
    date: fmtDate(doc.issueDate),
    fee: doc.fee ? money(doc.fee, doc.currency) : '[amount]',
    start: doc.start ? fmtDate(doc.start) : '[start date]',
    end: doc.end ? fmtDate(doc.end) : '[end date]',
  }
  return String(text || '').replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    values[key] != null ? values[key] : match,
  )
}

export type Block = { kind: 'heading'; text: string } | { kind: 'para'; lines: string[] }

/** Splits contract text into headings and paragraphs. */
export function toBlocks(text: string): Block[] {
  const blocks: Block[] = []
  let buf: string[] = []
  const flush = () => {
    if (buf.length) blocks.push({ kind: 'para', lines: buf })
    buf = []
  }
  for (const line of text.split('\n')) {
    if (line.startsWith('# ')) {
      flush()
      blocks.push({ kind: 'heading', text: line.slice(2) })
    } else if (!line.trim()) {
      flush()
    } else {
      buf.push(line)
    }
  }
  flush()
  return blocks
}
