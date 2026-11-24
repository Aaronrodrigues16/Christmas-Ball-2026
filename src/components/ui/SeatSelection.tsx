import { useEffect, useState, useMemo } from 'react'
import CheckoutModal from './CheckoutModal'

type Seat = { id: string; section: string; row_no: number; col_no: number; tier_id: string | null; status: string; reserved_until: string | null }

export default function SeatSelection({ onBack }: { onBack: () => void }) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const load = async () => {
    try {
      const r = await fetch('/api/seats')
      const d = await r.json()
      setSeats(d.seats || [])
    } catch (e: any) { setError(e?.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [])

  const toggle = (s: Seat) => {
    if (s.status !== 'available') return
    setSelected(prev => prev.includes(s.id) ? prev.filter(x=>x!==s.id) : [...prev, s.id])
  }

  const reserve = async () => {
    setError(null)
    const r = await fetch('/api/seats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_ids: selected }) })
    const d = await r.json()
    if (d.conflicts?.length) {
      setError('Some seats were taken. Please pick again.')
      await load()
      setSelected([])
      return
    }
    setCheckoutOpen(true)
  }

  const bySection = (sec: string) => seats.filter(s => s.section === sec).sort((a,b) => a.row_no - b.row_no || a.col_no - b.col_no)

  const renderBlock = (sec: string) => {
    const rows = new Map<number, Seat[]>()
    bySection(sec).forEach(s => { if (!rows.has(s.row_no)) rows.set(s.row_no, []); rows.get(s.row_no)!.push(s) })
    return (
      <div className="flex flex-col gap-1">
        {[...rows.entries()].sort((a,b)=>a[0]-b[0]).map(([rn, list]) => (
          <div key={rn} className="flex gap-1 justify-center">
            {list.sort((a,b)=>a.col_no-b.col_no).map(s => {
              const isSel = selected.includes(s.id)
              const avail = s.status === 'available'
              return (
                <button key={s.id} onClick={() => toggle(s)} disabled={!avail}
                  className={`w-6 h-6 text-[9px] border ${isSel ? 'bg-midnight-gold text-black' : avail ? 'bg-midnight-bg2/40 border-midnight-gold/30' : 'bg-red-900/40 border-red-900/40 cursor-not-allowed'}`}>
                  {s.col_no}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <div className="min-h-screen bg-midnight-bg text-midnight-ivory flex items-center justify-center">Loading seats…</div>

  return (
    <div className="min-h-screen bg-midnight-bg text-midnight-ivory p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="btn-gold px-4 py-2 text-xs">Back</button>
          <h1 className="font-editorial italic text-2xl">Select Your Seats</h1>
          <div className="text-xs">{selected.length} selected</div>
        </div>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <div className="text-center mb-4">
          <div className="inline-block px-8 py-3 border border-midnight-gold/40 bg-midnight-gold/10 rounded">DJ / Dance Floor</div>
        </div>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-start overflow-auto">
          <div>
            <p className="text-center text-xs mb-2">Left Block</p>
            {renderBlock('left')}
          </div>
          <div>
            <p className="text-center text-xs mb-2">Right Block</p>
            {renderBlock('right')}
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <button onClick={reserve} disabled={!selected.length} className="btn-gold px-8 py-3 text-xs uppercase tracking-widest disabled:opacity-40">Reserve & Checkout</button>
        </div>
      </div>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  )
}