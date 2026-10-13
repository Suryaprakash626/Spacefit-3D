import { useEffect } from 'react'
import { useStore } from './store'
import RoomControls from './components/RoomControls'
import PlanCanvas from './components/PlanCanvas'
import InfoPanel from './components/InfoPanel'
import './index.css'

export default function App() {
  useEffect(() => {
    const onKey = (e) => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return
      const s = useStore.getState()
      if (s.selectedId == null) return
      const nudge = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key]
      if (e.key.toLowerCase() === 'r') s.rotateSelected()
      else if (e.key === 'Delete' || e.key === 'Backspace') s.deleteSelected()
      else if (nudge) { e.preventDefault(); s.nudgeSelected(...nudge) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <header>
        <h1>SpaceFit 3D</h1>
        <p className="sub">Set your room, drag furniture in, and see what fits. All sizes in cm.</p>
      </header>
      <main>
        <RoomControls />
        <PlanCanvas />
      </main>
      <InfoPanel />
    </div>
  )
}