import Scene from './components/Scene'
import UIOverlay from './components/UIOverlay'

export default function App() {
  return (
    <div className="relative h-full w-full bg-[#120405]">
      <Scene />
      <UIOverlay />
    </div>
  )
}
