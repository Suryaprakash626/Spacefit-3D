import { getBox, getStatus } from '../geometry'

const COLOR = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' }

export default function MiniPlan({ room, items }) {
  const m = 6
  return (
    <svg className="mini" viewBox={`${-m} ${-m} ${room.W + 2 * m} ${room.L + 2 * m}`}>
      <rect width={room.W} height={room.L} fill="var(--floor)" stroke="var(--ink)" strokeWidth="6" />
      {items.map((i) => {
        const [x0, y0, x1, y1] = getBox(i)
        const c = COLOR[getStatus(i, items, room)]
        return <rect key={i.id} x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="3"
                     fill={c} fillOpacity=".45" stroke={c} strokeWidth="3" />
      })}
    </svg>
  )
}