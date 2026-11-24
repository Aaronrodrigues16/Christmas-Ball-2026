import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'

const SeatMap = lazy(() => import('./SeatMap'))

type SeatsResponse = {
  seats: Array<{ id: string; status: 'available' | 'taken' }>
}

export default function SeatsPage() {
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const didFetch = useRef(false)

  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch('/api/seats', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error || `Request failed (${res.status})`)
        }
        return (await res.json()) as SeatsResponse
      })
      .then((data) => {
        setTakenIds(
          new Set(
            (data.seats || [])
              .filter((s) => s.status === 'taken')
              .map((s) => s.id),
          ),
        )
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[seats] failed to load availability', err)
        setError('Seat availability is temporarily unavailable. Please retry.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (takenIds.has(id)) return prev
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [takenIds])

  const goBack = () => {
    window.location.href = '/#tickets'
  }

  const checkout = () => {
    if (selectedIds.size === 0) return
    const tier = sessionStorage.getItem('selectedTier') || 'adult'
    const params = new URLSearchParams({
      seats: [...selectedIds].join(','),
      tier,
    })
    window.location.href = `/?${params.toString()}#tickets`
  }

  return (
    <div className="min-h-screen bg-midnight-bg p-4 text-midnight-ivory">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <button type="button" onClick={goBack} className="btn-gold px-4 py-2 text-xs">Back</button>
          <h1 className="font-editorial text-2xl italic">Select Your Seats</h1>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))} className="btn-gold px-2 py-1 text-xs" aria-label="Zoom out">-</button>
            <span className="text-xs">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))} className="btn-gold px-2 py-1 text-xs" aria-label="Zoom in">+</button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap justify-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="h-4 w-4 rounded-t-md border border-midnight-gold" /> Available</span>
          <span className="flex items-center gap-1"><span className="h-4 w-4 rounded-t-md border border-midnight-gold bg-midnight-gold" /> Selected</span>
          <span className="flex items-center gap-1"><span className="h-4 w-4 rounded-t-md border border-[#555] bg-[#3a3a3a]" /> Taken</span>
        </div>

        {loading && (
          <p className="py-12 text-center font-display text-[11px] uppercase tracking-[0.3em] text-midnight-muted">
            Loading seats…
          </p>
        )}

        {!loading && error && (
          <div className="py-10 text-center" role="alert">
            <p className="mb-4 text-sm text-[#d8b4a6]">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="btn-gold px-6 py-3 text-xs uppercase tracking-widest">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <Suspense fallback={<p className="py-12 text-center text-sm text-midnight-muted">Preparing seat map…</p>}>
            <SeatMap takenIds={takenIds} selectedIds={selectedIds} onToggle={toggle} zoom={zoom} />
          </Suspense>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <span className="text-sm">{selectedIds.size} selected</span>
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={checkout}
            className="btn-gold px-8 py-3 text-xs uppercase tracking-widest disabled:opacity-40"
          >
            Reserve &amp; Checkout
          </button>
        </div>
      </div>
    </div>
  )
}