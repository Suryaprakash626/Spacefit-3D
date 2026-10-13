import { useMemo } from 'react'
import { useStore } from '../store'
import { layoutMetrics, pathLabel } from '../metrics'
import MiniPlan from './MiniPlan'

export default function ComparePanel() {
  const { room, items, saved, compare } = useStore()

  const cols = useMemo(() => {
    const list = [
      { key: 'current', name: 'Current (unsaved)', room, items },
      ...saved.filter((l) => compare.includes(l.id)).map((l) => ({ key: l.id, name: l.name, room: l.room, items: l.items })),
    ]
    const withMetrics = list.map((c) => ({ ...c, m: layoutMetrics(c.room, c.items) }))
    const ranks = withMetrics.map((c) => c.m.rank)
    const best = Math.min(...ranks)
    const allSame = ranks.every((r) => r === best)
    return withMetrics.map((c) => ({ ...c, best: !allSame && c.m.rank === best }))
  }, [room, items, saved, compare])

  const rows = [
    ['Plan', (c) => <MiniPlan room={c.room} items={c.items} />],
    ['Room', (c) => `${c.room.W}×${c.room.L} cm`],
    ['Items', (c) => c.m.count],
    ['Collisions', (c) => <span className={c.m.bad ? 'v-bad' : 'v-ok'}>{c.m.bad}</span>],
    ['Blocked access', (c) => <span className={c.m.warn ? 'v-warn' : 'v-ok'}>{c.m.warn}</span>],
    ['Hard to reach', (c) => <span className={c.m.hard ? 'v-warn' : 'v-ok'}>{c.m.hard}</span>],
    ['Narrowest walkway', (c) => pathLabel(c.m.narrowest)],
    ['Free floor', (c) => `${c.m.freePct}%`],
  ]

  return (
    <div className="card">
      {compare.length === 0 && (
        <p className="note">Your current layout is shown below. Tick Compare on saved layouts (up to 3) to add them.</p>
      )}
      <div className="scroll">
        <table className="cmp">
          <thead>
            <tr>
              <th></th>
              {cols.map((c) => (
                <th key={c.key}>{c.name}{c.best && <span className="badge">Best fit</span>}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label}>
                <td>{label}</td>
                {cols.map((c) => <td key={c.key}>{fn(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}