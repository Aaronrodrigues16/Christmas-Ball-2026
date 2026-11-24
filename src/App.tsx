import { Canvas } from '@react-three/fiber'
import { Suspense, lazy, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Scene from './components/Scene'
import { startBackgroundAudio } from './audio'
import TrailerOverlay from './components/ui/TrailerOverlay'
import musicTrack from './assets/music/Black Santa Amapiano.mp3'
import Countdown from './components/ui/Countdown'
import Reveal from './components/ui/Reveal'
import ChristmasSnow from './components/ui/ChristmasSnow'
import HolidayPointer from './components/HolidayPointer'

const EventDetails = lazy(() => import('./components/ui/EventDetails'))
const HeadlinerSection = lazy(() => import('./components/ui/HeadlinerSection'))
const TicketSection = lazy(() => import('./components/ui/TicketSection'))
const FaqSection = lazy(() => import('./components/ui/FaqSection'))
const VenueSection = lazy(() => import('./components/ui/VenueSection'))
const ScannerPage = lazy(() => import('./components/ui/ScannerPage'))

function Landing({ isMobile, reduce }: { isMobile: boolean; reduce: boolean | null }) {
  useEffect(() => {
    // Reset to the start and attempt playback on every full page load/refresh
    startBackgroundAudio(musicTrack)
  }, [])
  return (
    <div className="relative w-full min-h-screen bg-midnight-bg text-midnight-ivory">
      <ChristmasSnow />
      <HolidayPointer />
      <main>
        <section id="hero" className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-midnight-bg">
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgba(198,173,120,0.12)_0%,rgba(210,180,140,0.06)_25%,rgba(11,11,11,0.4)_50%,#050505_80%))" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(242,235,221,0.04),transparent_35%))" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(198,173,120,0.05),transparent_40%))" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(210,180,140,0.04),transparent_35%))" />
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-midnight-gold/5 via-transparent to-transparent" />
          </div>
          <motion.div
            className="absolute inset-0 z-[3]"
            initial={reduce ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Canvas
              dpr={isMobile ? 1 : [1, 1.5]}
              camera={{ position: isMobile ? [0, 0.25, 8.2] : [0, 0.25, 7.6], fov: isMobile ? 50 : 42 }}
              gl={{ antialias: !isMobile, alpha: true, powerPreference: isMobile ? 'low-power' : 'high-performance', preserveDrawingBuffer: false }}
              frameloop="always"
              performance={{ min: isMobile ? 0.3 : 0.5, max: isMobile ? 0.6 : 1.0 }}
            >
              <Suspense fallback={null}>
                <Scene isMobile={isMobile} />
              </Suspense>
            </Canvas>
          </motion.div>
          <div className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.15)_45%,rgba(0,0,0,0.78)_100%)] mobile-vignette" />
          <div className="hero-fade-top" />
          <div className="hero-fade-bottom" />
          <div className="film-grain" />
          <TrailerOverlay />
        </section>

        <Suspense fallback={null}>
          <Reveal><section id="countdown" className="section-shell relative py-20 md:py-28 px-6"><div className="max-w-5xl mx-auto text-center flex flex-col items-center"><p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">Countdown to the Ball</p><h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory mb-4">Orlem Christmas Ball 2026</h2><p className="font-display text-[11px] md:text-xs tracking-[0.2em] uppercase text-midnight-muted mb-10 md:mb-14 pl-[0.2em] max-w-3xl">25 December 2026 � 7:30 PM onwards � St. Joseph School Turf Ground, Orlem, Malad</p><Countdown /></div></section></Reveal>
          <Reveal><EventDetails /></Reveal>
          <Reveal><HeadlinerSection /></Reveal>
          <Reveal><TicketSection /></Reveal>
          <Reveal><FaqSection /></Reveal>
          <Reveal><VenueSection /></Reveal>
          <Reveal><footer className="section-shell py-10 px-6 text-center flex flex-col items-center"><div className="gold-rule max-w-xs w-full mx-auto mb-6 opacity-40" /><p className="font-display text-[10px] tracking-[0.32em] uppercase text-midnight-muted pl-[0.32em]">A PCPL Presentation</p></footer></Reveal>
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  const [isMobile, setIsMobile] = useState(false)
  const reduce = useReducedMotion()
  const isScanner = typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/scanner'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isScanner) {
    return <Suspense fallback={<div className="min-h-screen bg-midnight-bg" />}><ScannerPage /></Suspense>
  }
  return <Landing isMobile={isMobile} reduce={reduce} />
}





