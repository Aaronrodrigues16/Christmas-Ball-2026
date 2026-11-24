import { useCallback, useEffect, useState } from 'react'
import SeatMap from './SeatMap'
import { readDraft, readSeatIds, writeSeatIds } from '../../lib/checkoutState'
import { startPayment } from '../../lib/payment'
import type { CheckoutDraft } from '../../lib/checkoutState'

type SeatsResponse = { seats?: Array<{ id: string; status?: string }> }
type Availability = 'loading' | 'ready' | 'unavailable'

export default function SeatsPage() {
  const [draft] = useState<CheckoutDraft | null>(() => readDraft())
  const [takenIds, setTakenIds] = useState<ReadonlySet<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set(readSeatIds()))
  const [availability, setAvailability] = useState<Availability>('loading')
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  const requiredSeatCount = draft?.requiredSeatCount ?? 0
  const isLocalSimulation = import.meta.env.DEV && import.meta.env.VITE_SIMULATE_PAYMENT !== 'false'

  useEffect(() => {
    if (!draft || requiredSeatCount === 0) {
      window.location.replace('/#tickets')
    }
  }, [draft, requiredSeatCount])

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
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        console.error('[seats] availability unavailable', fetchError)
        setTakenIds(new Set())
        setAvailability('unavailable')
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const stored = readSeatIds().slice(0, requiredSeatCount || 0)
    setSelectedIds(new Set(stored))
  }, [draft, requiredSeatCount])

  useEffect(() => {
    if (takenIds.size === 0) return
    setSelectedIds((previous) => {
      const available = [...previous].filter((id) => !takenIds.has(id))
      return available.length === previous.size ? previous : new Set(available)
    })
  }, [takenIds])

  useEffect(() => {
    writeSeatIds([...selectedIds])
  }, [selectedIds])

  const toggleSeat = useCallback((id: string) => {
    setError(null)
    if (takenIds.has(id)) return

    if (selectedIds.has(id)) {
      const next = new Set(selectedIds)
      next.delete(id)
      setSelectedIds(next)
      return
    }

    if (selectedIds.size >= requiredSeatCount) {
      setError(`You can select only ${requiredSeatCount} seat${requiredSeatCount === 1 ? '' : 's'} for this order.`)
      return
    }

    setSelectedIds(new Set([...selectedIds, id]))
  }, [requiredSeatCount, selectedIds, takenIds])

  const goBack = () => {
    window.location.assign('/#tickets')
  }

  const proceedToPayment = async () => {
    if (!draft) {
      setError('Your ticket details are missing. Please choose your tickets again.')
      return
    }
    if (selectedIds.size !== requiredSeatCount) {
      setError(`Select exactly ${requiredSeatCount} seat${requiredSeatCount === 1 ? '' : 's'} to continue.`)
      return
    }

    setPaying(true)
    setError(null)
    const message = await startPayment({ draft, selectedSeats: [...selectedIds] })
    if (message) {
      setError(message)
      setPaying(false)
    }
  }

  const canProceed = Boolean(draft) && requiredSeatCount > 0 && selectedIds.size === requiredSeatCount && !paying

  return (
    <div className="min-h-screen bg-midnight-bg p-4 text-midnight-ivory">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={goBack} className="btn-gold px-4 py-2 text-xs">Back</button>
          <h1 className="font-editorial text-2xl italic">Select Your Seats</h1>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.6, +(value - 0.1).toFixed(2)))} className="btn-gold px-2 py-1 text-xs" aria-label="Zoom out">-</button>
            <span className="text-xs">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(1.4, +(value + 0.1).toFixed(2)))} className="btn-gold px-2 py-1 text-xs" aria-label="Zoom in">+</button>
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

        <div className="mt-6 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            disabled={!canProceed}
            onClick={proceedToPayment}
            className="btn-gold px-8 py-3 text-xs uppercase tracking-widest disabled:opacity-40"
          >
            {paying ? 'Starting payment…' : 'Proceed to Payment'}
          </button>

          {!canProceed && requiredSeatCount > 0 && (
            <p className="text-center text-[11px] text-midnight-muted" role="alert">
              Select exactly {requiredSeatCount} seat{requiredSeatCount === 1 ? '' : 's'} to continue.
            </p>
          )}
          {error && <p className="text-center text-[12px] text-[#d8b4a6]" role="alert">{error}</p>}
          {isLocalSimulation && (
            <p className="text-center font-display text-[9px] uppercase tracking-[0.14em] text-midnight-muted/70">
              Local demo mode: payment will be simulated
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
