export default function HeadlinerSection() {
  return (
    <section id="headliner" className="section-shell py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">Live Headliner</p>
          <h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory">The Knights – Entertainers</h2>
          <div className="gold-rule w-28 mx-auto mt-6 opacity-50" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-stretch">
          <div className="relative border border-midnight-gold/20 bg-midnight-bg2/30 overflow-hidden min-h-[320px] md:min-h-[420px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(198,173,120,0.12),transparent_55%)]" aria-hidden="true" />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,5,0.55),transparent_45%)]" aria-hidden="true" />
            <div className="relative z-10 text-center px-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-midnight-gold/35 text-midnight-gold">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18V6l10-2v12" />
                  <circle cx="7" cy="18" r="2.5" />
                  <circle cx="17" cy="16" r="2.5" />
                </svg>
              </div>
              <p className="font-display text-[10px] md:text-[11px] tracking-[0.34em] uppercase text-midnight-goldMuted pl-[0.34em]">Band Photo</p>
              <p className="mt-2 font-editorial italic text-xl md:text-2xl text-midnight-ivory/90">The Knights – Entertainers</p>
              <p className="mt-3 font-display text-[9px] tracking-[0.2em] uppercase text-midnight-muted pl-[0.2em]">Spotlight feature · Live on stage</p>
            </div>
            <div className="pointer-events-none absolute inset-3 border border-midnight-gold/10" aria-hidden="true" />
          </div>

          <div className="border border-midnight-gold/15 bg-midnight-bg2/20 p-7 md:p-10 flex flex-col justify-center text-center md:text-left">
            <p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-gold mb-4 pl-[0.32em] md:pl-0">Main Band · Christmas Ball 2026</p>
            <p className="font-display text-xs md:text-sm tracking-[0.08em] uppercase text-midnight-ivory/90 leading-relaxed">
              Get ready for a high-voltage live set from <span className="text-midnight-gold">The Knights – Entertainers</span> — bringing the floor alive with irresistible retro hits, crowd-favourite dance anthems, and non-stop party energy.
            </p>
            <p className="mt-5 font-display text-xs md:text-sm tracking-[0.08em] uppercase text-midnight-muted leading-relaxed">
              From sing-along classics to beats that keep you moving all night, their performance is crafted to light up the Christmas Ball with glamour, groove, and unforgettable moments.
            </p>
            <div className="gold-rule w-full my-7 opacity-30" />
            <p className="font-editorial italic text-2xl md:text-3xl text-midnight-ivory leading-snug">
              “One stage. One band. One legendary night — let The Knights set your Christmas in motion.”
            </p>
            <p className="mt-4 font-display text-[10px] tracking-[0.28em] uppercase text-midnight-goldMuted pl-[0.28em] md:pl-0">Retro hits · Dance anthems · Live energy</p>
          </div>
        </div>
      </div>
    </section>
  )
}
