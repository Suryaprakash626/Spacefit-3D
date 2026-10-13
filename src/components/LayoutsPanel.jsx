import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { listLayouts, createLayout, updateLayout, deleteLayout } from '../api'
import MiniPlan from './MiniPlan'

export default function LayoutsPanel() {
  const { saved, compare, setSaved, toggleCompare, loadLayout, setView } = useStore()
  const [name, setName] = useState('Layout A')
  const [msg, setMsg] = useState({ text: '', bad: false })
  const [busy, setBusy] = useState(false)

  const refresh = async () => setSaved(await listLayouts())
  const snapshot = () => {
    const { room, items } = useStore.getState()
    return { room, items }
  }
  const run = async (fn, okText) => {
    setBusy(true)
    try {
      await fn()
      await refresh()
      setMsg({ text: okText, bad: false })
    } catch (e) {
      setMsg({ text: e.message, bad: true })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    run(async () => {}, '')
  }, [])

  return (
    <div className="card">
      <form className="row" onSubmit={(e) => {
        e.preventDefault()
        run(() => createLayout({ name, ...snapshot() }), `Saved "${name}"`)
      }}>
        <label>Layout name<input type="text" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <button type="submit" disabled={busy || !name.trim()}>Save current layout</button>
        {msg.text && <span className={msg.bad ? 'err' : 'note'}>{msg.text}</span>}
      </form>

      {saved.length === 0 && !msg.bad && (
        <p className="note">No saved layouts yet. Arrange your room, then save it here.</p>
      )}

      <div className="saved">
        {saved.map((l) => (
          <div className="card" key={l.id}>
            <MiniPlan room={l.room} items={l.items} />
            <h3>{l.name}</h3>
            <span className="note">
              {l.items.length} items · {l.room.W}×{l.room.L} cm · {new Date(l.updatedAt).toLocaleDateString()}
            </span>
            <label className="inline">
              <input type="checkbox" checked={compare.includes(l.id)} onChange={() => toggleCompare(l.id)} />
              Compare
            </label>
            <div className="btns">
              <button onClick={() => { loadLayout(l.room, l.items); setView('2d') }}>Load</button>
              <button disabled={busy} onClick={() =>
                run(() => updateLayout(l.id, { name: l.name, ...snapshot() }), `Updated "${l.name}"`)}>
                Overwrite
              </button>
              <button disabled={busy} onClick={() => {
                if (window.confirm(`Delete "${l.name}"?`)) run(() => deleteLayout(l.id), `Deleted "${l.name}"`)
              }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}