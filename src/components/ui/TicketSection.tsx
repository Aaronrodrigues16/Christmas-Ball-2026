import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

const TIERS = [
  { id: 'kids', name: 'Kids Below 3', tag: 'Free Entry', desc: 'Complimentary entry for children under 3 years.', points: ['Official event entry', 'Instant QR code ticket via email'], requiresSeat: false },
  { id: 'child', name: 'Children Below 10', tag: '@ Rs 1000', desc: 'Discounted pass for children below 10 years.', points: ['Official event entry', 'Instant QR code ticket via email', 'Seat selection included'], requiresSeat: true },
  { id: 'adult', name: 'Per Person Adult', tag: '@ Rs 3500', desc: 'Standard adult pass for Orlem Christmas Ball 2026.', points: ['Official event entry', 'Instant QR code ticket via email', 'Secure Razorpay checkout', 'Seat selection included'], requiresSeat: true },
]

export default function TicketSection() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  return (
    <>
      <section id="tickets" className="section-shell py-20 md:py-28 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="eyebrow">Tickets</p>
          <h2 className="section-title mb-6">Reserve Your Pass</h2>
          <p className="body-copy max-w-2xl mx-auto">Choose your pass — secure checkout powered by Razorpay.</p>
          <div className="mt-10 md:mt-14 grid md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
              <div key={tier.name} className="border border-midnight-gold/20 bg-midnight-bg2/30 p-6 md:p-8 flex flex-col items-center text-center">
                <p className="card-label">{tier.tag}</p>
                <h3 className="mt-2 font-editorial italic text-2xl md:text-3xl text-midnight-ivory">{tier.name}</h3>
                <p className="mt-3 body-copy normal-case">{tier.desc}</p>
                <div className="gold-rule w-full my-5 opacity-30" />
                <ul className="space-y-2 mb-6 inline-flex flex-col items-start text-left mx-auto">{tier.points.map((p) => (<li key={p} className="flex items-start gap-2 body-copy text-midnight-ivory/85"><span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-midnight-gold/70 shrink-0" aria-hidden="true" /><span>{p}</span></li>))}</ul>
                {tier.requiresSeat ? (
                  <button type="button" onClick={() => { sessionStorage.setItem('selectedTier', tier.id); window.location.href = '/seats' }} className="btn-gold mt-auto inline-flex items-center justify-center px-8 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.3em] uppercase">Choose Seats</button>
                ) : (
                  <div aria-hidden="true" className="h-[52px]" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 md:mt-10 max-w-2xl mx-auto border border-midnight-gold/15 bg-midnight-bg2/20 px-6 py-6 md:px-8 md:py-7 text-center">
            <p className="eyebrow">Instant digital delivery</p>
            <p className="mt-2 body-copy normal-case">After successful payment, ticket emailed instantly with unique <span className="text-midnight-gold">QR code</span> for fast venue entry. Stock reserved atomically to prevent overselling.</p>
          </div>
        </div>
      </section>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}