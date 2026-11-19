export default function GalleryTeaser() {
  const slots = Array.from({ length: 8 }, (_, i) => i)
  return (
    <section id="gallery" className="section-shell py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">Memories in the Making</p>
          <h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory">Photos Coming Soon</h2>
          <p className="mt-5 font-display text-xs md:text-sm tracking-[0.12em] uppercase text-midnight-muted max-w-2xl mx-auto leading-relaxed">
            Professional event photography will be published here right after the ball concludes on <span className="text-midnight-gold">25 December 2026</span>. Relive the night, the music, and the magic.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
          {slots.map((i) => (
            <div
              key={i}
              className="relative aspect-[4/5] border border-midnight-gold/15 bg-midnight-bg2/30 overflow-hidden flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(198,173,120,0.08),transparent_60%)]" />
              <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'linear-gradient(135deg, rgba(198,173,120,0.12) 1px, transparent 1px), linear-gradient(225deg, rgba(198,173,120,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="relative z-10 text-center px-3 flex flex-col items-center">
                <div className="mx-auto mb-2 h-8 w-8 rounded-full border border-midnight-gold/25 flex items-center justify-center text-midnight-gold/70">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="8.5" cy="10" r="1.5" />
                    <path d="M21 16l-4.5-4.5L12 16l-2-2-4 4" />
                  </svg>
                </div>
                <p className="font-display text-[8px] md:text-[9px] tracking-[0.22em] uppercase text-midnight-muted pl-[0.22em]">Coming Soon</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 md:mt-10 text-center border border-midnight-gold/15 bg-midnight-bg2/20 px-6 py-6 md:py-7 max-w-3xl mx-auto">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-midnight-ivory/90 pl-[0.28em]">Gallery opens after the celebration</p>
          <p className="mt-2 font-display text-[9px] tracking-[0.2em] uppercase text-midnight-muted pl-[0.2em]">Check back here post-event for the official photo collection</p>
        </div>
      </div>
    </section>
  )
}
