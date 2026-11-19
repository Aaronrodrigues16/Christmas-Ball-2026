const VENUE_NAME = 'ST. JOSEPH SCHOOL TURF GROUND'
const VENUE_AREA = 'ORLEM, MALAD'
const MAPS_QUERY = encodeURIComponent('St. Joseph School Turf Ground, Orlem, Malad')
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`

export default function VenueSection() {
  return (
    <section id="venue" className="section-shell py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">Location</p>
        <h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory mb-10 md:mb-14">Venue</h2>

        <div className="max-w-2xl mx-auto border border-midnight-gold/20 bg-midnight-bg2/30 px-6 py-10 md:px-10 md:py-14 flex flex-col items-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-midnight-gold/30 text-midnight-gold" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-6.5-5.2-6.5-11A6.5 6.5 0 1 1 18.5 10c0 5.8-6.5 11-6.5 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </div>
          <p className="font-display text-sm md:text-base tracking-[0.2em] uppercase text-midnight-ivory leading-relaxed pl-[0.2em]">{VENUE_NAME}</p>
          <p className="mt-2 font-display text-[11px] md:text-xs tracking-[0.28em] uppercase text-midnight-muted pl-[0.28em]">{VENUE_AREA}</p>
          <div className="gold-rule w-24 mx-auto my-8 opacity-50" />
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex items-center justify-center px-8 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.32em] uppercase pl-[calc(2rem+0.32em)] pr-8"
          >
            Get Directions
          </a>
          <p className="mt-5 font-display text-[9px] tracking-[0.2em] uppercase text-midnight-muted/80 pl-[0.2em]">Opens in Google Maps</p>
        </div>
      </div>
    </section>
  )
}
