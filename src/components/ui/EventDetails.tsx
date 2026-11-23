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
          <p>As a 12 year Legacy Reaches New Heights, we look forward to you joining the community's historic 'Orlem Christmas Ball'<br/>
            Presented by the market's newest powerhouse, 'PCPL'.</p>
          <div className="text-left max-w-3xl mx-auto space-y-4 font-display text-xs md:text-sm tracking-[0.06em] uppercase text-midnight-ivory/90 leading-relaxed">
            <p>Event: The Orlem Christmas Ball 2026 🎄</p>
            <p>Date: 25 December — 7.30pm onwards</p>
            <p>Location: St. Joseph School Turf Ground, Orlem, Malad</p>
            <p>Note: It's BYOB &amp; Howw — Yess!!! You read that right.</p>
            <p>Kids Below 3 — FREE<br/>Children Below 10 — @ Rs 1000<br/>Per Person Adult — @ Rs 3500</p>
            <p>This includes:<br/>Entry &amp; Seating · 🍤 Unlimited Appetizers · 🍱 Buffet Dinner · 🍨 Dessert · 🧊 Water &amp; Soft Drinks · ⛳ Kids Zone &amp; Secret Santa 🎅🏻 🎁</p>
            <p>Entertainment 💃🏻 🕺🏻<br/>International Sensation — "KNIGHTS – The Entertainers" · DJ — "Craig" 🎧 · Host — Ricky Sebastian 🎤</p>
            <p>Dress Code: Christmas Glam 💃🏻 🕺🏻</p>
            <p>Limited invites, so register now for preferred seating/tables for the happiest, classiest and most spectacular event of the year 🤗 #spreadthelove ❤️</p>
            <p>Pls click 👇🏽 Link to register: <a href="https://forms.gle/hrSPScD68tKGCFCR9" target="_blank" rel="noopener noreferrer" className="text-midnight-gold underline">Click here to register</a></p>
            <p>For details please contact: The Happy Hea… {/* TODO: confirm full contact name — source truncated */}</p>
          </div>
          <div className="mt-10 md:mt-12 flex items-center justify-center">
            <button type="button" onClick={() => setCheckoutOpen(true)} className="btn-gold inline-flex items-center justify-center px-10 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.32em] uppercase text-center pl-[calc(2.5rem+0.32em)] pr-10">Book Tickets</button>
          </div>
        </div>
      </section>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}
