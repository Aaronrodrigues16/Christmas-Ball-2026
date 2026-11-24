'use client'

import { useMemo } from 'react'

export const TABLE_COUNT = 100
export const SEATS_PER_TABLE = 8
export const TABLES_PER_SIDE = TABLE_COUNT / 2 // 50

export type SeatStatus = 'available' | 'selected' | 'taken'

export type Seat = {
  id: string
  table: number
  label: string
  side: 'left' | 'right'
  status: SeatStatus
}

type SeatMapProps = {
  takenIds: ReadonlySet<string>
  selectedIds: ReadonlySet<string>
  onToggle: (id: string) => void
  zoom: number
}

const seatStyles: Record<SeatStatus, string> = {
  available:
    'border border-midnight-gold bg-transparent hover:bg-midnight-gold/25 cursor-pointer',
  selected:
    'border border-midnight-gold bg-midnight-gold text-midnight-bg cursor-pointer',
  taken:
    'border border-[#555] bg-[#3a3a3a] text-midnight-muted cursor-not-allowed',
}

export function buildSeats(
  takenIds: ReadonlySet<string>,
  selectedIds: ReadonlySet<string>,
): Seat[] {
  const seats: Seat[] = []

  for (let table = 1; table <= TABLE_COUNT; table++) {
    const side: Seat['side'] = table <= TABLES_PER_SIDE ? 'left' : 'right'

    for (let i = 0; i < SEATS_PER_TABLE; i++) {
      const label = String.fromCharCode(65 + i) // A..H
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

function SeatButton({
  seat,
  onToggle,
}: {
  seat: Seat
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      data-seat-id={seat.id}
      disabled={seat.status === 'taken'}
      aria-pressed={seat.status === 'selected'}
      aria-label={`Table ${seat.table}, seat ${seat.label}, ${seat.status}`}
      title={seat.id}
      onClick={() => onToggle(seat.id)}
      className={`h-5 w-5 rounded-t-md text-[8px] font-display leading-none transition-colors ${seatStyles[seat.status]}`}
    >
      {seat.label}
    </button>
  )
}

function TableCluster({
  table,
  seats,
  onToggle,
}: {
  table: number
  seats: Seat[]
  onToggle: (id: string) => void
}) {
  const topRow = seats.slice(0, 4)
  const bottomRow = seats.slice(4)

  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Table ${table}`}>
      <div className="flex gap-1">
        {topRow.map((seat) => (
          <SeatButton key={seat.id} seat={seat} onToggle={onToggle} />
        ))}
      </div>
      <span className="font-display text-[9px] tracking-widest text-midnight-goldMuted">
        T{String(table).padStart(2, '0')}
      </span>
      <div className="flex gap-1">
        {bottomRow.map((seat) => (
          <SeatButton key={seat.id} seat={seat} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}

export default function SeatMap({
  takenIds,
  selectedIds,
  onToggle,
  zoom,
}: SeatMapProps) {
  const seats = useMemo(
    () => buildSeats(takenIds, selectedIds),
    [takenIds, selectedIds],
  )

  const leftTables = useMemo(() => {
    const groups: Seat[][] = []
    const list = seats.filter((seat) => seat.side === 'left')
    for (let i = 0; i < list.length; i += SEATS_PER_TABLE) {
      groups.push(list.slice(i, i + SEATS_PER_TABLE))
    }
    return groups
  }, [seats])

  const rightTables = useMemo(() => {
    const groups: Seat[][] = []
    const list = seats.filter((seat) => seat.side === 'right')
    for (let i = 0; i < list.length; i += SEATS_PER_TABLE) {
      groups.push(list.slice(i, i + SEATS_PER_TABLE))
    }
    return groups
  }, [seats])

  const renderBlock = (groups: Seat[][], title: string, range: string) => (
    <section aria-label={title}>
      <p className="mb-4 text-center font-display text-[10px] uppercase tracking-[0.3em] text-midnight-gold">
        {title} · {range}
      </p>
      <div className="grid grid-cols-5 gap-x-5 gap-y-6">
        {groups.map((group) => (
          <TableCluster
            key={group[0].table}
            table={group[0].table}
            seats={group}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  )

  return (
    <div
      className="overflow-auto rounded border border-midnight-gold/20 bg-midnight-bg2/20 p-4"
      style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
    >
      <div
        className="flex min-w-max flex-col items-center justify-center gap-10 py-8 transition-transform duration-200 md:flex-row md:items-start"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
      >
        {renderBlock(leftTables, 'Left Block', 'Tables 01–50')}

        <div className="flex min-w-[190px] flex-col items-center justify-center self-stretch">
          <div className="rounded-t-full border border-midnight-gold/40 bg-midnight-gold/10 px-8 py-4 text-center font-display text-[10px] uppercase tracking-[0.24em] text-midnight-gold">
            DJ / Dance Floor / Stage
          </div>
          <div
            className="mt-4 h-full w-px bg-gradient-to-b from-midnight-gold/40 to-transparent"
            aria-hidden="true"
          />
        </div>

        {renderBlock(rightTables, 'Right Block', 'Tables 51–100')}
      </div>
    </div>
  )
}
