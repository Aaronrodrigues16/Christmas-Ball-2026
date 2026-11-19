import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Razorpay from 'razorpay'

function trimEnv(key: string): string {
  return (process.env[key] || '').trim()
}

function sameMode(keyId: string, keySecret: string): { ok: boolean; keyIdMode?: string; keySecretMode?: string } {
  const id = keyId.trim()
  const secret = keySecret.trim()
  if (!id || !secret) return { ok: false }
  const idMode = id.startsWith('rzp_test_') ? 'test' : id.startsWith('rzp_live_') ? 'live' : 'unknown'
  const secretMode = secret.startsWith('rzp_test_') ? 'test' : secret.startsWith('rzp_live_') ? 'live' : 'unknown'
  // Razorpay key secrets don't have a mode prefix, but we check keyId format
  return { ok: idMode !== 'unknown', keyIdMode: idMode }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const keyId = trimEnv('RAZORPAY_KEY_ID')
  const keySecret = trimEnv('RAZORPAY_KEY_SECRET')
  const webhookSecret = trimEnv('RAZORPAY_WEBHOOK_SECRET')
  const supabaseUrl = trimEnv('SUPABASE_URL')
  const serviceKey = trimEnv('SUPABASE_SERVICE_ROLE_KEY')
  const resendKey = trimEnv('RESEND_API_KEY')

  const modeCheck = sameMode(keyId, keySecret)

  const checks = {
    env: {
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
      RAZORPAY_KEY_ID: !!keyId,
      RAZORPAY_KEY_SECRET: !!keySecret,
      RAZORPAY_WEBHOOK_SECRET: !!webhookSecret,
      RESEND_API_KEY: !!resendKey,
      RAZORPAY_MODE_MATCH: modeCheck.ok,
      RAZORPAY_MODE: modeCheck.keyIdMode,
    },
    supabase: { connected: false, tierCount: 0, error: null as string | null },
    razorpay: { reachable: false, error: null as string | null },
  }

  if (checks.env.SUPABASE_URL && checks.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data, error } = await admin.from('ticket_tiers').select('id', { count: 'exact', head: true })
      if (error) throw error
      checks.supabase = { connected: true, tierCount: data?.length ?? 0, error: null }
    } catch (e: any) {
      checks.supabase = { connected: false, tierCount: 0, error: e?.message ?? 'Unknown error' }
    }
  }

  // Test Razorpay connectivity
  if (keyId && keySecret) {
    try {
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
      await rzp.orders.all({ count: 1 })
      checks.razorpay = { reachable: true, error: null }
    } catch (e: any) {
      const err = e?.error || {}
      checks.razorpay = {
        reachable: false,
        error: `HTTP ${e?.statusCode ?? e?.response?.status ?? '?'} | ${err.code ?? 'UNKNOWN'} | ${err.description ?? e?.message ?? 'Unknown error'}`,
      }
    }
  }

  const required = [
    checks.env.SUPABASE_URL,
    checks.env.SUPABASE_SERVICE_ROLE_KEY,
    checks.env.RAZORPAY_KEY_ID,
    checks.env.RAZORPAY_KEY_SECRET,
    checks.env.RAZORPAY_WEBHOOK_SECRET,
    checks.env.RAZORPAY_MODE_MATCH,
    checks.supabase.connected,
  ]

  return res.status(200).json({
    ok: required.every(Boolean),
    checks,
  })
}
