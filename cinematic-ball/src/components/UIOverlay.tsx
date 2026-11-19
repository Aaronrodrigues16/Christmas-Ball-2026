import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const MAP_URL =
  'https://www.google.com/maps/search/?api=1&query=St.+Joseph+School+Turf+Ground,+Orlem,+Malad+West,+Mumbai'

export default function UIOverlay() {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between text-cream">
      <div className="flex items-start justify-between p-6 sm:p-8">
        <div className="pointer-events-auto">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold/80">PCPL Presents</p>
          <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.25em] text-gold/60">
            In association with The Happy Hearts
          </p>
        </div>
        <span className="pointer-events-auto border border-[#D7C6A5]/40 bg-[#120405]/30 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.3em] text-[#F5CE62] backdrop-blur-sm">
          By Invitation Only
        </span>
      </div>

      <div className="pointer-events-auto flex flex-col items-center gap-4 px-6 pb-8 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div className="max-w-xl">
          <h1 className="font-serif text-3xl italic leading-tight text-cream sm:text-4xl md:text-5xl">
            Orlem Christmas Ball <span className="text-[#F5CE62]">2026</span>
          </h1>
          <p className="mt-2 font-serif text-lg italic text-gold/90">
            Featuring Knights The Entertainers
          </p>
          <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.25em] text-gold/70">
            Making History! Direct from Sri Lanka. Live in Orlem.
          </p>
          <p className="mt-3 font-sans text-xs tracking-wide text-cream/80">
            25 Dec, 7:30 p.m. onwards &bull; St. Joseph School Turf Ground, Orlem, Malad
          </p>
        </div>

        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="shrink-0 border border-[#F5CE62]/70 bg-[#F5CE62]/10 px-6 py-3 font-sans text-[10px] uppercase tracking-[0.3em] text-[#F5CE62] backdrop-blur-sm hover:bg-[#F5CE62]/20"
        >
          View Invitation Details
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Invitation details"
              className="w-full max-w-lg border border-[#D7C6A5]/40 bg-[#1a0706]/95 p-6 text-left shadow-2xl sm:p-8"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold/70">PCPL Presents</p>
              <h2 className="mt-2 font-serif text-3xl italic text-cream">
                Orlem Christmas Ball <span className="text-[#F5CE62]">2026</span>
              </h2>
              <p className="mt-1 font-serif text-lg italic text-gold/90">Featuring Knights The Entertainers</p>
              <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.2em] text-gold/70">
                Making History! Direct from Sri Lanka. Live in Orlem.
              </p>
              <div className="my-4 h-px w-full bg-[#D7C6A5]/30" />
              <ul className="space-y-2 font-sans text-sm text-cream/85">
                <li><span className="text-gold/70">Date:</span> 25 Dec, 7:30 p.m. onwards</li>
                <li><span className="text-gold/70">Venue:</span> St. Joseph School Turf Ground, Orlem, Malad</li>
                <li><span className="text-gold/70">Address:</span> Marve Road, Orlem, Malad West, Mumbai - 400064 (Opposite Orlem Church)</li>
                <li><span className="text-gold/70">Entry:</span> By Invitation Only</li>
                <li><span className="text-gold/70">Associated:</span> The Happy Hearts</li>
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={MAP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-[#F5CE62]/70 bg-[#F5CE62]/10 px-5 py-2.5 font-sans text-[10px] uppercase tracking-[0.25em] text-[#F5CE62] hover:bg-[#F5CE62]/20"
                >
                  Open in Maps
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 font-sans text-[10px] uppercase tracking-[0.25em] text-gold/70 hover:text-cream"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
