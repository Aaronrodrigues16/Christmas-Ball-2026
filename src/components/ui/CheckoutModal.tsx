import { useEffect, useMemo, useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
// loadScript utility to load Razorpay checkout script dynamically

// Razorpay global type declaration
declare global {
  interface Window {
    Razorpay: any
  }
}

import QRCode from "qrcode"
import { pauseForBooking, resumeAfterBooking } from "../../audio"
import { supabase } from "../../lib/supabase"

async function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

type Tier = { id: string; name: string; price_inr: number; total_quota: number; sold_count: number }
type Props = { open: boolean; onClose: () => void }
type PaidTicket = { qr_token: string; tier?: string; dataUrl?: string }
const PHONE_RE = /^(\+91[\-\s]?|0)?[6-9]\d{9}$/

async function pollPaid(statusToken: string, tries = 60, delayMs = 1000) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch("/api/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_token: statusToken }),
      })
      if (r.ok) {
        const d = await r.json()
        if (d.status === "PAID") return d
        if (["FAILED", "CANCELLED", "EXPIRED"].includes(d.status)) return d
      }
    } catch { /* retry */ }
    await new Promise(res => setTimeout(res, delayMs))
  }
  return { status: "PENDING", tickets: [], total_amount: 0 }
}

export default function CheckoutModal({ open, onClose }: Props) {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [tiersLoading, setTiersLoading] = useState(false)
  const [tiersError, setTiersError] = useState<string | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [form, setForm] = useState({ name: "", email: "", phone: "+91 ", dietary: "" })
  const [status, setStatus] = useState<"idle" | "loading" | "paying" | "confirming" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<{ tickets: PaidTicket[]; total: number; name: string; pending?: boolean } | null>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    pauseForBooking()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && status !== "confirming" && status !== "paying") onClose() }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey) }
  }, [open, onClose, status])

  useEffect(() => {
    if (!open) return
    setStatus("idle"); setError(null); setConfirmed(null); setQty({}); setTiersError(null)
    if (!supabase) {
      setTiers([])
      setTiersError("Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, run migration, seed ticket_tiers.")
      return
    }
    setTiersLoading(true)
    Promise.resolve(
      supabase.from("ticket_tiers").select("id,name,price_inr,total_quota,sold_count").eq("active", true).order("price_inr")
    ).then(({ data, error: terr }: { data: any; error: any }) => {
      if (terr) setTiersError(terr.message)
      else setTiers((data || []) as Tier[])
    }).finally(() => setTiersLoading(false))
  }, [open])

  const items = useMemo(() => tiers.map(t => ({ ...t, q: qty[t.id] || 0, left: Math.max(0, t.total_quota - t.sold_count) })), [tiers, qty])
  const totalQty = items.reduce((s, i) => s + i.q, 0)
  const totalAmt = items.reduce((s, i) => s + i.q * i.price_inr, 0)
  // Max 4 per tier, capped by remaining stock
  function setQ(id: string, d: number, max: number) { 
    const effectiveMax = Math.min(4, max)
    setQty(p => ({ ...p, [id]: Math.min(effectiveMax, Math.max(0, (p[id] || 0) + d)) })) 
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setError(null)
    if (!totalQty) return setError("Select at least one ticket")
    if (!form.name.trim()) return setError("Full name is required")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Valid email is required")
    if (!PHONE_RE.test(form.phone)) return setError("Valid Indian phone number required (+91XXXXXXXXXX)")
    setStatus("loading")

    const payloadItems = items.filter(i => i.q > 0).map(i => ({ tier_id: i.id, quantity: i.q }))
    try {
      let res: Response
      try {
        res = await fetch("/api/create-razorpay-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          customer_name: form.name.trim(),
          customer_email: form.email.trim(),
          customer_phone: form.phone.trim(),
          dietary_pref: form.dietary.trim() || null,
          items: payloadItems,
        }) })
      } catch {
        throw new Error("Cannot reach /api/create-razorpay-order. Run with `npx vercel dev` (not `npm run dev`) so API routes work, and configure server env vars.")
      }
      let data: any = null
      try { data = await res.json() } catch { data = null }
      if (!res.ok) throw new Error(data?.error || `Checkout failed (${res.status}). If 404, use vercel dev for /api routes.`)
      if (!data?.status_token) throw new Error("Order response is missing its status token")

      // Load Razorpay script from the official CDN (never self-host it).
      const razorpay = await loadScript("https://checkout.razorpay.com/v1/checkout.js")
      if (!razorpay || !window.Razorpay) throw new Error("Razorpay SDK failed to load")

      setStatus("paying")

      const options = {
        key: data.key_id,
        amount: data.amount * 100,
        currency: data.currency,
        name: "Orlem Christmas Ball",
        description: "Ticket Purchase",
        order_id: data.razorpay_order_id,
        handler: async (response: any) => {
          setStatus("confirming")
          // Browser callback values are untrusted. Verify them on our server
          // before treating the payment as genuine.
          const verified = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response?.razorpay_payment_id,
              razorpay_order_id: response?.razorpay_order_id,
              razorpay_signature: response?.razorpay_signature,
            }),
          })
          if (!verified.ok) throw new Error("Payment could not be verified. Please contact support if you were charged.")

          const polled = await pollPaid(data.status_token)
          if (polled.status === "PAID") {
            const tickets: PaidTicket[] = await Promise.all((polled.tickets || []).map(async (t: PaidTicket) => ({
              ...t, dataUrl: await QRCode.toDataURL(t.qr_token, { margin: 1, width: 240, color: { dark: "#050505", light: "#F2EBDD" } })
            })))
            setConfirmed({ tickets, total: polled.total_amount, name: form.name })
            setStatus("success")
            resumeAfterBooking()
          } else if (["FAILED", "CANCELLED", "EXPIRED"].includes(polled.status)) {
            throw new Error(`Payment ${String(polled.status).toLowerCase()}. Please try again.`)
          } else {
            setConfirmed({ tickets: [], total: totalAmt, name: form.name, pending: true })
            setStatus("success")
            resumeAfterBooking()
          }
        },
        modal: { ondismiss: () => { setStatus("error"); setError("Payment cancelled") } },
        prefill: { name: form.name.trim(), email: form.email.trim(), contact: form.phone.trim().replace(/\D/g, "").slice(-10) },
        theme: { color: "#c6ad78" },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", () => {
        setStatus("error")
        setError("Payment failed. Please try again.")
        resumeAfterBooking()
      })
      rzp.open()

      // Background polling for ticket data (don't block UI)
      pollPaid(data.status_token).then(polled => {
        if (polled.status === "PAID" && polled.tickets?.length > 0) {
          const tickets: PaidTicket[] = polled.tickets.map((t: PaidTicket) => ({
            ...t,
          }))
          setConfirmed(prev => prev ? { ...prev, tickets } : null)
        }
      })
    } catch (err: any) { setStatus("error"); setError(err?.message || "Something went wrong"); resumeAfterBooking() }
  }

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[120] flex justify-end" role="dialog" aria-modal="true" aria-label="Checkout">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (!(status === "paying" || status === "confirming")) { resumeAfterBooking(); onClose(); } }} aria-hidden="true" />
      <div className="relative z-[1] w-full sm:max-w-lg h-[100dvh] bg-midnight-bg border-l border-midnight-gold/25 shadow-[0_30px_120px_rgba(0,0,0,0.7)] flex flex-col">
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-midnight-gold/15 bg-midnight-bg2/60">
          <h2 className="font-editorial italic text-xl md:text-2xl text-midnight-ivory">Checkout</h2>
          <button type="button" onClick={() => { if (!(status === "paying" || status === "confirming")) { resumeAfterBooking(); onClose(); } }} className="text-midnight-muted hover:text-midnight-ivory transition-colors" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 md:py-6">
          {confirmed ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="font-editorial italic text-2xl md:text-3xl text-midnight-ivory">
                {confirmed.pending ? "Payment Processing" : "Booking Confirmed"}
              </h3>
              <p className="text-midnight-muted">
                {confirmed.pending
                  ? "Your payment is being verified. You will receive an email with QR tickets shortly."
                  : `Thank you, ${confirmed.name}! Your tickets are confirmed.`}
              </p>
              {!confirmed.pending && confirmed.tickets.length > 0 && (
                <div className="space-y-3 border-t border-midnight-gold/15 pt-4">
                  {confirmed.tickets.map((t, idx) => (
                    <div key={t.qr_token} className="bg-midnight-bg2/50 border border-midnight-gold/15 p-4 rounded-lg text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-editorial italic text-lg text-midnight-ivory">{t.tier || "Ticket"}</p>
                          <p className="font-display text-[10px] tracking-[0.12em] uppercase text-midnight-muted">QR Token: {t.qr_token}</p>
                        </div>
                        {t.dataUrl && <img src={t.dataUrl} alt={`QR ${idx + 1}`} className="w-20 h-20" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {confirmed.pending && (
                <div className="border border-midnight-gold/30 bg-midnight-gold/10 text-midnight-gold p-3 rounded font-display text-[10px] tracking-[0.1em] uppercase">
                  We&apos;ll email your QR tickets once payment is confirmed by Razorpay.
                </div>
              )}
              <button type="button" onClick={() => { resumeAfterBooking(); onClose(); }} className="btn-gold w-full py-3 font-display text-[10px] tracking-[0.3em] uppercase mt-2">Close</button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <p className="font-display text-[10px] tracking-[0.3em] uppercase text-midnight-goldMuted mb-4">Select Passes</p>
                <div className="space-y-3">
                  {items.map(t => (
                    <div key={t.id} className="border border-midnight-gold/20 bg-midnight-bg2/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-editorial italic text-lg text-midnight-ivory">{t.name}</p>
                        <p className="font-display text-[10px] tracking-[0.12em] uppercase text-midnight-muted">{t.left} remaining</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-display text-[10px] tracking-[0.18em] uppercase text-midnight-gold">₹{t.price_inr.toLocaleString("en-IN")}</p>
                        <p className="font-display text-[10px] tracking-[0.12em] uppercase text-midnight-muted">{t.left} left</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" className="btn-gold h-8 w-8 disabled:opacity-40" onClick={() => setQ(t.id, -1, t.left)} disabled={t.q === 0} aria-label={`Decrease ${t.name}`}>-</button>
                        <span className="w-6 text-center font-display text-sm text-midnight-ivory">{t.q}</span>
                        <button type="button" className="btn-gold h-8 w-8 disabled:opacity-40" onClick={() => setQ(t.id, 1, t.left)} disabled={t.left === 0 || t.q >= t.left} aria-label={`Increase ${t.name}`}>+</button>
                      </div>
                    </div>
                  ))}
                  {tiersLoading && <p className="text-midnight-muted text-sm">Loading passes…</p>}
                  {!tiersLoading && !tiersError && tiers.length === 0 && <p className="text-[12px] text-midnight-muted border border-midnight-gold/15 p-3">No passes available. In Supabase run migration and seed active rows in <code className="text-midnight-gold/90">ticket_tiers</code>.</p>}
                  {tiersError && <p className="text-[12px] text-[#d8b4a6] border border-red-500/20 p-3" role="alert">{tiersError}</p>}
                </div>
              </div>
              <div className="space-y-4">
                <p className="font-display text-[10px] tracking-[0.3em] uppercase text-midnight-goldMuted">Your Details</p>
                <label className="block"><span className="block font-display text-[10px] tracking-[0.24em] uppercase text-midnight-muted mb-1">Full Name *</span><input className="input-gold" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoComplete="name" /></label>
                <label className="block"><span className="block font-display text-[10px] tracking-[0.24em] uppercase text-midnight-muted mb-1">Email *</span><input className="input-gold" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoComplete="email" /></label>
                <label className="block"><span className="block font-display text-[10px] tracking-[0.24em] uppercase text-midnight-muted mb-1">Phone (+91) *</span><input className="input-gold" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" required autoComplete="tel" /></label>
                <label className="block"><span className="block font-display text-[10px] tracking-[0.24em] uppercase text-midnight-muted mb-1">Dietary Preference</span><input className="input-gold" value={form.dietary} onChange={e => setForm(f => ({ ...f, dietary: e.target.value }))} placeholder="Veg / Non-veg / allergies (optional)" /></label>
              </div>
              {error && <p className="text-[12px] text-[#d8b4a6]" role="alert">{error}</p>}
              <button type="submit" disabled={status === "loading" || status === "paying" || status === "confirming"} className="btn-gold w-full py-3.5 font-display text-[10px] tracking-[0.32em] uppercase disabled:opacity-50">
                {status === "loading" ? "Creating order…" : status === "paying" ? "Completing payment…" : status === "confirming" ? "Confirming booking…" : "Pay Securely"}
              </button>
              <p className="text-center font-display text-[9px] tracking-[0.14em] uppercase text-midnight-muted/70">Total ₹{totalAmt.toLocaleString("en-IN")} · Secure via Razorpay</p>
            </form>
          )}
        </div>
      </div>
    </div>, document.body
  )
}






