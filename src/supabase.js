// This project is preconfigured for the user's existing Supabase project.
// Vercel environment variables still take priority when present.
// The publishable key is intentionally safe for browser use; RLS protects user data.
const DEFAULT_SUPABASE_URL = 'https://jciqwdzuptvmwdmmqdaj.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VZdOOyGaNKtAr0H_8OBU_A_f8QbH8vF'

const supabaseUrl = String(
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
).trim()

const supabasePublishableKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY
).trim()

const createClient = globalThis.supabase?.createClient

export const supabaseConfigured = Boolean(createClient && supabaseUrl && supabasePublishableKey)

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null
