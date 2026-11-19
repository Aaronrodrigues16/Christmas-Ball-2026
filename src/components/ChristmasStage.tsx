import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getAudioBands } from '../audio'

function DJBooth() {
  const dj = useRef<THREE.Group>(null!)
  const lHand = useRef<THREE.Mesh>(null!)
  const rHand = useRef<THREE.Mesh>(null!)
  const head = useRef<THREE.Mesh>(null!)
  const screenMat = useRef<THREE.MeshStandardMaterial>(null!)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { level, beat, bass } = getAudioBands()
    const energy = level * 0.5 + bass * 0.4 + beat * 0.7
    const tt = t * (2.2 + energy * 1.8)
    if (dj.current) {
      dj.current.rotation.z = Math.sin(tt * 0.6) * (0.06 + energy * 0.05)
      dj.current.position.y = Math.abs(Math.sin(tt)) * (0.002 + beat * 0.004)
    }
    if (head.current) head.current.rotation.z = Math.sin(tt * 0.9) * 0.12
    if (lHand.current) lHand.current.rotation.z = 0.4 + Math.sin(tt * 1.4) * (0.25 + beat * 0.3)
    if (rHand.current) rHand.current.rotation.z = -0.4 - Math.sin(tt * 1.2 + 0.8) * (0.25 + beat * 0.3)
    if (screenMat.current) screenMat.current.emissiveIntensity = 0.35 + beat * 0.9 + level * 0.3
    if (ringMat.current) ringMat.current.opacity = 0.18 + beat * 0.35 + level * 0.15
  })

  const black = '#000000'
  return (
    <group position={[-0.55, -3.12, -0.82]} scale={0.55}>
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.95, 0.22, 0.26]} />
        <meshStandardMaterial color="#101010" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.11, 0.135]}>
        <planeGeometry args={[0.88, 0.15]} />
        <meshStandardMaterial ref={screenMat} color="#0b2b1d" emissive="#1f6b3f" emissiveIntensity={0.4} metalness={0.2} roughness={0.25} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, 0.11, 0.138]}>
        <ringGeometry args={[0.045, 0.075, 32]} />
        <meshBasicMaterial ref={ringMat} color="#d4af37" transparent opacity={0.2} />
      </mesh>
      <mesh position={[-0.24, 0.232, 0.02]} rotation={[-0.05, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.012, 24]} />
        <meshStandardMaterial color="#0c0c0c" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0.24, 0.232, 0.02]} rotation={[-0.05, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.012, 24]} />
        <meshStandardMaterial color="#0c0c0c" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.228, -0.04]}>
        <boxGeometry args={[0.2, 0.018, 0.11]} />
        <meshStandardMaterial color="#151515" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Christmas garland on booth */}
      <mesh position={[0, 0.232, 0.14]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.44, 0.016, 8, 40, Math.PI]} />
        <meshStandardMaterial color="#1f6b3f" roughness={0.9} />
      </mesh>
      {[-0.28, -0.14, 0, 0.14, 0.28].map((x, i) => (
        <mesh key={i} position={[x, 0.232 - Math.abs(x) * 0.12, 0.145]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#c41230' : '#d4af37'} emissive={i % 2 === 0 ? '#c41230' : '#d4af37'} emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* DJ silhouette */}
      <group ref={dj} position={[0, 0.23, -0.02]}>
        <mesh position={[0, 0.075, 0]}><capsuleGeometry args={[0.042, 0.085, 4, 8]} /><meshBasicMaterial color={black} /></mesh>
        <mesh ref={head} position={[0, 0.16, 0]}><sphereGeometry args={[0.04, 12, 12]} /><meshBasicMaterial color={black} /></mesh>
        <mesh position={[0, 0.165, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.043, 0.006, 8, 20, Math.PI]} /><meshBasicMaterial color={black} /></mesh>
        <mesh ref={lHand} position={[-0.055, 0.065, 0.055]} rotation={[0.4, 0, 0.4]}><capsuleGeometry args={[0.011, 0.075, 4, 6]} /><meshBasicMaterial color={black} /></mesh>
        <mesh ref={rHand} position={[0.055, 0.065, 0.055]} rotation={[0.4, 0, -0.4]}><capsuleGeometry args={[0.011, 0.075, 4, 6]} /><meshBasicMaterial color={black} /></mesh>
      </group>
      {/* mini Christmas tree */}
      <group position={[0.58, 0.22, 0]} scale={0.5}>
        <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.03, 0.04, 0.08, 8]} /><meshStandardMaterial color="#5a3410" /></mesh>
        <mesh position={[0, 0.14, 0]}><coneGeometry args={[0.11, 0.16, 8]} /><meshStandardMaterial color="#1f6b3f" /></mesh>
        <mesh position={[0, 0.24, 0]}><coneGeometry args={[0.085, 0.14, 8]} /><meshStandardMaterial color="#228b4d" /></mesh>
        <mesh position={[0, 0.33, 0]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.8} /></mesh>
      </group>
    </group>
  )
}

function BandMember({ position, instrument }: { position: [number, number, number]; instrument: 'mic' | 'guitar' | 'sax' }) {
  const group = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Mesh>(null!)
  const lArm = useRef<THREE.Mesh>(null!)
  const rArm = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { level, beat, bass } = getAudioBands()
    const energy = level * 0.5 + bass * 0.4 + beat * 0.7
    const tt = t * (2.1 + energy * 1.6) + position[0] * 2
    if (group.current) group.current.position.y = Math.abs(Math.sin(tt)) * (0.002 + beat * 0.004)
    if (body.current) body.current.rotation.z = Math.sin(tt) * (0.08 + energy * 0.06)
    if (head.current) head.current.rotation.z = Math.sin(tt * 0.8 + 0.4) * 0.12
    if (instrument === 'guitar') {
      if (lArm.current) lArm.current.rotation.z = 0.7 + Math.sin(tt * 1.6) * 0.25
      if (rArm.current) rArm.current.rotation.x = -0.6 + Math.sin(tt * 2.2) * 0.35
    } else if (instrument === 'sax') {
      if (lArm.current) lArm.current.rotation.z = 0.6 + Math.sin(tt * 0.8) * 0.15
      if (rArm.current) rArm.current.rotation.z = -0.5 + Math.sin(tt * 0.8) * 0.1
    } else {
      if (lArm.current) lArm.current.rotation.z = 0.5 + Math.sin(tt * 0.7) * 0.15
      if (rArm.current) rArm.current.rotation.z = -0.9 + Math.sin(tt * 0.9) * 0.12
    }
  })

  const black = '#000000'
  return (
    <group ref={group} position={position} scale={0.07}>
      <group ref={body}>
        <mesh position={[0, 0.55, 0]}><capsuleGeometry args={[0.22, 0.5, 4, 8]} /><meshBasicMaterial color={black} /></mesh>
        <mesh ref={head} position={[0, 1.06, 0]}><sphereGeometry args={[0.21, 12, 12]} /><meshBasicMaterial color={black} /></mesh>
        <mesh ref={lArm} position={[-0.28, 0.72, 0]}><capsuleGeometry args={[0.065, 0.42, 4, 6]} /><meshBasicMaterial color={black} /></mesh>
        <mesh ref={rArm} position={[0.28, 0.72, 0]}><capsuleGeometry args={[0.065, 0.42, 4, 6]} /><meshBasicMaterial color={black} /></mesh>
        <mesh position={[-0.1, 0.18, 0]}><capsuleGeometry args={[0.07, 0.36, 4, 6]} /><meshBasicMaterial color={black} /></mesh>
        <mesh position={[0.1, 0.18, 0]}><capsuleGeometry args={[0.07, 0.36, 4, 6]} /><meshBasicMaterial color={black} /></mesh>
      </group>
      {instrument === 'mic' && (
        <group position={[0.18, 0.55, 0.12]}>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.01, 0.01, 0.5, 6]} /><meshBasicMaterial color={black} /></mesh>
          <mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color={black} /></mesh>
        </group>
      )}
      {instrument === 'guitar' && (
        <group position={[0.05, 0.45, 0.18]} rotation={[0.2, 0.4, -0.5]}>
          <mesh><boxGeometry args={[0.22, 0.32, 0.04]} /><meshBasicMaterial color={black} /></mesh>
          <mesh position={[0, 0.32, 0]}><boxGeometry args={[0.04, 0.34, 0.03]} /><meshBasicMaterial color={black} /></mesh>
        </group>
      )}
      {instrument === 'sax' && (
        <group position={[0.1, 0.5, 0.16]} rotation={[0.3, 0.2, -0.2]}>
          <mesh><cylinderGeometry args={[0.02, 0.03, 0.4, 8]} /><meshBasicMaterial color={black} /></mesh>
          <mesh position={[0.05, -0.2, 0]} rotation={[0, 0, 0.8]}><cylinderGeometry args={[0.025, 0.02, 0.15, 8]} /><meshBasicMaterial color={black} /></mesh>
        </group>
      )}
    </group>
  )
}

function LiveBandBooth() {
  const lights = useRef<THREE.MeshStandardMaterial[]>([])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { beat, level } = getAudioBands()
    lights.current.forEach((m, i) => {
      if (!m) return
      m.emissiveIntensity = 0.25 + beat * 0.8 + Math.max(0, Math.sin(t * 2 + i)) * 0.2 + level * 0.2
    })
  })

  return (
    <group position={[0.55, -3.15, -1.05]} scale={0.55}>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[2.2, 0.12, 0.5]} />
        <meshStandardMaterial color="#141414" metalness={0.2} roughness={0.7} />
      </mesh>
      <mesh position={[-1.0, 0.4, -0.2]}><boxGeometry args={[0.035, 0.68, 0.035]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[1.0, 0.4, -0.2]}><boxGeometry args={[0.035, 0.68, 0.035]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0, 0.74, -0.2]}><boxGeometry args={[2.04, 0.035, 0.035]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      {Array.from({ length: 9 }).map((_, i) => {
        const x = -0.88 + i * 0.22
        const colors = ['#d4af37', '#c41230', '#1f6b3f', '#ffffff']
        const c = colors[i % colors.length]
        return (
          <mesh key={i} position={[x, 0.69 - (i % 2) * 0.04, -0.17]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshStandardMaterial ref={(el) => { if (el) lights.current[i] = el }} color={c} emissive={c} emissiveIntensity={0.4} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.58, -0.16]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.11, 0.028, 10, 24]} />
        <meshStandardMaterial color="#1f6b3f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.49, -0.14]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#c41230" emissive="#c41230" emissiveIntensity={0.4} />
      </mesh>
      <BandMember position={[-0.45, 0.12, 0.05]} instrument="guitar" />
      <BandMember position={[0, 0.12, 0.08]} instrument="mic" />
      <BandMember position={[0.45, 0.12, 0.04]} instrument="sax" />
      <mesh position={[-0.82, 0.17, 0.08]}><boxGeometry args={[0.2, 0.22, 0.16]} /><meshBasicMaterial color="#050505" /></mesh>
      <mesh position={[0.82, 0.17, 0.08]}><boxGeometry args={[0.2, 0.22, 0.16]} /><meshBasicMaterial color="#050505" /></mesh>
    </group>
  )
}

export default function ChristmasStage() {
  return (
    <group>
      <DJBooth />
      <LiveBandBooth />
    </group>
  )
}
