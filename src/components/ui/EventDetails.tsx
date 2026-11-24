import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

export default function EventDetails() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  return (
    <>
      <section id="details" className="section-shell py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">The Evening</p>
          <h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory mb-6">Event Details</h2>

          <div className="gold-rule max-w-xs mx-auto mb-8 opacity-40" />
          <p className="font-display text-sm md:text-base leading-relaxed text-midnight-ivory/90 max-w-3xl mx-auto">
            As a 12-year legacy reaches new heights, we look forward to you joining the community's historic 'Orlem Christmas Ball' 🎄. Presented by the market's newest powerhouse, 'PCPL' 🏘️.
          </p>
          <div className="gold-rule max-w-xs mx-auto mt-8 opacity-40" />

          <div className="mt-10 inline-block border border-midnight-gold/40 bg-midnight-gold/10 px-6 py-4">
            <p className="font-display text-xs md:text-sm tracking-[0.1em] uppercase text-midnight-gold">NOTE: It's BYOB & Howw — Yess!!! You read that right.</p>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {['Entry & Seating','🍤 Unlimited Appetizers','🍱 BUFFET Dinner','🍨 Dessert','🧊 Water & Soft Drinks','⛳ Kids Zone & Secret Santa 🎅🏻 🎁'].map((item) => (
              <div key={item} className="border border-midnight-gold/20 bg-midnight-bg2/30 px-4 py-3 text-center font-display text-[11px] md:text-xs tracking-[0.1em] uppercase text-midnight-ivory/90">{item}</div>
            ))}
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            <div className="border border-midnight-gold/15 bg-midnight-bg2/20 p-6">
              <p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-gold mb-3">Entertainment 💃🏻 🕺🏻</p>
              <ul className="space-y-2 font-display text-xs tracking-[0.08em] uppercase text-midnight-ivory/90">
                <li>International Sensation — "KNIGHTS – The Entertainers"</li>
                <li>DJ — "Craig" 🎧</li>
                <li>Host — Ricky Sebastian 🎤</li>
              </ul>
            </div>
            <div className="border border-midnight-gold/15 bg-midnight-bg2/20 p-6">
              <p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-gold mb-3">Dress Code</p>
              <p className="font-display text-xs tracking-[0.08em] uppercase text-midnight-ivory/90">Christmas Glam 💃🏻 🕺🏻</p>
            </div>
          </div>

          <p className="mt-12 font-display text-sm md:text-base leading-relaxed text-midnight-ivory/90 max-w-3xl mx-auto">
            Limited invites, so register now for preferred seating/tables for the happiest, classiest and most spectacular event of the year 🤗 #spreadthelove ❤️
          </p>
          <div className="mt-8 flex items-center justify-center">
            <a href="https://forms.gle/hrSPScD68tKGCFCR9" target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center justify-center px-10 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.32em] uppercase text-center pl-[calc(2.5rem+0.32em)] pr-10">Book Tickets</a>
          </div>

          <div className="mt-12 text-center">
            <p className="font-display text-[10px] tracking-[0.28em] uppercase text-midnight-goldMuted mb-2">For details please contact: The Happy Hearts</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="tel:9136978151" className="font-display text-xs tracking-[0.1em] text-midnight-ivory/90 hover:text-midnight-gold">9136978151</a>
              <a href="tel:9821934217" className="font-display text-xs tracking-[0.1em] text-midnight-ivory/90 hover:text-midnight-gold">9821934217</a>
              <a href="tel:9930604295" className="font-display text-xs tracking-[0.1em] text-midnight-ivory/90 hover:text-midnight-gold">9930604295</a>
            </div>
          </div>
        </div>
      </section>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}
