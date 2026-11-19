import { type PropsWithChildren, useEffect, useRef } from 'react'

// In-project integration inspired by liquid-glass-js (decorative frosted/liquid glass layer).
// Kept lightweight and Christmas-themed: subtle refraction-like highlight following pointer.
export default function LiquidGlass({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      el.style.setProperty('--lg-x', `${x}%`)
      el.style.setProperty('--lg-y', `${y}%`)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div ref={ref} className={`liquid-glass-surface ${className}`}>
      {children}
    </div>
  )
}