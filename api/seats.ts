import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabaseAdmin()
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('seats').select('id,section,row_no,col_no,tier_id,status,reserved_until')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ seats: data })
  }
  if (req.method === 'POST') {
    const { seat_ids } = req.body || {}
    if (!Array.isArray(seat_ids) || !seat_ids.length) return res.status(400).json({ error: 'seat_ids required' })
    const { data, error } = await supabase.rpc('reserve_seats', { p_seat_ids: seat_ids, p_lock_minutes: 5 })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}