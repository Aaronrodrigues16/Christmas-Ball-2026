import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

const TIERS = [
  { name: 'Regular Ticket', tag: 'Standard Entry', desc: 'Full access to Orlem Christmas Ball 2026 — live headliner, dance floor, and festive celebration.', points: ['Official event entry', 'Instant QR code ticket via email', 'Secure Razorpay checkout'] },
  { name: 'Reduced Ticket', tag: 'Concession Entry', desc: 'Discounted tier (as configured in Supabase), same seamless digital ticketing.', points: ['Official event entry', 'Instant QR code ticket via email', 'Subject to availability'] },
]

export default function TicketSection() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  return (
    <>
      <section id="tickets" className="section-shell py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">Tickets</p>
          <h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory mb-6">Reserve Your Pass</h2>
          <p className="font-display text-xs md:text-sm tracking-[0.12em] uppercase text-midnight-muted max-w-2xl mx-auto leading-relaxed">Choose passes in our on-brand checkout — no redirect, powered by Razorpay & Supabase.</p>
          <div className="mt-8 flex justify-center"><button type="button" onClick={() => setCheckoutOpen(true)} className="btn-gold inline-flex items-center justify-center px-10 py-4 font-display text-[10px] md:text-[11px] tracking-[0.32em] uppercase pl-[calc(2.5rem+0.32em)] pr-10">Open Checkout</button></div>
          <div className="mt-10 md:mt-14 grid md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
              <div key={tier.name} className="border border-midnight-gold/20 bg-midnight-bg2/30 p-6 md:p-8 flex flex-col items-center text-center">
                <p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-goldMuted pl-[0.32em]">{tier.tag}</p>
                <h3 className="mt-2 font-editorial italic text-2xl md:text-3xl text-midnight-ivory">{tier.name}</h3>
                <p className="mt-3 font-display text-[11px] md:text-xs tracking-[0.06em] text-midnight-muted leading-relaxed normal-case">{tier.desc}</p>
                <div className="gold-rule w-full my-5 opacity-30" />
                <ul className="space-y-2 mb-6 inline-flex flex-col items-start text-left mx-auto">{tier.points.map((p) => (<li key={p} className="flex items-start gap-2 font-display text-[10px] md:text-[11px] tracking-[0.14em] uppercase text-midnight-ivory/85"><span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-midnight-gold/70 shrink-0" aria-hidden="true" /><span>{p}</span></li>))}</ul>
                <button type="button" onClick={() => setCheckoutOpen(true)} className="btn-gold mt-auto inline-flex items-center justify-center px-8 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.3em] uppercase pl-[calc(2rem+0.3em)] pr-8">Select &amp; Checkout</button>
              </div>
            ))}
          </div>
          <div className="mt-8 md:mt-10 max-w-2xl mx-auto border border-midnight-gold/15 bg-midnight-bg2/20 px-6 py-6 md:px-8 md:py-7 text-center">
            <p className="font-display text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-midnight-ivory/90 pl-[0.24em]">Instant digital delivery</p>
            <p className="mt-2 font-display text-[10px] md:text-[11px] tracking-[0.08em] text-midnight-muted leading-relaxed normal-case">After successful payment, ticket emailed instantly with unique <span className="text-midnight-gold">QR code</span> for fast venue entry. Stock reserved atomically to prevent overselling.</p>
          </div>
        </div>
      </section>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}
