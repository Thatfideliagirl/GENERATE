import { localAuth } from './auth'
import type { AuthService } from './auth'
import { supabase } from './supabase'
import { createSupabaseAuth } from './supabaseAuth'

/** Real accounts when the Supabase keys are set, the on device demo when they are not. */
export const auth: AuthService = supabase ? createSupabaseAuth(supabase) : localAuth
