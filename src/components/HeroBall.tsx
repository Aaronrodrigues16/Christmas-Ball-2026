import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { ensureAnalyser, getAudioBands } from '../audio'

function createDiscoTexture(isMobile: boolean) {
  const size = 1024
  const tiles = 38
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const tileSize = size / tiles
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, size, size)
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const px = x * tileSize
      const py = y * tileSize
      const base = 138 + Math.floor(Math.random() * 45)
      const tint = Math.random()
      let r = base, g = base, b = base
      if (tint > 0.93) { r = base + 32; g = base + 24; b = base + 8 } // champagne highlight
      else if (tint > 0.88) { r = base + 10; g = base + 8; b = base + 2 }
      const gap = 1.7
      const g1 = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize)
      g1.addColorStop(0, `rgb(${Math.min(255, r + 26)},${Math.min(255, g + 24)},${Math.min(255, b + 18)})`)
      g1.addColorStop(0.5, `rgb(${r},${g},${b})`)
      g1.addColorStop(1, `rgb(${Math.max(0, r - 36)},${Math.max(0, g - 36)},${Math.max(0, b - 36)})`)
      ctx.fillStyle = g1
      ctx.fillRect(px + gap, py + gap, tileSize - gap * 2, tileSize - gap * 2)
      ctx.strokeStyle = 'rgba(8,8,8,0.9)'
      ctx.lineWidth = 1.8
      ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1)
      if (Math.random() > 0.55) {
        const sx = px + tileSize * (0.22 + Math.random() * 0.22)
        const sy = py + tileSize * (0.18 + Math.random() * 0.2)
        const sg = ctx.createLinearGradient(sx, sy, sx + tileSize * 0.28, sy + tileSize * 0.2)
        sg.addColorStop(0, 'rgba(242,235,221,0.55)')
        sg.addColorStop(1, 'rgba(242,235,221,0)')
        ctx.fillStyle = sg
        ctx.fillRect(sx, sy, tileSize * 0.22, tileSize * 0.12)
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(10, 7)
  texture.anisotropy = 12
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function LightRays() {
  const group = useRef<THREE.Group>(null!)
  const mats = useRef<THREE.MeshBasicMaterial[]>([])
  const beams = useMemo(() => {
    const colors = ["#f2ebdd", "#c6ad78", "#f2ebdd", "#8e8062"]
    return Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2
      const tilt = 0.78 + (i % 5) * 0.08
      return { rot: [tilt, 0, a] as [number, number, number], color: colors[i % colors.length], len: 11 + (i % 3) * 1.8, phase: i * 0.6 }
    })
  }, [])

  useEffect(() => {
    ensureAnalyser()
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    const { bass, mid, high, beat, level } = getAudioBands()
    
    if (group.current) group.current.rotation.y = t * 0.035
    
    mats.current.forEach((m, i) => {
      if (!m) return
      const b = beams[i]
      if (!b) return
      
      const basePulse = 0.5 + 0.5 * Math.sin(t * 0.35 + (b?.phase ?? 0))
      
      const audioBoost = bass * 1.5 + beat * 2.0 + mid * 0.5
      
      const freqResponse = (i % 3 === 0) ? bass : (i % 3 === 1) ? mid : high
      const beamAudioBoost = freqResponse * 2.0 + beat * 1.5
      
      m.opacity = Math.min(0.08, 0.012 + basePulse * 0.018 + beamAudioBoost * 0.025)
    })
    
    if (group.current) {
      const groupScale = 1 + bass * 0.25 + beat * 0.4
      group.current.scale.setScalar(groupScale)
    }
  })

  return (
    <group ref={group}>
      {beams.map((b, i) => (
        <mesh key={i} rotation={b.rot}>
          <coneGeometry args={[0.045, b.len, 5, 1, true]} />
          <meshBasicMaterial ref={(el) => { if (el) mats.current[i] = el }} color={b.color} transparent opacity={0.015} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}
export default function HeroBall({ isMobile }: { isMobile: boolean }) {
  const dancer = useRef<THREE.Group>(null!)
  const coreMat = useRef<THREE.MeshPhysicalMaterial>(null!)
  const shellMat = useRef<THREE.MeshPhysicalMaterial>(null!)
  const capMat = useRef<THREE.MeshStandardMaterial>(null!)
  const discoMap = useMemo(() => createDiscoTexture(isMobile), [isMobile])

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime()
    if (dancer.current) {
      // Slow, elegant rotation
      dancer.current.rotation.y += dt * 0.45
    }
    const shimmer = 0.5 + 0.5 * Math.sin(t * 0.6)
    if (coreMat.current) {
      coreMat.current.emissiveIntensity = 0.01 + shimmer * 0.015
      coreMat.current.envMapIntensity = 0.85 + shimmer * 0.12
      coreMat.current.roughness = 0.18 + (1 - shimmer) * 0.05
    }
    if (shellMat.current) {
      shellMat.current.opacity = 0.03 + shimmer * 0.015
      shellMat.current.envMapIntensity = 0.55 + shimmer * 0.1
    }
    if (capMat.current) capMat.current.emissiveIntensity = 0.12 + shimmer * 0.08
  })

  const scale = isMobile ? 1.9 : 2.4
  const y = isMobile ? 1.25 : 1.35

  return (
    <group position={[0, y, 0]} scale={scale}>
      <Environment preset="city" />
      <group ref={dancer}>
        <mesh>
          <icosahedronGeometry args={[1.5, 5]} />
          <meshPhysicalMaterial
            ref={coreMat}
            map={discoMap}
            metalness={1}
            roughness={0.2}
            envMapIntensity={0.9}
            color="#d6d2c8"
            emissive="#c6ad78"
            emissiveIntensity={0.015}
            clearcoat={0.45}
            clearcoatRoughness={0.22}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.53, 64, 64]} />
          <meshPhysicalMaterial
            ref={shellMat}
            transmission={0.02}
            roughness={0.16}
            metalness={0.12}
            color="#f2ebdd"
            transparent
            opacity={0.035}
            clearcoat={0.6}
            clearcoatRoughness={0.18}
            envMapIntensity={0.6}
          />
        </mesh>
        <LightRays />
        <mesh position={[0, 1.58, 0]}>
          <cylinderGeometry args={[0.1, 0.18, 0.12, 24]} />
          <meshStandardMaterial ref={capMat} color="#8e8062" metalness={1} roughness={0.28} emissive="#c6ad78" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0, 1.72, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.09, 0.024, 12, 32]} />
          <meshStandardMaterial color="#8e8062" metalness={1} roughness={0.28} />
        </mesh>
      </group>
    </group>
  )
}


