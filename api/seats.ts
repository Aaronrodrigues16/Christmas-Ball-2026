import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'

type SeatRow = {
  id: string
  section: 'left' | 'right'
  row_no: number
  col_no: number
  status: string
}

function publicSeatId(row: Pick<SeatRow, 'section' | 'row_no' | 'col_no'>): string {
  const table = row.section === 'left' ? row.row_no : row.row_no + 50
  const label = String.fromCharCode(64 + row.col_no) // A..H
  return `T${String(table).padStart(2, '0')}-${label}`
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch {
    return res.status(500).json({ error: 'Seat service is not configured' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('seats')
        .select('id, section, row_no, col_no, status')

      if (error) throw error

      const seats = ((data ?? []) as SeatRow[]).map((row) => ({
        id: publicSeatId(row),
        status: row.status === 'available' ? 'available' : 'taken',
      }))

      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({ seats })
    } catch (error) {
      console.error('[api/seats] GET failed', error)
      // Never leak the raw Postgres error to the browser.
      return res.status(500).json({ error: 'Seat availability temporarily unavailable' })
    }
  }

  if (req.method === 'POST') {
    const body = req.body as { seat_ids?: unknown } | undefined
    const requested = body?.seat_ids
    if (!Array.isArray(requested) || !requested.every((id) => typeof id === 'string') || requested.length === 0) {
      return res.status(400).json({ error: 'seat_ids required' })
    }
    const seatIds = requested as string[]

    try {
      const { data: rows, error: lookupError } = await supabase
        .from('seats')
        .select('id, section, row_no, col_no')
      if (lookupError) throw lookupError

      const uuidByPublicId = new Map<string, string>()
      for (const row of (rows ?? []) as Array<Pick<SeatRow, 'id' | 'section' | 'row_no' | 'col_no'>>) {
        uuidByPublicId.set(publicSeatId(row), row.id)
      }

      const dbIds = seatIds.map((id) => uuidByPublicId.get(id) ?? (UUID_RE.test(id) ? id : null))
      if (dbIds.some((id) => id === null)) {
        return res.status(400).json({ error: 'Unknown seat id' })
      }

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
