import { motion } from 'framer-motion'

export default function UIOverlay() {
  const handleCreate = () => {
    console.log('Create Your Card clicked — placeholder for card creation flow')
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between px-6 py-10 text-center">
      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.35em] text-gold/80">PCPL Presents</p>
        <h1 className="mt-3 font-serif text-4xl italic text-cream sm:text-5xl md:text-6xl">
          Take Me To <span className="text-[#F5CE62]">Christmas</span>
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.25em] text-gold/70">
          Orlem Christmas Ball 2026
        </p>
      </div>

      <div className="pointer-events-auto mb-8">
        <motion.button
          type="button"
          onClick={handleCreate}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="rounded-none border border-[#F5CE62] bg-[#F5CE62]/10 px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-cream backdrop-blur-sm hover:bg-[#F5CE62]/20"
        >
          Create Your Card
        </motion.button>
        <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-gold/60">
          Drag to orbit &bull; Scroll to zoom
        </p>
      </div>
    </div>
  )
}
