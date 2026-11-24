import { useCallback, useEffect, useState } from 'react'
import SeatMap from './SeatMap'
import { readDraft, readSeatIds, writeSeatIds } from '../../lib/checkoutState'

type SeatsResponse = { seats?: Array<{ id: string; status?: string }> }
type Availability = 'loading' | 'ready' | 'unavailable'

export default function SeatsPage() {
  const [takenIds, setTakenIds] = useState<ReadonlySet<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [availability, setAvailability] = useState<Availability>('loading')
  const [zoom, setZoom] = useState(1)

  const draft = readDraft()
  const requiredSeatCount = draft?.requiredSeatCount ?? 0

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/seats', { signal: controller.signal })
      .then(async (response) => {
        const isJson = (response.headers.get('content-type') ?? '').includes('application/json')
        if (response.status === 404 || !isJson) return { seats: [] } as SeatsResponse
        if (!response.ok) throw new Error(`Seat API returned ${response.status}`)
        return (await response.json()) as SeatsResponse
      })
      .then((data) => {
        const taken = new Set<string>()
        for (const seat of data.seats ?? []) {
          if (seat.status === 'taken') taken.add(seat.id)
        }
        setTakenIds(taken)
        setAvailability('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('[seats] availability unavailable', error)
        setTakenIds(new Set())
        setAvailability('unavailable')
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const ids = readSeatIds()
    if (ids.length > 0) setSelectedIds(new Set(ids))
  }, [])

  const toggleSeat = useCallback((id: string) => {
    setSelectedIds((previous) => {
      if (takenIds.has(id)) return previous
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else if (next.size < requiredSeatCount) next.add(id)
      return next
    })
  }, [takenIds, requiredSeatCount])

  const goBack = () => { window.location.href = '/#tickets' }

  const reserveAndCheckout = () => {
    if (selectedIds.size !== requiredSeatCount) return
    writeSeatIds([...selectedIds])
    window.location.href = '/#tickets'
  }

  useEffect(() => {
    if (requiredSeatCount === 0 && draft) {
      window.location.href = '/#tickets'
    }
  }, [requiredSeatCount, draft])

  const canConfirm = requiredSeatCount === 0 || selectedIds.size === requiredSeatCount

  return (
    <div className="min-h-screen bg-midnight-bg p-4 text-midnight-ivory">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={goBack} className="btn-gold px-4 py-2 text-xs">Back</button>
          <h1 className="font-editorial text-2xl italic">Select Your Seats</h1>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setZoom((v) => Math.max(0.6, +(v - 0.1).toFixed(2)))} className="btn-gold px-2 py-1 text-xs" aria-label="Zoom out">-</button>
            <span className="text-xs">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((v) => Math.min(1.4, +(v + 0.1).toFixed(2)))} className="btn-gold px-2 py-1 text-xs" aria-label="Zoom in">+</button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap justify-center gap-4 text-xs">
          <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-t-md border border-midnight-gold" /> Available</span>
          <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-t-md border border-midnight-gold bg-midnight-gold" /> Selected</span>
          <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-t-md border border-[#555] bg-[#3a3a3a]" /> Taken</span>
        </div>

        {availability === 'loading' && <p className="mb-3 text-center font-display text-[10px] uppercase tracking-[0.24em] text-midnight-muted">Checking live availability…</p>}
        {availability === 'unavailable' && <p className="mb-3 border border-midnight-gold/20 bg-midnight-gold/5 px-4 py-2 text-center text-[11px] text-midnight-muted" role="status">Live availability unavailable. Showing all seats as available.</p>}

        <p className="mb-3 text-center font-display text-[11px] uppercase tracking-[0.24em] text-midnight-gold">
          {selectedIds.size} of {requiredSeatCount} seats selected
        </p>

        <SeatMap takenIds={takenIds} selectedIds={selectedIds} onToggle={toggleSeat} zoom={zoom} />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={reserveAndCheckout}
            className="btn-gold px-8 py-3 text-xs uppercase tracking-widest disabled:opacity-40"
          >
            Reserve &amp; Checkout
          </button>
          {!canConfirm && requiredSeatCount > 0 && (
            <p className="text-[11px] text-midnight-muted">Select exactly {requiredSeatCount} seat{requiredSeatCount > 1 ? 's' : ''} to continue.</p>
          )}
        </div>
      </div>
    </div>
  )
}