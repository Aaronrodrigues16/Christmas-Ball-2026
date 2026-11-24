import { getSupabaseAdmin } from './supabaseAdmin'

type DirectSeatRow = {
  id: string
  section: string
  row_no: number
  col_no: number
  status?: string
}

type SeatMapRow = {
  id: string
  public_id: string
  status?: string
}

export type SeatEntry = {
  id: string
  publicId: string
  status: string
}

export function publicSeatId(row: Pick<DirectSeatRow, 'section' | 'row_no' | 'col_no'>): string {
  const table = row.section === 'left' ? row.row_no : row.row_no + 50
  const label = String.fromCharCode(64 + row.col_no)
  return `T${String(table).padStart(2, '0')}-${label}`
}

/**
 * Prefer the security-definer RPC so the service role does not need direct
 * SELECT access to public.seats. The direct query remains as a fallback for
 * databases where migration 005 has not been applied yet.
 */
export async function loadSeatEntries(): Promise<SeatEntry[]> {
  const supabase = getSupabaseAdmin()
  const rpc = await supabase.rpc('get_seat_map')

  let rows: SeatMapRow[] | null = null
  if (!rpc.error && Array.isArray(rpc.data)) {
    rows = rpc.data as SeatMapRow[]
  } else {
    const direct = await supabase
      .from('seats')
      .select('id, section, row_no, col_no, status')

    if (direct.error) throw direct.error

    rows = ((direct.data ?? []) as DirectSeatRow[]).map((row) => ({
      id: row.id,
      public_id: publicSeatId(row),
      status: row.status,
    }))
  }

  return rows
    .filter((row): row is SeatMapRow & { public_id: string } => Boolean(row?.id && row?.public_id))
    .map((row) => ({
      id: row.id,
      publicId: row.public_id,
      status: row.status || 'available',
    }))
}

export async function loadSeatMap(): Promise<Map<string, string>> {
  const entries = await loadSeatEntries()
  const map = new Map<string, string>()
  for (const entry of entries) map.set(entry.publicId, entry.id)
  return map
}

export function resolveSeatIds(publicIds: string[], map: Map<string, string>): string[] | null {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const resolved: string[] = []
  for (const id of publicIds) {
    const uuid = map.get(id) ?? (UUID_RE.test(id) ? id : null)
    if (!uuid) return null
    resolved.push(uuid)
  }
  return resolved
}
