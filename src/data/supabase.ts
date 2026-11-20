import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * The connection to Supabase. It is null until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env,
 * and then the whole app switches from the on device demo to real accounts.
 * The anon key is meant to be public. The database rules in supabase/schema.sql are what keep data private.
 */
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null
