import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Snowfall({ count = 400 }: { count?: number }) {
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))
  const actualCount = isMobile ? Math.min(count, 150) : count
  const ref = useRef<THREE.Points>(null!)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(actualCount * 3)
    const speeds = new Float32Array(actualCount)
    for (let i = 0; i < actualCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14
      speeds[i] = 0.3 + Math.random() * 0.7
    }
    return { positions, speeds }
  }, [actualCount])

  useFrame((_, delta) => {
    if (!ref.current) return
    const dt = Math.min(delta, 0.05)
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const t = performance.now() * 0.001
    for (let i = 0; i < actualCount; i++) {
      pos[i * 3 + 1] -= speeds[i] * dt * 0.8
      pos[i * 3] += Math.sin(t + i) * dt * 0.15
      if (pos[i * 3 + 1] < -8) {
        pos[i * 3 + 1] = 8
        pos[i * 3] = (Math.random() - 0.5) * 20
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={actualCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#ffffff" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function FloatingOrnaments() {
  const group = useRef<THREE.Group>(null!)
  const ornaments = useMemo(() => {
    const colors = ['#ff1744', '#c2185b', '#d4af37', '#1b5e20', '#ff6b81', '#ffd700']
    return Array.from({ length: 12 }, (_, i) => ({
      pos: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, -2 - Math.random() * 6] as [number, number, number],
      scale: 0.08 + Math.random() * 0.12,
      color: colors[i % colors.length],
      speed: 0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      metal: Math.random() > 0.5,
    }))
  }, [])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.children.forEach((child, i) => {
      const o = ornaments[i]
      child.position.y = o.pos[1] + Math.sin(t * o.speed + o.phase) * 0.4
      child.rotation.y = t * 0.3 + o.phase
      child.rotation.x = Math.sin(t * 0.2 + o.phase) * 0.2
    })
  })

  return (
    <group ref={group}>
      {ornaments.map((o, i) => (
        <mesh key={i} position={o.pos} scale={o.scale}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={o.color}
            metalness={o.metal ? 0.9 : 0.3}
            roughness={o.metal ? 0.15 : 0.4}
            emissive={o.color}
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  )
}

function ChristmasStar() {
  const ref = useRef<THREE.Mesh>(null!)
  const starShape = useMemo(() => {
    const shape = new THREE.Shape()
    const outer = 0.5
    const inner = 0.22
    const points = 5
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()
    return shape
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.1
    ref.current.rotation.y = t * 0.15
    const s = 1 + Math.sin(t * 1.5) * 0.05
    ref.current.scale.setScalar(s)
  })

  return (
    <mesh ref={ref} position={[0, 2.8, -1]}>
      <extrudeGeometry args={[starShape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 2 }]} />
      <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} emissive="#ffcc00" emissiveIntensity={0.4} />
    </mesh>
  )
}

function CandyCaneRings() {
  const group = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.rotation.y = t * 0.08
    group.current.rotation.x = Math.sin(t * 0.1) * 0.05
  })
  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh rotation={[Math.PI / 2.5, 0.2, 0]}>
        <torusGeometry args={[3.2, 0.02, 16, 120]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 1.8, -0.3, 0.5]}>
        <torusGeometry args={[3.6, 0.012, 16, 120]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 2.1, 0.6, -0.2]}>
        <torusGeometry args={[4.1, 0.01, 16, 120]} />
        <meshBasicMaterial color="#2e7d32" transparent opacity={0.12} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

function MiniChristmasTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const group = useRef<THREE.Group>(null!)
  const lights = useMemo(() => {
    const colors = ['#ff1744', '#ffd700', '#ff6b81', '#ffffff', '#4caf50']
    return Array.from({ length: 12 }, (_, i) => {
      const y = -0.2 + (i / 12) * 1.3
      const r = 0.42 - (i / 12) * 0.32
      const a = (i / 12) * Math.PI * 4.5
      return { pos: [Math.cos(a) * r, y, Math.sin(a) * r] as [number, number, number], color: colors[i % colors.length], phase: i * 0.7 }
    })
  }, [])
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2 + position[0]) * 0.08
  })
  return (
    <group ref={group} position={position} scale={scale}>
      <mesh position={[0, -0.6, 0]}><cylinderGeometry args={[0.09, 0.12, 0.28, 8]} /><meshStandardMaterial color="#5d4037" roughness={0.9} /></mesh>
      <mesh position={[0, -0.22, 0]}><coneGeometry args={[0.55, 0.75, 16]} /><meshStandardMaterial color="#0f4d2e" roughness={0.75} /></mesh>
      <mesh position={[0, 0.18, 0]}><coneGeometry args={[0.42, 0.6, 16]} /><meshStandardMaterial color="#156c3a" roughness={0.72} /></mesh>
      <mesh position={[0, 0.52, 0]}><coneGeometry args={[0.28, 0.5, 16]} /><meshStandardMaterial color="#1e8a4c" roughness={0.7} /></mesh>
      <mesh position={[0, 0.82, 0]}><octahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color="#ffd700" emissive="#ffcc00" emissiveIntensity={0.9} metalness={0.85} roughness={0.18} /></mesh>
      {lights.map((l, i) => (
        <mesh key={i} position={l.pos}><sphereGeometry args={[0.028, 8, 8]} /><meshStandardMaterial color={l.color} emissive={l.color} emissiveIntensity={1.3} /></mesh>
      ))}
    </group>
  )
}

function HeroChristmasTree() {
  const group = useRef<THREE.Group>(null!)
  const starRef = useRef<THREE.Mesh>(null!)
  const bulbMats = useRef<THREE.MeshStandardMaterial[]>([])
  const bulbs = useMemo(() => {
    const colors = ['#ff1744', '#ffd700', '#4caf50', '#ff6b81', '#ffffff', '#d4af37', '#e91e63']
    const out: { pos: [number, number, number]; color: string; phase: number }[] = []
    const tiers = [
      { y: -1.0, r: 1.05, n: 10 },
      { y: -0.4, r: 0.85, n: 9 },
      { y: 0.15, r: 0.65, n: 8 },
      { y: 0.65, r: 0.45, n: 7 },
      { y: 1.05, r: 0.28, n: 6 },
    ]
    let k = 0
    tiers.forEach((t) => {
      for (let i = 0; i < t.n; i++) {
        const a = (i / t.n) * Math.PI * 2 + t.y * 0.7
        out.push({ pos: [Math.cos(a) * t.r, t.y, Math.sin(a) * t.r], color: colors[k % colors.length], phase: k * 0.5 })
        k++
      }
    })
    return out
  }, [])
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.rotation.y = Math.sin(t * 0.12) * 0.06
    if (starRef.current) {
      starRef.current.rotation.y = t * 0.6
      const s = 1 + Math.sin(t * 2.2) * 0.08
      starRef.current.scale.setScalar(s)
      const mat = starRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.4
    }
    bulbMats.current.forEach((m, i) => {
      if (!m) return
      m.emissiveIntensity = 1.1 + Math.sin(t * 2.4 + (bulbs[i]?.phase ?? 0)) * 0.6
    })
  })
  return (
    <group ref={group} position={[0, -2.0, -6.2]} scale={1.05}>
      {/* trunk */}
      <mesh position={[0, -1.55, 0]}><cylinderGeometry args={[0.18, 0.24, 0.5, 10]} /><meshStandardMaterial color="#4e342e" roughness={0.95} /></mesh>
      {/* lush foliage tiers */}
      <mesh position={[0, -0.95, 0]}><coneGeometry args={[1.35, 1.2, 20]} /><meshStandardMaterial color="#0b3d22" roughness={0.8} /></mesh>
      <mesh position={[0, -0.35, 0]}><coneGeometry args={[1.1, 1.05, 20]} /><meshStandardMaterial color="#0f5a30" roughness={0.78} /></mesh>
      <mesh position={[0, 0.2, 0]}><coneGeometry args={[0.85, 0.95, 20]} /><meshStandardMaterial color="#157a3e" roughness={0.75} /></mesh>
      <mesh position={[0, 0.7, 0]}><coneGeometry args={[0.6, 0.8, 20]} /><meshStandardMaterial color="#1b9150" roughness={0.72} /></mesh>
      <mesh position={[0, 1.1, 0]}><coneGeometry args={[0.38, 0.65, 20]} /><meshStandardMaterial color="#22a85d" roughness={0.7} /></mesh>
      {/* star topper */}
      <mesh ref={starRef} position={[0, 1.55, 0]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffcc33" emissiveIntensity={1.4} metalness={0.9} roughness={0.15} />
      </mesh>
      {/* garland rings */}
      <mesh position={[0, -0.6, 0]} rotation={[0.1, 0, 0]}><torusGeometry args={[1.0, 0.025, 8, 48]} /><meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.25} metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 0.0, 0]} rotation={[-0.08, 0.4, 0]}><torusGeometry args={[0.78, 0.022, 8, 48]} /><meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={0.2} metalness={0.5} roughness={0.35} /></mesh>
      <mesh position={[0, 0.5, 0]} rotation={[0.06, -0.3, 0]}><torusGeometry args={[0.55, 0.02, 8, 48]} /><meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.25} metalness={0.7} roughness={0.3} /></mesh>
      {/* bauble lights */}
      {bulbs.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial ref={(el) => { if (el) bulbMats.current[i] = el }} color={b.color} emissive={b.color} emissiveIntensity={1.2} metalness={0.3} roughness={0.25} />
        </mesh>
      ))}
      {/* tree glow */}
      <pointLight position={[0, 0.2, 0.6]} intensity={6} distance={6} color="#2ecc71" />
      <pointLight position={[0, 0.8, 0.4]} intensity={4} distance={4} color="#ffd700" />
    </group>
  )
}

function GiftBoxes() {
  const gifts = useMemo(() => [
    { pos: [-1.2, -3.15, -5.2] as [number, number, number], size: [0.6, 0.45, 0.55] as [number, number, number], color: '#b71c1c', ribbon: '#ffd700', rot: 0.15 },
    { pos: [-0.5, -3.22, -5.0] as [number, number, number], size: [0.4, 0.32, 0.4] as [number, number, number], color: '#1b5e20', ribbon: '#ffffff', rot: -0.3 },
    { pos: [0.2, -3.25, -5.3] as [number, number, number], size: [0.35, 0.28, 0.35] as [number, number, number], color: '#c2185b', ribbon: '#ffd700', rot: 0.4 },
    { pos: [0.8, -3.18, -5.1] as [number, number, number], size: [0.5, 0.38, 0.45] as [number, number, number], color: '#1565c0', ribbon: '#ff1744', rot: -0.12 },
    { pos: [-4.8, -3.1, -3.5] as [number, number, number], size: [0.55, 0.4, 0.55] as [number, number, number], color: '#b71c1c', ribbon: '#ffd700', rot: 0.2 },
    { pos: [-4.2, -3.2, -3.0] as [number, number, number], size: [0.35, 0.3, 0.35] as [number, number, number], color: '#1b5e20', ribbon: '#ff1744', rot: -0.4 },
    { pos: [4.6, -3.1, -3.4] as [number, number, number], size: [0.5, 0.38, 0.45] as [number, number, number], color: '#4a148c', ribbon: '#ffd700', rot: -0.15 },
    { pos: [4.1, -3.25, -2.8] as [number, number, number], size: [0.3, 0.25, 0.32] as [number, number, number], color: '#c2185b', ribbon: '#ffffff', rot: 0.35 },
  ], [])
  return (
    <group>
      {gifts.map((g, i) => (
        <group key={i} position={g.pos} rotation={[0, g.rot, 0]}>
          <mesh><boxGeometry args={g.size} /><meshStandardMaterial color={g.color} metalness={0.25} roughness={0.45} emissive={g.color} emissiveIntensity={0.08} /></mesh>
          <mesh scale={[1.02, 0.12, 1.02]}><boxGeometry args={g.size} /><meshStandardMaterial color={g.ribbon} metalness={0.7} roughness={0.2} emissive={g.ribbon} emissiveIntensity={0.18} /></mesh>
          <mesh scale={[0.12, 1.02, 1.02]}><boxGeometry args={g.size} /><meshStandardMaterial color={g.ribbon} metalness={0.7} roughness={0.2} emissive={g.ribbon} emissiveIntensity={0.18} /></mesh>
          <mesh scale={[1.02, 1.02, 0.12]}><boxGeometry args={g.size} /><meshStandardMaterial color={g.ribbon} metalness={0.7} roughness={0.2} emissive={g.ribbon} emissiveIntensity={0.12} /></mesh>
        </group>
      ))}
    </group>
  )
}

function CandyCanes() {
  const caneStripe = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64; c.height = 128
    const ctx = c.getContext('2d')!
    for (let y = 0; y < 8; y++) { ctx.fillStyle = y % 2 === 0 ? '#ffffff' : '#d32f2f'; ctx.fillRect(0, y * 16, 64, 16) }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1, 4)
    return t
  }, [])
  const canes = [
    { pos: [-5.8, -2.6, -5.0] as [number, number, number], rot: 0.2, s: 1 },
    { pos: [5.6, -2.6, -5.2] as [number, number, number], rot: -0.25, s: 0.95 },
    { pos: [-2.2, -2.7, -5.6] as [number, number, number], rot: 0.1, s: 0.8 },
    { pos: [2.0, -2.7, -5.7] as [number, number, number], rot: -0.15, s: 0.85 },
  ]
  return (
    <group>
      {canes.map((c, i) => (
        <group key={i} position={c.pos} rotation={[0, c.rot, 0]} scale={c.s}>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.06, 0.06, 1.2, 12]} /><meshStandardMaterial map={caneStripe} roughness={0.35} metalness={0.1} /></mesh>
          <mesh position={[0.12, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.12, 0.06, 10, 24, Math.PI]} /><meshStandardMaterial map={caneStripe} roughness={0.35} metalness={0.1} /></mesh>
        </group>
      ))}
    </group>
  )
}

function Wreath({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5 + position[0]) * 0.03 })
  const berries = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    return [Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0.08] as [number, number, number]
  }), [])
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh><torusGeometry args={[0.32, 0.08, 10, 32]} /><meshStandardMaterial color="#1b5e20" roughness={0.8} /></mesh>
      <mesh><torusGeometry args={[0.32, 0.055, 10, 32]} /><meshStandardMaterial color="#2e7d32" roughness={0.85} /></mesh>
      {berries.map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#d32f2f" emissive="#ff1744" emissiveIntensity={0.4} /></mesh>
      ))}
      <mesh position={[0, -0.38, 0.05]}><boxGeometry args={[0.18, 0.12, 0.02]} /><meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.3} /></mesh>
    </group>
  )
}

function StringLights() {
  const group = useRef<THREE.Group>(null!)
  const bulbMats = useRef<THREE.MeshStandardMaterial[]>([])
  const bulbs = useMemo(() => {
    const colors = ['#ff1744', '#ffd700', '#4caf50', '#ff6b81', '#ffffff', '#40c4ff']
    return Array.from({ length: 22 }, (_, i) => ({
      pos: [-7 + (i / 21) * 14, 3.7 + Math.sin((i / 21) * Math.PI) * 0.45 - Math.cos((i / 21) * Math.PI * 3) * 0.08, -4.2] as [number, number, number],
      color: colors[i % colors.length], phase: i * 0.45,
    }))
  }, [])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    bulbMats.current.forEach((m, i) => {
      if (!m) return
      const b = bulbs[i]
      m.emissiveIntensity = 0.9 + Math.sin(t * 2.5 + b.phase) * 0.6 + (Math.sin(t * 7 + i) > 0.85 ? 0.8 : 0)
    })
  })
  const lineGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(bulbs.map((b) => new THREE.Vector3(...b.pos))), [bulbs])
  return (
    <group ref={group}>
      <line><primitive object={lineGeom} attach="geometry" /><lineBasicMaterial color="#333" transparent opacity={0.7} /></line>
      {bulbs.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshStandardMaterial ref={(el) => { if (el) bulbMats.current[i] = el }} color={b.color} emissive={b.color} emissiveIntensity={1.2} metalness={0.2} roughness={0.3} />
        </mesh>
      ))}
      <pointLight position={[0, 3.6, -3.8]} intensity={2} distance={8} color="#ffd700" />
    </group>
  )
}

function HangingBaubles() {
  const group = useRef<THREE.Group>(null!)
  const items = useMemo(() => {
    const colors = ['#d4af37', '#ff1744', '#1b5e20', '#ff6b81']
    return Array.from({ length: 8 }, (_, i) => ({
      x: -5 + i * 1.45, y: 3.2 - (i % 2) * 0.5, z: -5 - (i % 3) * 0.4,
      color: colors[i % colors.length], phase: i * 0.6, len: 0.35 + (i % 3) * 0.15,
    }))
  }, [])
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t * 0.9 + items[i].phase) * 0.08
      child.rotation.x = Math.sin(t * 0.7 + items[i].phase) * 0.05
    })
  })
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <group key={i} position={[it.x, it.y, it.z]}>
          <mesh position={[0, it.len / 2, 0]}><cylinderGeometry args={[0.003, 0.003, it.len, 6]} /><meshBasicMaterial color="#d4af37" transparent opacity={0.5} /></mesh>
          <mesh><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color={it.color} metalness={0.85} roughness={0.18} emissive={it.color} emissiveIntensity={0.2} /></mesh>
          <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.03, 0.03, 0.04, 6]} /><meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} /></mesh>
        </group>
      ))}
    </group>
  )
}

function GroundGlow() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.4, 0]}>
        <ringGeometry args={[1.0, 4.8, 64]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.09} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.39, 0]}>
        <ringGeometry args={[2.0, 5.8, 64]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.06} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.38, -5.5]}>
        <circleGeometry args={[2.2, 48]} />
        <meshBasicMaterial color="#1b5e20" transparent opacity={0.08} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function ChristmasArt() {
  return (
    <group>
      <Snowfall />
      <FloatingOrnaments />
      <ChristmasStar />
      <CandyCaneRings />
      <HeroChristmasTree />
      <MiniChristmasTree position={[-5.2, -2.7, -3.5]} scale={1.15} />
      <MiniChristmasTree position={[5.0, -2.8, -3.8]} scale={1.05} />
      <MiniChristmasTree position={[-3.2, -2.9, -5.8]} scale={0.8} />
      <MiniChristmasTree position={[3.0, -2.9, -6.0]} scale={0.75} />
      <GiftBoxes />
      <CandyCanes />
      <StringLights />
      <HangingBaubles />
      <Wreath position={[-6.2, 1.2, -5.5]} scale={1.1} />
      <Wreath position={[6.0, 1.0, -5.8]} scale={1.0} />
      <Wreath position={[0, 3.2, -6.5]} scale={0.9} />
      <GroundGlow />
    </group>
  )
}
