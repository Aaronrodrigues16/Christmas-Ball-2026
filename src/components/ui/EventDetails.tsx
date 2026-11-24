import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

export default function EventDetails() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const inclusions = ['Entry & Seating', 'Unlimited Appetizers', 'BUFFET Dinner', 'Dessert', 'Water & Soft Drinks', 'Kids Zone & Secret Santa']
  return (
    <>
      <section id="details" className="section-shell py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">The Evening</p>
          <h2 className="font-editorial italic text-4xl md:text-6xl text-midnight-ivory mb-10">Event Details</h2>

          <div className="mt-12 grid md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto text-left">
            <div className="border border-midnight-gold/20 bg-midnight-bg2/30 p-6 md:p-8">
              <p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-gold mb-3">Note</p>
              <p className="font-editorial italic text-xl md:text-2xl text-midnight-gold">It's BYOB & Howw — Yess!!! You read that right.</p>
            </div>
            <div className="border border-midnight-gold/20 bg-midnight-bg2/30 p-6 md:p-8">
              <p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-gold mb-3">Dress Code</p>
              <p className="font-display text-base text-midnight-ivory/90">Christmas Glam</p>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto text-left">
            {inclusions.map((item) => (
              <div key={item} className="border border-midnight-gold/20 bg-midnight-bg2/30 p-6 md:p-8 flex items-center gap-3">
                <span className="text-midnight-gold text-xl leading-none">✓</span>
                <span className="font-display text-sm md:text-base text-midnight-ivory/90">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-midnight-gold/20 bg-midnight-bg2/30 p-6 md:p-8 max-w-5xl mx-auto text-left">
            <p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-gold mb-3">Entertainment</p>
            <p className="font-display text-base text-midnight-ivory/90" style={{ lineHeight: 1.8 }}>
              International Sensation — "KNIGHTS – The Entertainers"<br />
              DJ — "Craig"<br />
              Host — Ricky Sebastian
            </p>
          </div>

          <p className="mt-12 font-display text-base md:text-lg text-midnight-ivory/90 max-w-3xl mx-auto" style={{ lineHeight: 1.8 }}>
            Limited invites, so register now for preferred seating/tables for the happiest, classiest and most spectacular event of the year.
          </p>
          <div className="mt-10 flex items-center justify-center">
            <a href="https://forms.gle/hrSPScD68tKGCFCR9" target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center justify-center px-12 py-4 font-display text-sm md:text-base tracking-[0.2em] uppercase text-center" style={{ background: '#D4AF37', color: '#050505', boxShadow: '0 0 30px rgba(212,175,55,0.45)' }}>Book Tickets</a>
          </div>
        </div>
      </section>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}
