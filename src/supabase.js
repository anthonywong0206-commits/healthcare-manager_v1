const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabasePublishableKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
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
