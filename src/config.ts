const env = import.meta.env

export const SUPABASE_URL = (env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
export const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''
// Public site URL; defaults to the current origin in the browser.
export const SITE_URL = (env.VITE_SITE_URL as string | undefined)?.trim() || (typeof window !== 'undefined' ? window.location.origin : '')
export const BOOKING_URL = (env.VITE_BOOKING_URL as string | undefined)?.trim() || '/#tickets'

