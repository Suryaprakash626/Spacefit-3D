import { getStatus } from './geometry'
import { analyzeWalkways, MIN_WIDTH } from './pathfinding'

export function layoutMetrics(room, items) {
  const sts = items.map((i) => getStatus(i, items, room))
  const bad = sts.filter((s) => s === 'bad').length
  const warn = sts.filter((s) => s === 'warn').length
  const { results } = analyzeWalkways(room, items)
  const hard = results.filter((r) => !r.ok).length
  const narrowest = results.length ? Math.min(...results.map((r) => r.width)) : null
  const used = items.reduce((a, i) => a + i.w * i.d, 0)
  const freePct = Math.max(0, Math.round(100 - (100 * used) / (room.W * room.L)))
  const rank = bad * 1000 + warn * 100 + hard * 10 - freePct / 100 // lower is better
  return { count: items.length, bad, warn, hard, narrowest, freePct, rank }
}

export function pathLabel(n) {
  if (n === null) return '–'
  if (n >= MIN_WIDTH) return `${MIN_WIDTH}+ cm`
  return n === 0 ? 'No route' : `${n} cm`
}