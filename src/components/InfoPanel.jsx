import { useStore } from '../store'
import { gapBetween, getBox, getStatus } from '../geometry'

const LABEL = { ok: 'OK', warn: 'Front access blocked', bad: 'Collision / outside' }

export default function InfoPanel() {
  const { room, items, selectedId, rotateSelected, deleteSelected } = useStore()
  const sts = items.map((i) => getStatus(i, items, room))
  const bad = sts.filter((s) => s === 'bad').length
  const warn = sts.filter((s) => s === 'warn').length
  const used = items.reduce((a, i) => a + i.w * i.d, 0)
  const pct = Math.round((100 * used) / (room.W * room.L))

  const [cls, msg] = !items.length ? ['v-warn', 'Add furniture to start']
    : bad ? ['v-bad', `${bad} item${bad > 1 ? 's' : ''} don't fit`]
    : warn ? ['v-warn', `Fits, but ${warn} blocked access`]
    : ['v-ok', 'Everything fits']

  const it = items.find((i) => i.id === selectedId)
  const b = it && getBox(it)
  const nearest = it && items.filter((o) => o.id !== it.id)
    .map((o) => ({ n: o.name, g: gapBetween(b, getBox(o)) }))
    .sort((x, y) => x.g - y.g)[0]

  return (
    <aside className="card panel">
      <h2>Layout check</h2>
      <div className={`verdict ${cls}`}>{msg}</div>
      <div className="kv">
        <span>Room area</span><span>{((room.W * room.L) / 1e4).toFixed(1)} m²</span>
        <span>Furniture footprint</span><span>{pct}%</span>
        <span>Items</span><span>{items.length}</span>
      </div>

      {it ? (
        <>
          <h2>{it.name} ({it.w}×{it.d} cm)</h2>
          <div className="kv">
            <span>Left wall</span><span>{Math.round(b[0])} cm</span>
            <span>Right wall</span><span>{Math.round(room.W - b[2])} cm</span>
            <span>Top wall</span><span>{Math.round(b[1])} cm</span>
            <span>Bottom wall</span><span>{Math.round(room.L - b[3])} cm</span>
            <span>Nearest item</span><span>{nearest ? `${nearest.g} cm (${nearest.n})` : '–'}</span>
            <span>Status</span><span>{LABEL[getStatus(it, items, room)]}</span>
          </div>
          <div className="btns">
            <button onClick={rotateSelected}>Rotate 90°</button>
            <button onClick={deleteSelected}>Delete</button>
          </div>
          <p className="note">The thick line marks the front. Keys: R rotates, Delete removes, arrows nudge 5 cm.</p>
        </>
      ) : (
        <p className="note">Click a piece to see its distances to walls and neighbours.</p>
      )}
    </aside>
  )
}