import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

export default function EventDetails() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const rows = [
    { label: 'Event', value: 'Orlem Christmas Ball 2026' },
    { label: 'Date', value: '25 December 2026' },
    { label: 'Time', value: '7:30 PM onwards' },
    { label: 'Venue', value: 'St. Joseph School Turf Ground, Orlem, Malad' },
  ]
  return (
    <>
      <section id="details" className="section-shell py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">The Evening</p>
            <h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory">Event Details</h2>
          </div>
          <div className="grid gap-4 md:gap-5 max-w-3xl mx-auto w-full">
            {rows.map((r) => (
              <div key={r.label} className="border border-midnight-gold/15 bg-midnight-bg2/30 px-5 py-5 md:px-8 md:py-6 flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-2">
                <span className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-goldMuted pl-[0.32em] sm:pl-0 shrink-0">{r.label}</span>
                <span className="font-display text-sm md:text-base tracking-[0.08em] uppercase text-midnight-ivory/95 sm:text-right">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 md:mt-12 flex items-center justify-center">
            <button type="button" onClick={() => setCheckoutOpen(true)} className="btn-gold inline-flex items-center justify-center px-10 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.32em] uppercase text-center pl-[calc(2.5rem+0.32em)] pr-10">Book Tickets</button>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-10 md:mt-14 max-w-4xl mx-auto">
            <div className="border border-midnight-gold/10 p-6 text-center flex flex-col items-center"><p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-goldMuted mb-2 pl-[0.32em]">Dress Code</p><p className="font-display text-xs tracking-[0.18em] uppercase text-midnight-muted pl-[0.18em]">Details to be announced</p></div>
            <div className="border border-midnight-gold/10 p-6 text-center flex flex-col items-center"><p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-goldMuted mb-2 pl-[0.32em]">Announcements</p><p className="font-display text-xs tracking-[0.18em] uppercase text-midnight-muted pl-[0.18em]">Further information forthcoming</p></div>
            <div className="border border-midnight-gold/10 p-6 text-center flex flex-col items-center"><p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-goldMuted mb-2 pl-[0.32em]">Contact</p><p className="font-display text-xs tracking-[0.18em] uppercase text-midnight-muted pl-[0.18em]">To be announced</p></div>
          </div>
        </div>
      </section>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}
