import { useEffect, useState } from 'react'
type Seat = { id: string; section: string; row_no: number; col_no: number; status: string }
export default function SeatSelection({ onBack }: { onBack: () => void }) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const load = async () => {
    try {
      const r = await fetch('/api/seats')
      const text = await r.text()
      let d: any
      try { d = JSON.parse(text) } catch { throw new Error('Seats API not available - run with vercel dev') }
      if (!r.ok) throw new Error(d?.error || 'Failed to load seats')
      setSeats(d.seats || [])
    } catch (e: any) { setError(e?.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [])
  const toggle = (s: Seat) => { if (s.status !== 'available') return; setSelected(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id]) }
  const reserve = async () => {
    setError(null)
    const r = await fetch('/api/seats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seat_ids: selected }) })
    const text = await r.text(); let d: any
    try { d = JSON.parse(text) } catch { setError('Seats API not available'); return }
    if (d.conflicts?.length) { setError('Some seats taken. Pick again.'); await load(); setSelected([]); return }
    alert('Reserved ' + selected.length + ' seats')
  }
  const rowsOf = (sec: string) => {
    const m = new Map<number, Seat[]>()
    seats.filter(s => s.section === sec).forEach(s => { if (!m.has(s.row_no)) m.set(s.row_no, []); m.get(s.row_no)!.push(s) })
    return [...m.entries()].sort((a,b) => a[0]-b[0])
  }
  const renderChair = (s: Seat) => {
    const isSel = selected.includes(s.id); const taken = s.status !== 'available'
    return <button key={s.id} onClick={() => toggle(s)} disabled={taken} className="w-7 h-7 md:w-8 md:h-8 rounded-t-lg border flex items-center justify-center text-[9px]"
      style={{ background: isSel ? '#c6ad78' : taken ? '#3a3a3a' : 'transparent', borderColor: isSel ? '#c6ad78' : taken ? '#555' : '#c6ad78', color: isSel ? '#050505' : taken ? '#777' : '#c6ad78', cursor: taken ? 'not-allowed' : 'pointer' }}>{s.col_no}</button>
  }
  if (loading) return <div className="min-h-screen bg-midnight-bg text-midnight-ivory flex items-center justify-center">Loading seats…</div>
  return (
    <div className="min-h-screen bg-midnight-bg text-midnight-ivory p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="btn-gold px-4 py-2 text-xs">Back</button>
          <h1 className="font-editorial italic text-2xl">Select Your Seats</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z-0.2))} className="btn-gold px-2 py-1 text-xs">-</button>
            <span className="text-xs">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z+0.2))} className="btn-gold px-2 py-1 text-xs">+</button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <div className="text-center mb-4"><div className="inline-block px-10 py-3 border border-midnight-gold/40 bg-midnight-gold/10 rounded-t-full">DJ / Dance Floor / Stage</div></div>
        <div className="flex gap-4 text-xs justify-center mb-4">
          <span className="flex items-center gap-1"><span className="w-4 h-4 border border-midnight-gold rounded-t-md" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-midnight-gold border border-midnight-gold rounded-t-md" /> Selected</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-[#3a3a3a] border border-[#555] rounded-t-md" /> Taken</span>
        </div>
        <div className="overflow-auto border border-midnight-gold/20 rounded p-4" style={{ touchAction: 'pinch-zoom pan-x pan-y' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform .2s' }} className="flex flex-col md:flex-row gap-8 justify-center items-start min-w-max">
            <Block rows={rowsOf('left')} label="Left Block" renderChair={renderChair} />
            <Block rows={rowsOf('right')} label="Right Block" renderChair={renderChair} />
          </div>
        </div>
        <div className="mt-6 flex justify-center items-center gap-4">
          <span className="text-sm">{selected.length} selected</span>
          <button onClick={reserve} disabled={!selected.length} className="btn-gold px-8 py-3 text-xs uppercase tracking-widest disabled:opacity-40">Reserve & Checkout</button>
        </div>
      </div>
    </div>
  )
}

function Block({ rows, label, renderChair }: any) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs uppercase tracking-widest text-midnight-gold mb-2">{label}</p>
      {rows.map(([rn, list]: any) => {
        const sorted = list.sort((a: any, b: any) => a.col_no - b.col_no)
        const left = sorted.filter((s: any) => s.col_no <= 4)
        const right = sorted.filter((s: any) => s.col_no > 4)
        return (
          <div key={rn} className="flex items-center gap-2">
            <span className="w-5 text-[10px] text-midnight-muted text-right">{String.fromCharCode(64 + ((rn-1)%26+1))}</span>
            <div className="flex gap-1">{left.map(renderChair)}</div>
            <div className="w-4" />
            <div className="flex gap-1">{right.map(renderChair)}</div>
          </div>
        )
      })}
    </div>
  )
}