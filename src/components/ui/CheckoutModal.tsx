import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { stopBackgroundAudio } from '../../audio'
import { readDraft, writeDraft } from '../../lib/checkoutState'
import {
  computeRequiredSeatCount,
  computeTicketCount,
  computeTotal,
  getQuantity,
  TICKET_TIERS,
} from '../../lib/ticketCatalog'

type Props = { open: boolean; onClose: () => void }

const PHONE_RE = /^(\+91[\-\s]?|0)?[6-9]\d{9}$/
const MAX_PER_TIER = 4

export default function CheckoutModal({ open, onClose }: Props) {
  const [qty, setQty] = useState<Record<string, number>>({})
  const [form, setForm] = useState({ name: '', email: '', phone: '+91 ', dietary: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    stopBackgroundAudio()

    const draft = readDraft()
    setQty(draft?.quantities ?? {})
    setForm({
      name: draft?.customer.name ?? '',
      email: draft?.customer.email ?? '',
      phone: draft?.customer.phone ?? '+91 ',
      dietary: draft?.customer.dietary ?? '',
    })
    setError(null)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const items = useMemo(
    () => TICKET_TIERS.map((tier) => ({ ...tier, quantity: getQuantity(qty, tier.id) })),
    [qty],
  )

  const ticketCount = computeTicketCount(qty)
  const requiredSeatCount = computeRequiredSeatCount(qty)
  const total = computeTotal(qty)

  function setQuantity(id: string, change: number) {
    setQty((previous) => {
      const current = getQuantity(previous, id)
      return { ...previous, [id]: Math.min(MAX_PER_TIER, Math.max(0, current + change)) }
    })
    setError(null)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (ticketCount === 0) return setError('Select at least one ticket')
    if (!form.name.trim()) return setError('Full name is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Valid email is required')
    if (!PHONE_RE.test(form.phone.trim())) return setError('Valid Indian phone number required (+91XXXXXXXXXX)')

    const quantities: Record<string, number> = {}
    for (const tier of TICKET_TIERS) {
      const quantity = getQuantity(qty, tier.id)
      if (quantity > 0) quantities[tier.id] = quantity
    }

    writeDraft({
      quantities,
      requiredSeatCount,
      ticketCount,
      total,
      customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dietary: form.dietary.trim(),
      },
      step: 'select-passes',
      updatedAt: new Date().toISOString(),
    })

    onClose()
    window.location.assign('/seats')
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex justify-end" role="dialog" aria-modal="true" aria-label="Choose tickets">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-[1] flex h-[100dvh] w-full flex-col border-l border-midnight-gold/25 bg-midnight-bg shadow-[0_30px_120px_rgba(0,0,0,0.7)] sm:max-w-lg">
        <div className="flex items-center justify-between border-b border-midnight-gold/15 bg-midnight-bg2/60 px-5 py-4 md:px-6">
          <div>
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-midnight-goldMuted">Step 1 of 3</p>
            <h2 className="font-editorial text-xl italic text-midnight-ivory md:text-2xl">Choose Your Tickets</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-midnight-muted transition-colors hover:text-midnight-ivory"
            aria-label="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <p className="font-display text-[10px] tracking-[0.3em] uppercase text-midnight-goldMuted">Select Passes</p>
              <div className="mt-4 space-y-3">
                {items.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex flex-col justify-between gap-3 border border-midnight-gold/20 bg-midnight-bg2/30 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-editorial text-lg italic text-midnight-ivory">{tier.name}</p>
                      <p className="font-display text-[10px] tracking-[0.12em] uppercase text-midnight-muted">
                        {tier.requiresSeat ? 'Seat selection included' : 'No seat required'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-display text-[10px] tracking-[0.18em] uppercase text-midnight-gold">
                        {tier.price === 0 ? 'Free' : `₹${tier.price.toLocaleString('en-IN')}`}
                      </p>
                      {tier.id === 'kids' ? (
                        <span className="px-3 py-1.5 text-xs font-display tracking-[0.18em] uppercase bg-midnight-gold/15 text-midnight-gold border border-midnight-gold/30 rounded-full">
                          No ticket required
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-gold h-8 w-8 disabled:opacity-40"
                            onClick={() => setQuantity(tier.id, -1)}
                            disabled={tier.quantity === 0}
                            aria-label={`Decrease ${tier.name}`}
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-display text-sm text-midnight-ivory">{tier.quantity}</span>
                          <button
                            type="button"
                            className="btn-gold h-8 w-8 disabled:opacity-40"
                            onClick={() => setQuantity(tier.id, 1)}
                            disabled={tier.quantity >= MAX_PER_TIER}
                            aria-label={`Increase ${tier.name}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="font-display text-[10px] tracking-[0.3em] uppercase text-midnight-goldMuted">Your Details</p>
              <label className="block">
                <span className="mb-1 block font-display text-[10px] tracking-[0.24em] uppercase text-midnight-muted">Full Name *</span>
                <input
                  className="input-gold"
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  required
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-display text-[10px] tracking-[0.24em] uppercase text-midnight-muted">Email *</span>
                <input
                  className="input-gold"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-display text-[10px] tracking-[0.24em] uppercase text-midnight-muted">Phone (+91) *</span>
                <input
                  className="input-gold"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
                  placeholder="+91 9876543210"
                  required
                  autoComplete="tel"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-display text-[10px] tracking-[0.24em] uppercase text-midnight-muted">Dietary Preference</span>
                <input
                  className="input-gold"
                  value={form.dietary}
                  onChange={(event) => setForm((previous) => ({ ...previous, dietary: event.target.value }))}
                  placeholder="Veg / Non-veg / allergies (optional)"
                />
              </label>
            </div>

            <div className="border border-midnight-gold/20 bg-midnight-bg2/40 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-[10px] tracking-[0.18em] uppercase text-midnight-muted">Order total</p>
                <p className="font-editorial text-2xl italic text-midnight-gold">₹{total.toLocaleString('en-IN')}</p>
              </div>
              <p className="mt-2 font-display text-[9px] tracking-[0.14em] uppercase text-midnight-muted/80">
                {ticketCount} ticket{ticketCount === 1 ? '' : 's'} · {requiredSeatCount} seat{requiredSeatCount === 1 ? '' : 's'} to choose next
              </p>
            </div>

            {error && (
              <p className="text-[12px] text-[#d8b4a6]" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={ticketCount === 0}
              className="btn-gold w-full py-3.5 font-display text-[10px] tracking-[0.32em] uppercase disabled:opacity-50"
            >
              Choose Seats
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
