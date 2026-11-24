import { useEffect } from 'react'

const DIRS = [
  [1,0],[0.707,0.707],[0,-1],[-0.707,0.707],
  [-1,0],[0,-1],[-0.707,-0.707],[0.707,-0.707]
]

export default function HolidayPointer() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const trailCount = coarse ? 8 : 14
    const bursts = []
    const cap = coarse ? 2 : 4
    const flakeCount = coarse ? 4 : 6

    // Snow trail (visible desktop + mobile)
    const container = document.createElement('div')
    container.className = 'snow-trail'
    container.setAttribute('aria-hidden','true')
    const flakes = []
    for (let i=0;i<trailCount;i++){
      const s = document.createElement('span')
      s.className = 'snow-trail-flake'
      s.textContent = '❄'
      s.style.opacity = String(1 - i/trailCount * 0.85)
      s.style.fontSize = (16 - i*0.6) + 'px'
      container.appendChild(s)
      flakes.push({ el: s })
    }
    document.body.appendChild(container)

    const positions = flakes.map(()=>({x:-100,y:-100}))
    let tx = -100, ty = -100
    let raf = 0
    const loop = () => {
      raf = 0
      positions[0].x += (tx - positions[0].x) * 0.35
      positions[0].y += (ty - positions[0].y) * 0.35
      for (let i=1;i<positions.length;i++){
        positions[i].x += (positions[i-1].x - positions[i].x) * 0.28
        positions[i].y += (positions[i-1].y - positions[i].y) * 0.28
      }
      flakes.forEach((f,i)=>{
        f.el.style.transform = `translate3d(${positions[i].x}px,${positions[i].y}px,0) translate(-50%,-50%)`
      })
      const dist = Math.hypot(tx-positions[positions.length-1].x, ty-positions[positions.length-1].y)
      if (dist > 0.5) raf = requestAnimationFrame(loop)
    }
    const move = (e) => {
      tx = e.clientX; ty = e.clientY
      if (!raf) raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', (e) => { tx = e.clientX; ty = e.clientY; if(!raf) raf=requestAnimationFrame(loop) }, { passive: true })

    // Burst
    const burst = (x, y) => {
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
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      if (container.parentNode) container.parentNode.removeChild(container)
      bursts.forEach(b => b.parentNode && b.parentNode.removeChild(b))
    }
  }, [])
  return null
}