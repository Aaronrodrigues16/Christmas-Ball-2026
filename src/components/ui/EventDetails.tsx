export default function EventDetails() {
  const inclusions = ['Entry & Seating', 'Unlimited Appetizers', 'Buffet Dinner', 'Dessert', 'Water & Soft Drinks', 'Kids Zone & Secret Santa']
  return (
      <section id="details" className="section-shell py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="eyebrow">The Evening</p>
          <h2 className="section-title mb-10">Event Details</h2>

          <div className="border border-midnight-gold/20 bg-midnight-bg2/30 grid md:grid-cols-2 gap-8 md:gap-12 p-6 md:p-10 text-left max-w-5xl mx-auto">
            <div className="space-y-6">
              <div>
                <p className="card-label">Note</p>
                <p className="body-copy text-midnight-gold">It's BYOB & Howw — Yess!!! You read that right.</p>
              </div>
              <div>
                <p className="card-label">Dress Code</p>
                <p className="body-copy text-midnight-ivory/90">Christmas Glam</p>
              </div>
              <div>
                <p className="card-label">Entertainment</p>
                <p className="body-copy text-midnight-ivory/90" style={{ lineHeight: 1.8 }}>
                  International Sensation — "KNIGHTS – The Entertainers"<br />
                  DJ — "Craig"<br />
                  Host — Ricky Sebastian
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {inclusions.map((item) => (
                <div key={item} className="flex items-center gap-2 border-b border-midnight-gold/10 pb-2 last:border-b-0">
                  <span className="text-midnight-gold text-sm leading-none">✓</span>
                  <span className="body-copy text-midnight-ivory/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="body-copy text-midnight-ivory/90 max-w-2xl mx-auto mt-10">
            Limited invites, so register now for preferred seating/tables for the happiest, classiest and most spectacular event of the year.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <a href="#tickets" className="btn-gold inline-flex items-center justify-center px-12 py-4 font-display text-[10px] md:text-[11px] tracking-[0.32em] uppercase text-center pl-[calc(3rem+0.32em)] pr-12">Book Tickets</a>
          </div>
        </div>
      </section>
  )
}