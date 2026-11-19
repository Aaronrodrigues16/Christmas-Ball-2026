import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'

/**
 * Polling endpoint for the browser that created the order.
 * Requires the unguessable status_token returned by /api/create-razorpay-order;
 * a bare Razorpay order ID is never enough to read customer data or QR tokens.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  res.setHeader('Cache-Control', 'no-store')

  const token = req.body?.status_token
  if (typeof token !== 'string' || token.length < 32) {
    return res.status(400).json({ error: 'status_token required' })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, total_amount')
      .eq('status_token', token)
      .maybeSingle()

    if (error) return res.status(500).json({ error: 'Status lookup failed' })
    if (!order) return res.status(404).json({ error: 'not_found' })

    let tickets: { qr_token: string; tier: string | null }[] = []
    if (order.status === 'PAID') {
      const { data: rows } = await supabase
        .from('tickets')
        .select('qr_token, ticket_tiers(name)')
        .eq('order_id', order.id)

      tickets = (rows || []).map((row: any) => ({
        qr_token: row.qr_token,
        tier: Array.isArray(row.ticket_tiers) ? row.ticket_tiers[0]?.name ?? null : row.ticket_tiers?.name ?? null,
      }))
    }

    return res.status(200).json({
      status: order.status,
      total_amount: order.total_amount,
      tickets,
    })
  } catch {
    return res.status(500).json({ error: 'Status lookup failed' })
  }
}
