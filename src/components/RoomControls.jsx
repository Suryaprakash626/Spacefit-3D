import { useState } from 'react'
import { useStore } from '../store'
import { CATALOG } from '../catalog'
import { DOOR } from '../geometry'

export default function RoomControls() {
  const { room, setRoom, showClearance, toggleClearance, addItem } = useStore()
  const [c, setC] = useState({ name: 'My item', w: 100, d: 60, clr: 60 })
  const max = (room.wall === 'top' || room.wall === 'bottom' ? room.W : room.L) - DOOR

  const size = (key) => (e) => {
    const v = +e.target.value
    if (v >= 150 && v <= 1500) setRoom({ [key]: v })
  }
  const field = (key) => (e) => setC({ ...c, [key]: e.target.value })

  return (
    <div className="card">
      <div className="row">
        <label>Width<input type="number" defaultValue={room.W} onChange={size('W')} /></label>
        <label>Length<input type="number" defaultValue={room.L} onChange={size('L')} /></label>
        <label>Door wall
          <select value={room.wall} onChange={(e) => setRoom({ wall: e.target.value })}>
            {['bottom', 'top', 'left', 'right'].map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label>Door position
          <input type="range" min="0" max={max} value={room.off}
                 onChange={(e) => setRoom({ off: +e.target.value })} />
        </label>
        <label className="inline">
          <input type="checkbox" checked={showClearance} onChange={toggleClearance} />
          Show clearance
        </label>
      </div>

      <div className="cat">
        {CATALOG.map((s) => (
          <button key={s.name} onClick={() => addItem(s)}>+ {s.name} {s.w}×{s.d}</button>
        ))}
      </div>

      <form className="row" onSubmit={(e) => {
        e.preventDefault()
        addItem({ name: c.name || 'Item', w: +c.w, d: +c.d, clr: +c.clr, ht: 80, h: Math.floor(Math.random() * 360) })
      }}>
        <label>Custom item<input type="text" value={c.name} onChange={field('name')} /></label>
        <label>Width<input type="number" min="10" value={c.w} onChange={field('w')} /></label>
        <label>Depth<input type="number" min="10" value={c.d} onChange={field('d')} /></label>
        <label>Front gap<input type="number" min="0" value={c.clr} onChange={field('clr')} /></label>
        <button type="submit">Add</button>
      </form>
    </div>
  )
}