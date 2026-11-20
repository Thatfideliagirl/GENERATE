import { supabase } from '../data/supabase'

/**
 * Emails left by visitors who used free signing on the website, before downloading their signed copy.
 * With Supabase they go to the sign_leads table (supabase/leads.sql): anyone can add one, only the owner can read them.
 * In the on device demo they are kept in this browser.
 */
const LOCAL = 'generate.leads'
export interface Lead {
  email: string
  createdAt: number
}

export async function saveLead(email: string): Promise<void> {
  const e = email.trim().toLowerCase()
  if (supabase) {
    await supabase.from('sign_leads').insert({ email: e, source: 'free_sign' })
    return
  }
  try {
    const list: Lead[] = JSON.parse(localStorage.getItem(LOCAL) || '[]')
    list.unshift({ email: e, createdAt: Date.now() })
    localStorage.setItem(LOCAL, JSON.stringify(list.slice(0, 2000)))
  } catch {
    /* best effort */
  }
}

/** For the owner dashboard. Returns null when the table has not been made yet. */
export async function listLeads(): Promise<Lead[] | null> {
  if (supabase) {
    const { data, error } = await supabase.from('sign_leads').select('email, created_at').order('created_at', { ascending: false }).limit(2000)
    if (error) return null
    return (data ?? []).map((r) => ({ email: r.email as string, createdAt: new Date(r.created_at as string).getTime() }))
  }
  try {
    return JSON.parse(localStorage.getItem(LOCAL) || '[]')
  } catch {
    return []
  }
}
