import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppData, Doc, Profile, SavedTemplate } from '../lib/types'
import { emptyData } from '../lib/factory'
import { normalise } from './repo'
import type { Repo } from './repo'

const PENDING = 'generate.pending.'

/** Details typed at sign up while the email still needed confirming. They are saved on first sign in. */
export const savePending = (email: string, data: AppData) => {
  try {
    localStorage.setItem(PENDING + email.trim().toLowerCase(), JSON.stringify(data))
  } catch {
    /* the person fills their profile again if this device will not store it */
  }
}

const chunk = <T,>(list: T[], size = 50): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

interface Snapshot {
  settings: string
  docs: Map<string, string>
  templates: Map<string, string>
}

const j = (v: unknown) => JSON.stringify(v)

/**
 * Saves to Supabase. Each save sends only what changed since the last one: the business settings, and the documents and
 * templates that were added, edited or removed. Saves run one after another so they cannot overtake each other.
 */
export function createSupabaseRepo(sb: SupabaseClient): Repo {
  let snap: Snapshot | null = null
  let queue: Promise<unknown> = Promise.resolve()

  const snapshotOf = (d: AppData): Snapshot => ({
    settings: j([d.profile, d.seq]),
    docs: new Map(d.docs.map((x) => [x.id, j(x)])),
    templates: new Map(d.templates.map((x) => [x.id, j(x)])),
  })

  async function write(data: AppData, userId: string) {
    const prev = snap ?? { settings: '', docs: new Map<string, string>(), templates: new Map<string, string>() }
    const now = snapshotOf(data)
    const must = (e: { message: string } | null) => {
      if (e) throw new Error(e.message)
    }

    if (data.profile && now.settings !== prev.settings) {
      must((await sb.from('business_settings').upsert({ user_id: userId, data: data.profile, seq: data.seq }, { onConflict: 'user_id' })).error)
      const p = data.profile
      must(
        (
          await sb
            .from('profiles')
            .update({
              full_name: p.owner,
              business_name: p.name,
              business_type: p.bizType === 'other' ? p.bizOther || 'other' : p.bizType,
              trade: p.trade === 'other' ? p.tradeOther || 'other' : p.trade,
            })
            .eq('id', userId)
        ).error,
      )
    }

    const changedDocs = data.docs.filter((d) => now.docs.get(d.id) !== prev.docs.get(d.id))
    for (const part of chunk(changedDocs)) {
      must(
        (
          await sb.from('documents').upsert(
            part.map((d) => ({ user_id: userId, id: d.id, type: d.type, number: d.number, status: d.status, data: d })),
            { onConflict: 'user_id,id' },
          )
        ).error,
      )
    }
    const goneDocs = [...prev.docs.keys()].filter((id) => !now.docs.has(id))
    for (const part of chunk(goneDocs)) must((await sb.from('documents').delete().eq('user_id', userId).in('id', part)).error)

    const changedTpl = data.templates.filter((t) => now.templates.get(t.id) !== prev.templates.get(t.id))
    if (changedTpl.length) {
      must((await sb.from('saved_templates').upsert(changedTpl.map((t) => ({ user_id: userId, id: t.id, title: t.title, body: t.body })), { onConflict: 'user_id,id' })).error)
    }
    const goneTpl = [...prev.templates.keys()].filter((id) => !now.templates.has(id))
    if (goneTpl.length) must((await sb.from('saved_templates').delete().eq('user_id', userId).in('id', goneTpl)).error)

    snap = now
  }

  return {
    async load(userId) {
      if (!userId) return emptyData()
      const [settings, docs, templates] = await Promise.all([
        sb.from('business_settings').select('data, seq').eq('user_id', userId).maybeSingle(),
        sb.from('documents').select('data').eq('user_id', userId).order('updated_at', { ascending: false }),
        sb.from('saved_templates').select('id, title, body').eq('user_id', userId),
      ])
      const failed = settings.error || docs.error || templates.error
      if (failed) throw new Error(failed.message)

      let data: AppData
      if (settings.data) {
        data = normalise({
          profile: settings.data.data as Profile,
          seq: settings.data.seq,
          docs: (docs.data ?? []).map((r) => r.data as Doc),
          templates: (templates.data ?? []) as SavedTemplate[],
        })
        snap = snapshotOf(data)
      } else {
        // A first sign in after confirming the email: use what was typed at sign up, if this device still has it.
        const email = (await sb.auth.getSession()).data.session?.user.email?.toLowerCase() ?? ''
        let pending: AppData | null = null
        try {
          const raw = email ? localStorage.getItem(PENDING + email) : null
          pending = raw ? normalise(JSON.parse(raw)) : null
        } catch {
          pending = null
        }
        snap = null
        data = pending ?? normalise({ docs: (docs.data ?? []).map((r) => r.data as Doc), templates: (templates.data ?? []) as SavedTemplate[] })
        if (pending) {
          await write(pending, userId)
          try {
            localStorage.removeItem(PENDING + email)
          } catch {
            /* nothing to clean */
          }
        }
      }
      return data
    },

    save(data, userId) {
      if (!userId) return Promise.resolve()
      const run = queue.then(() => write(data, userId))
      queue = run.catch(() => undefined)
      return run
    },
  }
}
