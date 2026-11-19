const faqs = [
  {
    q: 'How will I receive my ticket?',
    a: 'After successful payment, your ticket is delivered instantly to your email as a digital pass with a unique QR code. No physical ticket is required.',
  },
  {
    q: 'What do I show at the venue?',
    a: 'Simply present the QR code ticket from your email on your phone (or a printout) at the entry gate for quick scanning and check-in.',
  },
  {
    q: 'When does the QR code ticket arrive?',
    a: 'Instantly after checkout confirmation. If you do not see it within a few minutes, please check your spam/junk folder before contacting the organizers.',
  },
  {
    q: 'Can I book multiple tickets in one order?',
    a: 'Yes. Select the desired quantity and ticket type in the official ticket shop during checkout; each booking receives confirmation and QR-coded ticket details as issued by the ticketing system.',
  },
  {
    q: 'Which ticket types are available?',
    a: 'Current tiers include Regular Ticket and Reduced Ticket (subject to availability in the shop). Choose your tier during booking to see live pricing and availability.',
  },
]

export default function FaqSection() {
  return (
    <section id="faq" className="section-shell py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">Good to Know</p>
          <h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <details key={item.q} className="group border border-midnight-gold/15 bg-midnight-bg2/25 px-5 md:px-7 py-4 md:py-5">
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-display text-[11px] md:text-xs tracking-[0.18em] uppercase text-midnight-ivory/95 text-left">
                <span className="leading-relaxed">{item.q}</span>
                <span className="mt-0.5 text-midnight-gold/80 transition-transform duration-300 group-open:rotate-45 shrink-0" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 pr-2 md:pr-6 font-display text-[11px] md:text-xs tracking-[0.06em] text-midnight-muted leading-relaxed normal-case text-left">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
