import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

export default function EventDetails() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  return (
    <>
      <section id="details" className="section-shell py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">The Evening</p>
          <h2 className="font-editorial italic text-4xl md:text-6xl text-midnight-ivory mb-10">Event Details</h2>

          <div className="gold-rule max-w-xs mx-auto mb-10 opacity-40" />
          <p className="font-display text-base md:text-lg max-w-3xl mx-auto" style={{ lineHeight: 1.8 }}>
            As a 12-year legacy reaches new heights, we look forward to you joining the community's historic 'Orlem Christmas Ball' 🎄. Presented by the market's newest powerhouse, 'PCPL' 🏘️.
          </p>
          <div className="gold-rule max-w-xs mx-auto mt-10 opacity-40" />

          <p className="mt-12 font-editorial italic text-xl md:text-2xl text-midnight-gold" style={{ textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>
            NOTE: It's BYOB & Howw — Yess!!! You read that right.
          </p>

          <ul className="mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
            {['Entry & Seating','🍤 Unlimited Appetizers','🍱 BUFFET Dinner','🍨 Dessert','🧊 Water & Soft Drinks','⛳ Kids Zone & Secret Santa 🎅🏻 🎁'].map((item) => (
              <li key={item} className="flex items-start gap-3 font-display text-base text-midnight-ivory/90" style={{ lineHeight: 1.6 }}>
                <span className="text-midnight-gold text-xl leading-none">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-16 grid md:grid-cols-2 gap-12 max-w-3xl mx-auto text-center">
            <div>
              <h3 className="font-editorial italic text-2xl md:text-3xl text-midnight-ivory mb-4">Entertainment 💃🏻 🕺🏻</h3>
              <p className="font-display text-base text-midnight-ivory/90" style={{ lineHeight: 1.8 }}>
                International Sensation — "KNIGHTS – The Entertainers"<br/>
                DJ — "Craig" 🎧<br/>
                Host — Ricky Sebastian 🎤
              </p>
            </div>
            <div>
              <h3 className="font-editorial italic text-2xl md:text-3xl text-midnight-ivory mb-4">Dress Code</h3>
              <p className="font-display text-base text-midnight-ivory/90" style={{ lineHeight: 1.8 }}>Christmas Glam 💃🏻 🕺🏻</p>
            </div>
          </div>

          <p className="mt-16 font-display text-base md:text-lg max-w-3xl mx-auto" style={{ lineHeight: 1.8 }}>
            Limited invites, so register now for preferred seating/tables for the happiest, classiest and most spectacular event of the year 🤗 #spreadthelove ❤️
          </p>
          <div className="mt-10 flex items-center justify-center">
            <a href="https://forms.gle/hrSPScD68tKGCFCR9" target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center justify-center px-12 py-4 font-display text-sm md:text-base tracking-[0.2em] uppercase text-center pl-[calc(3rem+0.2em)] pr-12" style={{ background: '#D4AF37', color: '#050505', boxShadow: '0 0 30px rgba(212,175,55,0.5)' }}>Book Tickets</a>
          </div>

          <div className="mt-16 text-center">
            <p className="font-editorial italic text-lg text-midnight-gold mb-3">For details please contact: The Happy Hearts</p>
            <p className="font-display text-base text-midnight-ivory/90">
              <a href="tel:9136978151" className="hover:text-midnight-gold">9136978151</a> | <a href="tel:9821934217" className="hover:text-midnight-gold">9821934217</a> | <a href="tel:9930604295" className="hover:text-midnight-gold">9930604295</a>
            </p>
          </div>
        </div>
      </section>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}
