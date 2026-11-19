import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const tmp = new THREE.Vector3()
const look = new THREE.Vector3()

export default function CameraRig() {
  const { camera } = useThree()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // restrained cinematic drift
    const x = Math.sin(t * 0.045) * 0.35
    const y = 0.32 + Math.sin(t * 0.035) * 0.1
    const z = 9.8 + Math.cos(t * 0.04) * 0.25
    tmp.set(x, y, z)
    camera.position.lerp(tmp, 0.015)
    look.set(0, 0.45 + Math.sin(t * 0.03) * 0.03, 0)
    camera.lookAt(look)
  })
  return null
}

