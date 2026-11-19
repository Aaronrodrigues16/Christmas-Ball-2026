import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const checks = {
    env: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      RAZORPAY_WEBHOOK_SECRET: !!process.env.RAZORPAY_WEBHOOK_SECRET,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    },
    supabase: { connected: false, tierCount: 0, error: null as string | null },
  }

  if (checks.env.SUPABASE_URL && checks.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data, error } = await admin.from('ticket_tiers').select('id', { count: 'exact', head: true })
      if (error) throw error
      checks.supabase = { connected: true, tierCount: data?.length ?? 0, error: null }
    } catch (e: any) {
      checks.supabase = { connected: false, tierCount: 0, error: e?.message ?? 'Unknown error' }
    }
  }

  const required = [
    checks.env.SUPABASE_URL,
    checks.env.SUPABASE_SERVICE_ROLE_KEY,
    checks.env.RAZORPAY_KEY_ID,
    checks.env.RAZORPAY_KEY_SECRET,
    checks.env.RAZORPAY_WEBHOOK_SECRET,
    checks.supabase.connected,
  ]

  return res.status(200).json({
    ok: required.every(Boolean),
    checks,
  })
}
