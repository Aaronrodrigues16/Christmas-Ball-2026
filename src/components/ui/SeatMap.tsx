import { useMemo } from 'react'

export const TABLE_COUNT = 100
export const SEATS_PER_TABLE = 8
export const TABLES_PER_SIDE = TABLE_COUNT / 2

export type SeatStatus = 'available' | 'selected' | 'taken'
export type Seat = {
  id: string
  table: number
  label: string
  side: 'left' | 'right'
  status: SeatStatus
}

type Props = {
  takenIds: Set<string>
  selectedIds: Set<string>
  onToggle: (id: string) => void
  zoom: number
}

export function buildSeats(takenIds: Set<string>, selectedIds: Set<string>): Seat[] {
  const seats: Seat[] = []
  for (let table = 1; table <= TABLE_COUNT; table++) {
    const side: Seat['side'] = table <= TABLES_PER_SIDE ? 'left' : 'right'
    for (let i = 0; i < SEATS_PER_TABLE; i++) {
      const label = String.fromCharCode(65 + i)
      const id = `T${String(table).padStart(2, '0')}-${label}`
      const status: SeatStatus = takenIds.has(id)
        ? 'taken'
        : selectedIds.has(id)
          ? 'selected'
          : 'available'
      seats.push({ id, table, label, side, status })
    }
  }
  return seats
}

const seatClass: Record<SeatStatus, string> = {
  available: 'border border-midnight-gold bg-transparent hover:bg-midnight-gold/20 cursor-pointer',
  selected: 'border border-midnight-gold bg-midnight-gold text-midnight-bg cursor-pointer',
  taken: 'border border-[#555] bg-[#3a3a3a] text-midnight-muted cursor-not-allowed',
}

function TableCluster({ table, seats, onToggle }: { table: number; seats: Seat[]; onToggle: (id: string) => void }) {
  const top = seats.slice(0, 4)
  const bottom = seats.slice(4)
  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Table ${table}`}>
      <div className="flex gap-1">
        {top.map((s) => <SeatButton key={s.id} seat={s} onToggle={onToggle} />)}
      </div>
      <span className="font-display text-[9px] tracking-widest text-midnight-goldMuted">
        T{String(table).padStart(2, '0')}
      </span>
      <div className="flex gap-1">
        {bottom.map((s) => <SeatButton key={s.id} seat={s} onToggle={onToggle} />)}
      </div>
    </div>
  )
}

function SeatButton({ seat, onToggle }: { seat: Seat; onToggle: (id: string) => void }) {
  return (
    <button
      type="button"
      disabled={seat.status === 'taken'}
      aria-pressed={seat.status === 'selected'}
      aria-label={`Table ${seat.table} seat ${seat.label} - ${seat.status}`}
      title={`T${String(seat.table).padStart(2, '0')}-${seat.label}`}
      onClick={() => onToggle(seat.id)}
      className={`h-5 w-5 rounded-t-md text-[8px] font-display transition-colors ${seatClass[seat.status]}`}
    >
      {seat.label}
    </button>
  )
}

export default function SeatMap({ takenIds, selectedIds, onToggle, zoom }: Props) {
  const seats = useMemo(() => buildSeats(takenIds, selectedIds), [takenIds, selectedIds])
  const left = seats.filter((s) => s.side === 'left')
  const right = seats.filter((s) => s.side === 'right')

  const block = (list: Seat[]) => {
    const tables: Seat[][] = []
    for (let i = 0; i < list.length; i += SEATS_PER_TABLE) {
      tables.push(list.slice(i, i + SEATS_PER_TABLE))
    }
    return (
      <div className="grid grid-cols-5 gap-x-5 gap-y-6">
        {tables.map((group) => (
          <TableCluster key={group[0].table} table={group[0].table} seats={group} onToggle={onToggle} />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded border border-midnight-gold/20 p-4" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
      <div
        className="flex flex-col items-center justify-center gap-8 py-6 transition-transform duration-200 md:flex-row md:items-start"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
      >
        <section aria-label="Left block">
          <p className="mb-4 text-center font-display text-[10px] uppercase tracking-[0.3em] text-midnight-gold">
            Left Block · Tables 01–50
          </p>
          {block(left)}
        </section>

        <div className="flex min-w-[190px] flex-col items-center justify-center self-stretch">
          <div className="rounded-t-full border border-midnight-gold/40 bg-midnight-gold/10 px-8 py-4 text-center font-display text-[10px] uppercase tracking-[0.24em] text-midnight-gold">
            DJ / Dance Floor / Stage
          </div>
          <div className="mt-4 h-full w-px bg-gradient-to-b from-midnight-gold/40 to-transparent" aria-hidden="true" />
        </div>

        <section aria-label="Right block">
          <p className="mb-4 text-center font-display text-[10px] uppercase tracking-[0.3em] text-midnight-gold">
            Right Block · Tables 51–100
          </p>
          {block(right)}
        </section>
      </div>
    </div>
  )
}