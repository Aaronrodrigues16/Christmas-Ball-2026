import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, MeshTransmissionMaterial, PerspectiveCamera, Sparkles, Text } from '@react-three/drei'
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

function CameraRig() {
  const t = useRef(0)
  useFrame((state, delta) => {
    t.current += delta * 0.15
    const time = t.current
    const x = Math.sin(time) * 0.6
    const y = 1.2 + Math.sin(time * 0.7) * 0.15
    const z = 6 + Math.cos(time * 0.6) * 0.4
    state.camera.position.lerp(new THREE.Vector3(x, y, z), 0.02)
    state.camera.lookAt(0, 0.8, 0)
  })
  return null
}

function HeroOrnament() {
  const ref = useRef<THREE.Mesh>(null)
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1.15, 128, 128), [])
  const capGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.28, 0.18, 32), [])
  const ringGeo = useMemo(() => new THREE.TorusGeometry(0.16, 0.03, 16, 64), [])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.18
      ref.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.05
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={ref} position={[0, 0.9, 0]}>
        <mesh geometry={sphereGeo}>
          <MeshTransmissionMaterial
            backside
            samples={8}
            thickness={0.6}
            roughness={0.05}
            transmission={1}
            ior={1.4}
            chromaticAberration={0.03}
            anisotropy={0.2}
            color="#7a1a10"
            attenuationDistance={0.6}
            attenuationColor="#F5CE62"
          />
        </mesh>
        <mesh geometry={capGeo} position={[0, 1.2, 0]}>
          <meshStandardMaterial color="#D7C6A5" metalness={1} roughness={0.18} envMapIntensity={1.4} />
        </mesh>
        <mesh geometry={ringGeo} position={[0, 1.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#F5CE62" metalness={1} roughness={0.15} emissive="#F5CE62" emissiveIntensity={0.2} />
        </mesh>
      </group>
    </Float>
  )
}

function Title3D() {
  return (
    <group position={[0, -0.9, 0]}>
      <Text
        font="https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff"
        fontSize={0.38}
        letterSpacing={0.02}
        color="#F5CE62"
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
        textAlign="center"
      >
        Orlem Christmas Ball 2026
        <meshStandardMaterial color="#F5CE62" metalness={1} roughness={0.22} envMapIntensity={1.6} />
      </Text>
      <Text
        position={[0, -0.38, 0]}
        font="https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.woff"
        fontSize={0.12}
        letterSpacing={0.18}
        color="#D7C6A5"
        anchorX="center"
        anchorY="middle"
      >
        PCPL PRESENTS • BY INVITATION ONLY
        <meshStandardMaterial color="#D7C6A5" metalness={0.6} roughness={0.35} />
      </Text>
    </group>
  )
}

function SceneContents() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.2, 6]} fov={42} />
      <CameraRig />
      <color attach="background" args={['#120405']} />
      <fog attach="fog" args={['#120405', 6, 14]} />
      <ambientLight intensity={0.25} />
      <spotLight position={[4, 6, 4]} intensity={2.2} angle={0.4} penumbra={0.8} color="#fff3d6" />
      <pointLight position={[-3, 2, 2]} intensity={1.2} color="#F5CE62" />
      <pointLight position={[0, -1, 3]} intensity={0.5} color="#7a1a10" />

      <Suspense fallback={null}>
        <Environment preset="night" background={false} />
      </Suspense>

      <HeroOrnament />
      <Title3D />
      <Sparkles count={140} scale={[10, 6, 6]} size={2.2} speed={0.25} opacity={0.6} color="#F5CE62" />
      <Sparkles count={60} scale={[8, 5, 5]} size={3} speed={0.15} opacity={0.25} color="#ffffff" />

      <EffectComposer>
        <Bloom luminanceThreshold={0.25} luminanceSmoothing={0.9} intensity={0.9} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.85} />
        <DepthOfField focusDistance={0.02} focalLength={0.04} bokehScale={2.2} height={480} />
      </EffectComposer>
    </>
  )
}

export default function Scene() {
  return (
    <div className="absolute inset-0">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: false }} shadows>
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  )
}
