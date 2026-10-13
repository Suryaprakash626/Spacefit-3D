import { useEffect } from 'react'
import { useStore } from './store'
import { readShareFromHash } from './exporters'
import RoomControls from './components/RoomControls'
import ExportBar from './components/ExportBar'
import PlanCanvas from './components/PlanCanvas'
import Room3D from './components/Room3D'
import LayoutsPanel from './components/LayoutsPanel'
import ComparePanel from './components/ComparePanel'
import InfoPanel from './components/InfoPanel'
import './index.css'

const TABS = [['2d', '2D plan'], ['3d', '3D view'], ['layouts', 'Layouts'], ['compare', 'Compare']]

export default function App() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  // open a shared link: #layout=... in the address bar
  useEffect(() => {
    const shared = readShareFromHash()
    if (shared) {
      const s = useStore.getState()
      s.loadLayout(shared.room, shared.items)
      s.setView('2d')
    }
  }, [])

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
        <ExportBar />
        <div className="tabs">
          {TABS.map(([key, label]) => (
            <button key={key} className={view === key ? 'on' : ''} onClick={() => setView(key)}>{label}</button>
          ))}
        </div>
        {view === '2d' && <PlanCanvas />}
        {view === '3d' && <Room3D />}
        {view === 'layouts' && <LayoutsPanel />}
        {view === 'compare' && <ComparePanel />}
      </main>
      <InfoPanel />
    </div>
  )
}