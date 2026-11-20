import { supabase } from '../data/supabase'

/** Counts across every account, for the owner dashboard. Counts only: no documents, names or amounts. */
export interface Activity {
  documents: number
  invoices: number
  receipts: number
  contracts: number
  customers: number
  active_week: number
  made_week: number
  with_documents: number
}

/**
 * With Supabase: asks the database function admin_activity (supabase/owner_stats.sql), which only answers an owner.
 * Returns null when that function has not been added yet.
 * In the on device demo: counts what is saved in this browser.
 */
export async function getActivity(): Promise<Activity | null> {
  if (supabase) {
    const { data, error } = await supabase.rpc('admin_activity')
    if (error || !data) return null
    return data as Activity
  }
  const a: Activity = { documents: 0, invoices: 0, receipts: 0, contracts: 0, customers: 0, active_week: 0, made_week: 0, with_documents: 0 }
  const week = Date.now() - 7 * 864e5
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? ''
      if (!k.startsWith('generate.data.')) continue
      const d = JSON.parse(localStorage.getItem(k) || '{}') as { docs?: { type: string; createdAt: number; updatedAt: number }[]; customers?: unknown[] }
      const docs = d.docs ?? []
      a.documents += docs.length
      a.invoices += docs.filter((x) => x.type === 'invoice').length
      a.receipts += docs.filter((x) => x.type === 'receipt').length
      a.contracts += docs.filter((x) => x.type === 'contract').length
      a.customers += (d.customers ?? []).length
      a.made_week += docs.filter((x) => x.createdAt > week).length
      if (docs.length) a.with_documents++
      if (docs.some((x) => x.updatedAt > week)) a.active_week++
    }
  } catch {
    /* demo numbers are best effort */
  }
  return a
}
