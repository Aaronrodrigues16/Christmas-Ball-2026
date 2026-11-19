import { Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import CameraRig from './CameraRig'
import HeroBall from './HeroBall'

export default function Scene({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <CameraRig />

      {/* Midnight gold cinematic lighting */}
      <ambientLight intensity={0.14} color="#f2ebdd" />
      <directionalLight position={[3.5, 6.5, 4.5]} intensity={0.55} color="#f2ebdd" />
      <directionalLight position={[-5, 3.5, 2]} intensity={0.16} color="#8e8062" />
      <spotLight position={[0, 7.5, 2.5]} intensity={0.65} angle={0.4} penumbra={1} color="#fff7e6" />
      <pointLight position={[2.4, 1.4, 2.6]} intensity={0.18} color="#c6ad78" />
      <pointLight position={[-2.2, 1.0, 2.0]} intensity={0.12} color="#8e8062" />
      <pointLight position={[0, -1.8, 2.0]} intensity={0.12} color="#c6ad78" />

      <HeroBall isMobile={isMobile} />

      {/* restrained atmospheric particles */}
      <Sparkles count={isMobile ? 60 : 120} scale={[14, 10, 10]} size={isMobile ? 1.4 : 1.8} speed={0.18} opacity={0.22} color="#f2ebdd" />
      <Sparkles count={isMobile ? 24 : 50} scale={[10, 8, 8]} size={1.2} speed={0.12} opacity={0.18} color="#c6ad78" />

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.82} luminanceSmoothing={0.22} intensity={isMobile ? 0.22 : 0.32} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.9} />
        <Noise premultiply opacity={0.03} />
      </EffectComposer>
    </>
  )
}
