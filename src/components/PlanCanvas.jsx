import { useRef } from 'react'
import { useStore } from '../store'
import { DOOR, getBox, getDoor, getStatus } from '../geometry'

const M = 70
const COLOR = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' }

function DimLine({ x1, y1, x2, y2, v }) {
  if (v <= 0) return null
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeDasharray="3 3" />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} textAnchor="middle" fontSize="13" fontWeight="600"
            fill="var(--ink)" paintOrder="stroke" stroke="var(--floor)" strokeWidth="4">
        {Math.round(v)}
      </text>
    </g>
  )
}

export default function PlanCanvas() {
  const { room, items, selectedId, showClearance, select, moveItem } = useStore()
  const svgRef = useRef(null)
  const drag = useRef(null)
  const { W, L } = room
  const door = getDoor(room)
  const sel = items.find((i) => i.id === selectedId)

  const toSvg = (e) => {
    const svg = svgRef.current
    const p = svg.createSVGPoint()
    p.x = e.clientX
    p.y = e.clientY
    return p.matrixTransform(svg.getScreenCTM().inverse())
  }
  const onDown = (e, item) => {
    e.stopPropagation()
    select(item.id)
    const p = toSvg(e)
    drag.current = { id: item.id, dx: item.x - p.x, dy: item.y - p.y }
    svgRef.current.setPointerCapture(e.pointerId)
  }
  const onMove = (e) => {
    if (!drag.current) return
    const p = toSvg(e)
    moveItem(drag.current.id, p.x + drag.current.dx, p.y + drag.current.dy)
  }
  const stop = () => (drag.current = null)

  const sb = sel && getBox(sel)

  return (
    <div className="card plan">
      <svg ref={svgRef} viewBox={`${-M} ${-M} ${W + 2 * M} ${L + 2 * M}`}
           onPointerDown={() => select(null)} onPointerMove={onMove}
           onPointerUp={stop} onPointerCancel={stop}>
        <rect width={W} height={L} fill="var(--floor)" />
        {Array.from({ length: Math.floor((W - 1) / 50) }, (_, k) => (k + 1) * 50).map((x) =>
          <line key={'x' + x} x1={x} y1="0" x2={x} y2={L} stroke="var(--grid)" />)}
        {Array.from({ length: Math.floor((L - 1) / 50) }, (_, k) => (k + 1) * 50).map((y) =>
          <line key={'y' + y} x1="0" y1={y} x2={W} y2={y} stroke="var(--grid)" />)}
        <rect width={W} height={L} fill="none" stroke="var(--ink)" strokeWidth="6" />

        {/* door opening + swing */}
        <line x1={door.hinge[0]} y1={door.hinge[1]} x2={door.closed[0]} y2={door.closed[1]}
              stroke="var(--floor)" strokeWidth="8" />
        <path d={`M${door.hinge} L${door.closed} A${DOOR} ${DOOR} 0 0 ${door.sweep} ${door.open} Z`}
              fill="var(--acc)" fillOpacity=".1" stroke="var(--acc)" strokeDasharray="5 4" />

        <text x={W / 2} y="-24" textAnchor="middle" fontSize="16" fill="var(--mut)">{W} cm</text>
        <text transform={`translate(-24 ${L / 2}) rotate(-90)`} textAnchor="middle" fontSize="16"
              fill="var(--mut)">{L} cm</text>

        {items.map((i) => {
          const st = getStatus(i, items, room)
          const stroke = st === 'ok' ? `hsl(${i.h} 55% 40%)` : COLOR[st]
          return (
            <g key={i.id} className="item" onPointerDown={(e) => onDown(e, i)}>
              <g transform={`translate(${i.x} ${i.y}) rotate(${i.rot})`}>
                {showClearance && i.clr > 0 && (
                  <rect x={-i.w / 2} y={i.d / 2} width={i.w} height={i.clr}
                        fill={st === 'warn' ? 'var(--warn)' : 'var(--acc)'} fillOpacity=".14"
                        stroke={st === 'warn' ? 'var(--warn)' : 'var(--acc)'} strokeDasharray="4 4" />
                )}
                <rect x={-i.w / 2} y={-i.d / 2} width={i.w} height={i.d} rx="3"
                      fill={st === 'bad' ? 'var(--bad)' : `hsl(${i.h} 55% 55%)`} fillOpacity=".45"
                      stroke={stroke} strokeWidth={i.id === selectedId ? 4 : 2.5} />
                <line x1={-i.w / 2} y1={i.d / 2} x2={i.w / 2} y2={i.d / 2} stroke="var(--ink)" strokeWidth="5" />
              </g>
              <text x={i.x} y={i.y - 2} textAnchor="middle" fontSize="14" fontWeight="600"
                    fill="var(--ink)" pointerEvents="none">{i.name}</text>
              <text x={i.x} y={i.y + 14} textAnchor="middle" fontSize="12"
                    fill="var(--ink)" pointerEvents="none">{i.w}×{i.d}</text>
            </g>
          )
        })}

        {sb && (() => {
          const cx = (sb[0] + sb[2]) / 2, cy = (sb[1] + sb[3]) / 2
          return (
            <g pointerEvents="none">
              <DimLine x1={0} y1={cy} x2={sb[0]} y2={cy} v={sb[0]} />
              <DimLine x1={sb[2]} y1={cy} x2={W} y2={cy} v={W - sb[2]} />
              <DimLine x1={cx} y1={0} x2={cx} y2={sb[1]} v={sb[1]} />
              <DimLine x1={cx} y1={sb[3]} x2={cx} y2={L} v={L - sb[3]} />
            </g>
          )
        })()}
      </svg>
    </div>
  )
}