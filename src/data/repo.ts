import type { AppData } from '../lib/types'
import { emptyData } from '../lib/factory'

/**
 * Where the app keeps its data.
 *
 * Today everything is saved in the browser on the person's own device (localRepo).
 * When you are ready for real accounts, write a second repo that talks to Supabase
 * with the same two functions, then change the one line at the bottom of this file.
 * Nothing else in the app needs to change.
 */
export interface Repo {
  load(): Promise<AppData>
  save(data: AppData): Promise<void>
}

const KEY = 'vellum.v1'
const OLD_KEY = 'folio.v1'

function normalise(raw: Partial<AppData> | null): AppData {
  const base = emptyData()
  if (!raw) return base
  return {
    profile: raw.profile ?? null,
    docs: (raw.docs ?? []).map((d) => ({
      ...d,
      payments: d.payments ?? [],
      currency: d.currency ?? raw.profile?.currency ?? '₦',
    })),
    templates: raw.templates ?? [],
    seq: { ...base.seq, ...(raw.seq ?? {}) },
  }
}

export const localRepo: Repo = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY)
      return normalise(raw ? JSON.parse(raw) : null)
    } catch {
      return emptyData()
    }
  },
  async save(data) {
    localStorage.setItem(KEY, JSON.stringify(data))
  },
}

// To switch to Supabase later, import your new repo here and export it instead.
export const repo: Repo = localRepo

export { normalise }
