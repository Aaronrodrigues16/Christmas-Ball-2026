import { useEffect } from 'react'

const DIRS = [
  [1,0],[0.707,0.707],[0,-1],[-0.707,0.707],
  [-1,0],[0,-1],[-0.707,-0.707],[0.707,-0.707]
]

export default function HolidayPointer() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduced) return
    let follower = null
    let raf = 0
    let tx = 0, ty = 0, cx = 0, cy = 0
    let active = true
    const bursts = []
    const cap = fine ? 4 : 2
    const flakeCount = fine ? 6 : 4

    if (fine) {
      follower = document.createElement('div')
      follower.className = 'holiday-pointer'
      follower.setAttribute('aria-hidden','true')
      follower.innerHTML = '✦<span class="hp-dot"></span><span class="hp-dot"></span>'
      document.body.appendChild(follower)
      const move = (e) => {
        tx = e.clientX; ty = e.clientY
        if (!raf) raf = requestAnimationFrame(loop)
      }
      const loop = () => {
        raf = 0
        cx += (tx - cx) * 0.22
        cy += (ty - cy) * 0.22
        if (follower) follower.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`
        if (Math.hypot(tx-cx, ty-cy) > 0.5) raf = requestAnimationFrame(loop)
      }
      window.addEventListener('pointermove', move, { passive: true })
      // store for cleanup
      follower._cleanup = () => window.removeEventListener('pointermove', move)
    }

    const burst = (x, y) => {
      if (reduced) return
      // cap
      while (bursts.length >= cap) { const old = bursts.shift(); if (old && old.parentNode) old.parentNode.removeChild(old) }
      const wrap = document.createElement('div')
      wrap.className = 'holiday-burst'
      wrap.setAttribute('aria-hidden','true')
      wrap.style.left = x + 'px'
      wrap.style.top = y + 'px'
      const ring = document.createElement('div')
      ring.className = 'holiday-ring'
      wrap.appendChild(ring)
      for (let i=0;i<flakeCount;i++){
        const fl = document.createElement('div')
        fl.className = 'holiday-flake'
        const d = DIRS[i % DIRS.length]
        fl.style.setProperty('--dx', (d[0]*26)+'px')
        fl.style.setProperty('--dy', (d[1]*26)+'px')
        wrap.appendChild(fl)
      }
      document.body.appendChild(wrap)
      bursts.push(wrap)
      const remove = () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); const i=bursts.indexOf(wrap); if(i>-1) bursts.splice(i,1) }
      wrap.addEventListener('animationend', remove, { once: true })
      setTimeout(remove, 700)
    }

    const down = (e) => {
      let x = e.clientX, y = e.clientY
      const el = (e.target && e.target.closest) ? e.target.closest('a,button,summary') : null
      if (el) { const r = el.getBoundingClientRect(); x = r.left + r.width/2; y = r.top + r.height/2 }
      burst(x,y)
    }
    window.addEventListener('pointerdown', down, { passive: true })

    return () => {
      active = false
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', down)
      if (follower && follower._cleanup) follower._cleanup()
      if (follower && follower.parentNode) follower.parentNode.removeChild(follower)
      bursts.forEach(b => b.parentNode && b.parentNode.removeChild(b))
    }
  }, [])
  return null
}