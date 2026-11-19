import { useEffect, useMemo, useState } from 'react'

const EVENT_TIME = new Date('2026-12-25T19:30:00+05:30').getTime()

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

export default function Countdown() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const diff = EVENT_TIME - now
  const parts = useMemo(() => {
    if (diff <= 0) return null
    const totalSec = Math.floor(diff / 1000)
    const days = Math.floor(totalSec / 86400)
    const hours = Math.floor((totalSec % 86400) / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    return { days, hours, minutes, seconds }
  }, [diff])

  if (!parts) {
    return (
      <div className="text-center py-6" role="status" aria-live="polite">
        <p className="font-editorial italic text-3xl md:text-4xl text-midnight-gold">The Celebration Has Begun</p>
        <p className="mt-3 font-display text-[11px] tracking-[0.28em] uppercase text-midnight-muted">Welcome to Orlem Christmas Ball 2026</p>
      </div>
    )
  }

  const items = [
    { label: 'Days', value: String(parts.days).padStart(parts.days > 99 ? 3 : 2, '0') },
    { label: 'Hours', value: pad(parts.hours) },
    { label: 'Minutes', value: pad(parts.minutes) },
    { label: 'Seconds', value: pad(parts.seconds) },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-8 lg:gap-10" aria-label="Countdown to Orlem Christmas Ball 2026">
      {items.map((it) => (
        <div key={it.label} className="min-w-[5.5rem] md:min-w-[7rem] text-center flex flex-col items-center">
          <div className="font-display font-extralight text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-midnight-gold tabular-nums leading-none [text-shadow:0_0_30px_rgba(198,173,120,0.12)]">
            {it.value}
          </div>
          <div className="mt-3 h-px w-10 bg-midnight-gold/25" />
          <div className="mt-3 font-display text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-midnight-muted pl-[0.35em]">{it.label}</div>
        </div>
      ))}
    </div>
  )
}
