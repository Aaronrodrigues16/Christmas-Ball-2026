import { useEffect, useRef } from 'react'

// In-project integration inspired by liquid-logo (fluid/distorted mark reveal).
// Renders a subtle animated liquid highlight mask over an invite monogram to keep it on-theme.
export default function LiquidLogo({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const tick = (t: number) => {
      const x = 50 + Math.sin(t * 0.0005) * 18
      const y = 45 + Math.cos(t * 0.0007) * 14
      el.style.setProperty('--ll-x', `${x}%`)
      el.style.setProperty('--ll-y', `${y}%`)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`liquid-logo pointer-events-none select-none ${className}`}
    >
      <span className="liquid-logo-text"></span>
    </div>
  )
}