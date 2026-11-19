import { Text } from '@react-three/drei'

export default function Title3D() {
  return (
    <Text
      position={[0, -2.05, 0]}
      fontSize={0.3}
      letterSpacing={0.08}
      color="#ffe7ee"
      anchorX="center"
      anchorY="middle"
      maxWidth={8}
    >
      ORLEM CHRISTMAS BALL 2026
      <meshStandardMaterial color="#fff0f4" metalness={0.85} roughness={0.22} emissive="#ff2d55" emissiveIntensity={0.12} />
    </Text>
  )
}


