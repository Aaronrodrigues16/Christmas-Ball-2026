import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"

export default function ChristmasSnow() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const c = ref.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    let w = 0, h = 0, dpr = 1, raf = 0
    
    type Particle = { 
      x: number; 
      y: number; 
      r: number; 
      v: number; 
      d: number; 
      a: number; 
      type: "snow" | "gold";
      spin: number;
      spinSpeed: number;
    }
    const particles: Particle[] = []
    
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth; h = window.innerHeight
      c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr)
      c.style.width = w + "px"; c.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.min(180, Math.floor((w * h) / 12000))
      particles.length = 0
      for (let i = 0; i < n; i++) {
        const isGold = Math.random() < 0.25
        particles.push({ 
          x: Math.random() * w, 
          y: Math.random() * h, 
          r: isGold ? 0.4 + Math.random() * 1.2 : 0.6 + Math.random() * 2.2,
          v: isGold ? 0.15 + Math.random() * 0.5 : 0.25 + Math.random() * 0.8,
          d: Math.random() * Math.PI * 2, 
          a: isGold ? 0.1 + Math.random() * 0.35 : 0.15 + Math.random() * 0.45,
          type: isGold ? "gold" : "snow",
          spin: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 0.02
        })
      }
    }
    
    const drawSnowflake = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(spin)
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, -r)
        ctx.lineTo(r * 0.3, -r * 0.6)
        ctx.lineTo(0, -r)
        ctx.lineTo(-r * 0.3, -r * 0.6)
        ctx.closePath()
      }
      ctx.fill()
      ctx.restore()
    }
    
    const drawGoldDust = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
      gradient.addColorStop(0, "rgba(242,235,221,1)")
      gradient.addColorStop(0.5, "rgba(198,173,120,0.6)")
      gradient.addColorStop(1, "rgba(198,173,120,0)")
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.d += 0.003
        p.y += p.v
        p.x += Math.sin(p.d) * (p.type === "gold" ? 0.5 : 0.35)
        p.spin += p.spinSpeed
        
        if (p.y > h + 8) { p.y = -8; p.x = Math.random() * w; p.spin = Math.random() * Math.PI * 2 }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        
        ctx.globalAlpha = p.a
        if (p.type === "gold") {
          drawGoldDust(ctx, p.x, p.y, p.r)
        } else {
          ctx.fillStyle = "#f6f1e6"
          drawSnowflake(ctx, p.x, p.y, p.r, p.spin)
        }
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    resize(); draw()
    window.addEventListener("resize", resize)
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf) }
  }, [reduce])

  if (reduce) return null
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[4]" aria-hidden="true" />
}
