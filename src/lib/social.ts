import type { Profile } from './types'

export const SOCIALS: { key: 'instagram' | 'twitter' | 'tiktok'; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'yourbrand' },
  { key: 'twitter', label: 'Twitter or X', placeholder: 'yourbrand' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'yourbrand' },
]

/** Turns whatever was typed, even a full link, into a clean handle without the @. */
export function cleanHandle(v: string): string {
  return v
    .trim()
    .replace(/^https?:\/\/(www\.)?[^/]+\//i, '')
    .replace(/^@+/, '')
    .replace(/[/?#].*$/, '')
    .replace(/\s+/g, '')
}

/** The handles to print on a document, for example Instagram @yourbrand. */
export function socialLines(p: Profile): { label: string; handle: string }[] {
  const s = p.socials
  if (!s) return []
  return SOCIALS.map(({ key, label }) => ({ label, handle: cleanHandle(s[key] ?? '') })).filter((x) => x.handle)
}
