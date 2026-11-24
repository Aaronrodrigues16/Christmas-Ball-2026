import { getSupabaseAdmin } from './supabaseAdmin'

type SeatRow = { id: string; section: string; row_no: number; col_no: number }

export function publicSeatId(row: Pick<SeatRow, 'section' | 'row_no' | 'col_no'>): string {
  const table = row.section === 'left' ? row.row_no : row.row_no + 50
  const label = String.fromCharCode(64 + row.col_no)
  return `T${String(table).padStart(2, '0')}-${label}`
}

export async function loadSeatMap(): Promise<Map<string, string>> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('seats').select('id, section, row_no, col_no')
  if (error) throw error
  const map = new Map<string, string>()
  for (const row of (data ?? []) as SeatRow[]) {
    map.set(publicSeatId(row), row.id)
  }
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