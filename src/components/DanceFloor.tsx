import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { getAudioBands } from '../audio'

const PANEL_COLORS = ['#0b1f16', '#1b0b10', '#0f1020', '#141008']

function Jiver({ x, z, s, phase }: { x: number; z: number; s: number; phase: number }) {
  const group = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const lArm = useRef<THREE.Mesh>(null!)
  const rArm = useRef<THREE.Mesh>(null!)
  const lLeg = useRef<THREE.Mesh>(null!)
  const rLeg = useRef<THREE.Mesh>(null!)
  const head = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { level, beat, bass } = getAudioBands()
    const energy = level * 0.55 + bass * 0.45 + beat * 0.9
    const tt = t * (2.6 + energy * 2.2) + phase
    if (group.current) {
      group.current.position.y = Math.abs(Math.sin(tt)) * (0.006 + beat * 0.012)
      group.current.rotation.y = Math.sin(tt * 0.45) * 0.45
    }
    if (body.current) {
      body.current.rotation.z = Math.sin(tt) * (0.2 + energy * 0.12)
      body.current.rotation.x = Math.sin(tt * 0.5 + 0.4) * 0.08
    }
    if (lArm.current) {
      lArm.current.rotation.z = 1.0 + Math.sin(tt * 1.3) * (0.9 + beat * 0.7)
      lArm.current.rotation.x = Math.sin(tt * 0.9) * 0.55
    }
    if (rArm.current) {
      rArm.current.rotation.z = -1.0 - Math.sin(tt * 1.3 + 1.1) * (0.9 + beat * 0.7)
      rArm.current.rotation.x = Math.sin(tt * 0.9 + 0.6) * 0.55
    }
    if (lLeg.current) lLeg.current.rotation.x = Math.sin(tt) * 0.35
    if (rLeg.current) rLeg.current.rotation.x = -Math.sin(tt) * 0.35
    if (head.current) head.current.rotation.z = Math.sin(tt * 1.4) * 0.18
  })

  const black = '#050505'
  return (
    <group ref={group} position={[x, 0, z]} scale={0.075 * s}>
      <group ref={body}>
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
          <meshStandardMaterial color={black} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh ref={head} position={[0, 1.06, 0]}>
          <sphereGeometry args={[0.21, 12, 12]} />
          <meshStandardMaterial color={black} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh ref={lArm} position={[-0.28, 0.72, 0]}>
          <capsuleGeometry args={[0.065, 0.42, 4, 6]} />
          <meshStandardMaterial color={black} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh ref={rArm} position={[0.28, 0.72, 0]}>
          <capsuleGeometry args={[0.065, 0.42, 4, 6]} />
          <meshStandardMaterial color={black} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh ref={lLeg} position={[-0.1, 0.18, 0]}>
          <capsuleGeometry args={[0.07, 0.36, 4, 6]} />
          <meshStandardMaterial color={black} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh ref={rLeg} position={[0.1, 0.18, 0]}>
          <capsuleGeometry args={[0.07, 0.36, 4, 6]} />
          <meshStandardMaterial color={black} roughness={0.85} metalness={0.05} />
        </mesh>
      </group>
    </group>
  )
}

function FloorTiles() {
  const tiles = useMemo(() => {
    const arr: { x: number; z: number; c: string }[] = []
    const cols = 10
    const rows = 6
    const size = 0.32
    const ox = ((cols - 1) * size) / 2
    const oz = ((rows - 1) * size) / 2
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = (r + c) % PANEL_COLORS.length
        arr.push({ x: c * size - ox, z: r * size - oz, c: PANEL_COLORS[idx] })
      }
    }
    return arr
  }, [])
  const mats = useRef<THREE.MeshStandardMaterial[]>([])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { beat, level } = getAudioBands()
    mats.current.forEach((m, i) => {
      if (!m) return
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 0.7)
      m.emissiveIntensity = 0.05 + pulse * 0.08 + level * 0.12 + beat * 0.28
    })
  })

  return (
    <group position={[0, 0.002, 0]}>
      {tiles.map((tile, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[tile.x, 0, tile.z]}>
          <planeGeometry args={[0.305, 0.305]} />
          <meshStandardMaterial
            ref={(el) => { if (el) mats.current[i] = el }}
            color={tile.c}
            emissive={tile.c}
            emissiveIntensity={0.06}
            metalness={0.3}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function DanceFloor() {
  const people = useMemo(
    () =>
      Array.from({ length: 22 }, () => {
        const angle = Math.random() * Math.PI * 2
        const rad = 0.1 + Math.random() * 0.85
        return {
          x: Math.cos(angle) * rad * 1.4,
          z: Math.sin(angle) * rad * 0.75,
          s: 0.75 + Math.random() * 0.55,
          phase: Math.random() * Math.PI * 2,
        }
      }),
    [],
  )

  return (
    <group position={[0, -3.15, 0]} scale={0.62}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[3.8, 2.4]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={512}
          mixBlur={0.9}
          mixStrength={1.2}
          roughness={0.25}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#070709"
          metalness={0.6}
          mirror={0.7}
        />
      </mesh>

      <FloorTiles />

      <mesh position={[0, 0.0, -1.2]}>
        <boxGeometry args={[3.86, 0.03, 0.04]} />
        <meshStandardMaterial color="#bfa45a" emissive="#d4af37" emissiveIntensity={0.15} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.0, 1.2]}>
        <boxGeometry args={[3.86, 0.03, 0.04]} />
        <meshStandardMaterial color="#bfa45a" emissive="#d4af37" emissiveIntensity={0.15} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[-1.91, 0.0, 0]}>
        <boxGeometry args={[0.04, 0.03, 2.44]} />
        <meshStandardMaterial color="#bfa45a" emissive="#d4af37" emissiveIntensity={0.15} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[1.91, 0.0, 0]}>
        <boxGeometry args={[0.04, 0.03, 2.44]} />
        <meshStandardMaterial color="#bfa45a" emissive="#d4af37" emissiveIntensity={0.15} metalness={0.9} roughness={0.3} />
      </mesh>

      <group position={[0, 0.006, 0.05]}>
        {people.map((p, i) => (
          <Jiver key={i} x={p.x} z={p.z} s={p.s} phase={p.phase} />
        ))}
      </group>

      <pointLight position={[0, 0.25, 0]} intensity={0.25} distance={3} color="#d4af37" />
    </group>
  )
}