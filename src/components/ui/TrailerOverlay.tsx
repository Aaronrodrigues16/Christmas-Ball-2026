import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getPhase, type Phase } from '../../sequence'

const navText =
  'font-display text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.28em] md:tracking-[0.38em] text-midnight-muted'
const invitedClass =
  'font-display font-extralight text-midnight-ivory leading-[0.88] tracking-[0.03em] text-[2.2rem] sm:text-[3.1rem] md:text-[4.4rem] lg:text-[5.1rem] [text-shadow:0_14px_50px_rgba(0,0,0,0.8),0_0_50px_rgba(198,173,120,0.1)]'

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

function reveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 26, filter: 'blur(14px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 1.5, delay, ease },
  }
}

export default function TrailerOverlay() {
  const [phase, setPhase] = useState<Phase>(() => getPhase().phase)
  const reduce = useReducedMotion()

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = getPhase().phase
      setPhase((prev) => (prev === p ? prev : p))
      if (p !== 'details') raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const showNav = phase !== 'intro' || reduce
  const showInvited = phase === 'invited' || phase === 'title' || phase === 'details' || reduce
  const showTitle = phase === 'title' || phase === 'details' || reduce
  const showDetails = phase === 'details' || reduce

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-between px-4 sm:px-6 md:px-10 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <motion.div
        className="w-full max-w-6xl grid grid-cols-3 items-start gap-2"
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: showNav ? 1 : 0, y: showNav ? 0 : -8 }}
        transition={{ duration: 1.6, ease }}
      >
        <p className={`${navText} text-left`}>A PCPL PRESENTATION</p>
        <p className={`${navText} text-center text-midnight-gold/80 pl-[0.28em] md:pl-[0.38em]`}>         <p className={`${navText} text-center text-midnight-gold/80 pl-[0.28em] md:pl-[0.38em]`}></p></p>
        <p className={`${navText} text-right`}>CHRISTMAS 2026</p>
      </motion.div>

      <div className="flex-1 w-full flex items-center justify-center">
        <div className="w-full max-w-5xl text-center px-2">
          <AnimatePresence>
            {showInvited && (
              <motion.h1
                key="invited"
                className={invitedClass}
                initial={reduce ? false : { opacity: 0, y: 34, scale: 0.985, filter: 'blur(16px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.9, ease }}
              >
                <span className="block pl-[0.03em]">YOU&apos;RE</span>
                <span className="block mt-1 md:mt-2 pl-[0.03em]">INVITED</span>
              </motion.h1>
            )}
          </AnimatePresence>

          <div className="mt-5 md:mt-7 min-h-[8.5rem] sm:min-h-[9rem]">
            <AnimatePresence>
              {showTitle && (
                <motion.p
                  key="title"
                  {...(reduce ? {} : reveal(0.15))}
                  className="font-editorial italic text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] text-midnight-gold tracking-[0.015em] text-center"
                >
                  Orlem Christmas Ball 2026
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showDetails && (
                <motion.div key="details" {...(reduce ? {} : reveal(0.35))} className="mt-5 md:mt-6 space-y-2.5 text-center">
                  <motion.div
                    className="gold-rule w-24 md:w-36 mx-auto opacity-70 origin-center"
                    initial={reduce ? false : { scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 0.7 }}
                    transition={{ duration: 1.2, delay: reduce ? 0 : 0.45, ease }}
                  />
                  <p className="font-display text-[10px] sm:text-[11px] md:text-xs tracking-[0.24em] uppercase text-midnight-ivory/95 pl-[0.24em]">
                    25 DEC 2026
                  </p>
                  <p className="font-display text-[10px] sm:text-[11px] md:text-xs tracking-[0.24em] uppercase text-midnight-ivory/95 pl-[0.24em]">
                    7:30 PM ONWARDS
                  </p>
                  <p className="font-display text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.16em] md:tracking-[0.22em] uppercase text-midnight-muted leading-relaxed max-w-3xl mx-auto pl-[0.16em] md:pl-[0.22em]">
                    ST. JOSEPH SCHOOL TURF GROUND, ORLEM, MALAD
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  )
}
