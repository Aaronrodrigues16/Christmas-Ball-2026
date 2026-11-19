import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'

type ScanResult = { ok: boolean; error?: string; name?: string; tier?: string; dietary?: string | null; checked_in_at?: string }

export default function ScannerPage() {
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'info'; text: string; detail?: string } | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lockRef = useRef(false)
  const pinRef = useRef('')

  async function verifyPin(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return setMsg({ kind: 'err', text: 'Supabase not configured.' })
    const { data, error } = await supabase.rpc('verify_scanner_pin', { p_pin: pin })
    if (error || !data) setMsg({ kind: 'err', text: 'Invalid PIN.' })
    else { pinRef.current = pin; setAuthed(true); setMsg(null) }
  }

  async function handleToken(token: string) {
    if (!supabase || lockRef.current) return
    lockRef.current = true
    try {
      const { data, error } = await supabase.rpc('scan_ticket', { p_pin: pinRef.current, p_qr_token: token })
      if (error) { setMsg({ kind: 'err', text: error.message }); return }
      const r = data as ScanResult
      if (!r?.ok) {
        if (r?.error === 'invalid_pin') { setAuthed(false); pinRef.current = ''; setMsg({ kind: 'err', text: 'PIN invalid. Re-auth required.' }) }
        else if (r?.error === 'already_checked_in') setMsg({ kind: 'err', text: 'Already checked in.', detail: r.checked_in_at ? `At ${new Date(r.checked_in_at).toLocaleString()}` : undefined })
        else if (r?.error === 'not_found' || r?.error === 'invalid_token') setMsg({ kind: 'err', text: 'Invalid ticket.' })
        else setMsg({ kind: 'err', text: 'Scan failed.' })
        return
      }
      const detail = [r.tier, r.dietary ? `Dietary: ${r.dietary}` : null].filter(Boolean).join(' · ')
      setMsg({ kind: 'ok', text: `Entry granted — ${r.name || 'Guest'}`, detail: detail || undefined })
    } finally {
      setTimeout(() => { lockRef.current = false }, 1500)
    }
  }

  async function start() {
    if (scanning) return
    setMsg(null)
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    try {
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, (txt: string) => handleToken(txt.trim()), () => {})
      setScanning(true)
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'Camera start failed (need HTTPS/permission).' })
    }
  }

  async function stop() {
    const s = scannerRef.current
    if (s) { try { await s.stop(); await s.clear() } catch {} scannerRef.current = null }
    setScanning(false)
  }

  useEffect(() => () => { stop() }, [])

  if (!authed) {
    return (
      <div className="min-h-screen bg-midnight-bg text-midnight-ivory flex items-center justify-center p-6">
        <form onSubmit={verifyPin} className="w-full max-w-sm border border-midnight-gold/25 bg-midnight-bg2/40 p-6 space-y-4">
          <h1 className="font-editorial italic text-2xl text-midnight-ivory">Door Scanner</h1>
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-midnight-muted">Enter staff PIN</p>
          <input type="password" inputMode="numeric" className="input-gold" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN" required />
          {msg && <p className="text-sm text-[#d8b4a6]">{msg.text}</p>}
          <button className="btn-gold w-full py-3 font-display text-[10px] tracking-[0.3em] uppercase">Unlock</button>
          <p className="text-[10px] text-midnight-muted">PIN verified server-side via Supabase RPC (RLS hardened).</p>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight-bg text-midnight-ivory p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-editorial italic text-2xl">Door Scanner</h1>
          <a href="/" className="font-display text-[10px] tracking-[0.2em] uppercase text-midnight-muted border border-midnight-gold/20 px-3 py-2">Back</a>
        </div>
        <div id="qr-reader" className="w-full overflow-hidden border border-midnight-gold/20 bg-black" />
        <div className="flex gap-3">
          {!scanning ? <button onClick={start} className="btn-gold flex-1 py-3 font-display text-[10px] tracking-[0.3em] uppercase">Start Camera</button>
            : <button onClick={stop} className="btn-gold flex-1 py-3 font-display text-[10px] tracking-[0.3em] uppercase">Stop Camera</button>}
        </div>
        {msg && (
          <div className={`p-4 border text-center ${msg.kind==='ok'?'border-green-500/40 bg-green-900/20':msg.kind==='err'?'border-red-500/40 bg-red-900/20':'border-midnight-gold/20'}`}>
            <p className={`font-display text-[11px] tracking-[0.12em] uppercase ${msg.kind==='ok'?'text-green-300':msg.kind==='err'?'text-red-300':'text-midnight-muted'}`}>{msg.text}</p>
            {msg.detail && <p className="mt-1 text-sm text-midnight-ivory/90">{msg.detail}</p>}
          </div>
        )}
        <p className="font-display text-[10px] tracking-[0.12em] uppercase text-midnight-muted">Scan guest QR. Verified & checked-in via secure RPC (atomic, no duplicates).</p>
      </div>
    </div>
  )
}
