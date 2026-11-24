import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'
import { loadSeatEntries, loadSeatMap, resolveSeatIds } from './_lib/seatIds'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch {
    return res.status(500).json({ error: 'Seat service is not configured' })
  }

  if (req.method === 'GET') {
    try {
      const entries = await loadSeatEntries()
      const seats = entries.map((entry) => ({
        id: entry.publicId,
        status: entry.status === 'available' ? 'available' : 'taken',
      }))

      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({ seats })
    } catch (error) {
      console.error('[api/seats] GET failed', error)
      return res.status(500).json({ error: 'Seat availability temporarily unavailable' })
    }
  }

  if (req.method === 'POST') {
    const body = req.body as { seat_ids?: unknown } | undefined
    const requested = body?.seat_ids
    if (!Array.isArray(requested) || !requested.every((id) => typeof id === 'string') || requested.length === 0) {
      return res.status(400).json({ error: 'seat_ids required' })
    }

    try {
      const seatMap = await loadSeatMap()
      const dbIds = resolveSeatIds(requested as string[], seatMap)
      if (!dbIds) return res.status(400).json({ error: 'Unknown seat id' })

      const { data, error } = await supabase.rpc('reserve_seats', {
        p_seat_ids: dbIds,
        p_lock_minutes: 5,
      })
      if (error) throw error
      return res.status(200).json(data)
    } catch (error) {
      console.error('[api/seats] POST failed', error)
      return res.status(500).json({ error: 'Seat reservation temporarily unavailable' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
