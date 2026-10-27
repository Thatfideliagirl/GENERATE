import type { AppData } from '../lib/types'
import { emptyData } from '../lib/factory'

/**
 * Where the app keeps its data.
 *
 * Today everything is saved in the browser on the person's own device (localRepo).
 * With Supabase keys set, supabaseRepo.ts is used instead. repoService.ts picks which one.
 */
export interface Repo {
  load(userId: string | null): Promise<AppData>
  save(data: AppData, userId: string | null): Promise<void>
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

const USER_KEY = 'generate.data.'
const ADOPTED = 'generate.adopted.v1'

export const localRepo: Repo = {
  async load(userId) {
    if (!userId) return emptyData()
    try {
      let raw = localStorage.getItem(USER_KEY + userId)
      if (raw == null && !localStorage.getItem(ADOPTED)) {
        // The first account on this device takes over anything saved before accounts existed.
        raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY)
        localStorage.setItem(ADOPTED, userId)
      }
      return normalise(raw ? JSON.parse(raw) : null)
    } catch {
      return emptyData()
    }
  },
  async save(data, userId) {
    if (!userId) return
    localStorage.setItem(USER_KEY + userId, JSON.stringify(data))
  },
}

export { normalise }
