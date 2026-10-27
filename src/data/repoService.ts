import { localRepo } from './repo'
import type { Repo } from './repo'
import { supabase } from './supabase'
import { createSupabaseRepo } from './supabaseRepo'

/** Saves to Supabase when the keys are set, to this device when they are not. */
export const repo: Repo = supabase ? createSupabaseRepo(supabase) : localRepo
