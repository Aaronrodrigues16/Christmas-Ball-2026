import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useRef } from 'react'
import type { Mesh } from 'three'

function RotatingTree() {
  const ref = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4
    }
  })

  return (
    <group ref={ref as any} position={[0, -0.5, 0]}>
      {/* Simple low-poly Christmas tree placeholder */}
      <mesh position={[0, 0.6, 0]}>
        <coneGeometry args={[1.2, 1.4, 6]} />
        <meshStandardMaterial color="#1f6b3a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <coneGeometry args={[0.9, 1.2, 6]} />
        <meshStandardMaterial color="#238047" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <coneGeometry args={[0.6, 1, 6]} />
        <meshStandardMaterial color="#2f9a56" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.6, 8]} />
        <meshStandardMaterial color="#6b3a1e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#F5CE62" emissive="#F5CE62" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

export default function Scene() {
  return (
    <div className="absolute inset-0">
      <Canvas shadows>
        <color attach="background" args={['#430B04']} />
        <PerspectiveCamera makeDefault position={[0, 1.8, 5]} fov={45} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 3]} intensity={1.4} color="#FFF3C4" />
        <pointLight position={[-3, 2, -2]} intensity={0.6} color="#F5CE62" />
        <RotatingTree />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
          <circleGeometry args={[6, 48]} />
          <meshStandardMaterial color="#2b0503" roughness={1} />
        </mesh>
        <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
      </Canvas>
    </div>
  )
}
