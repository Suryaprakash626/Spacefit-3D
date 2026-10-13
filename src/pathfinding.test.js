import { describe, it, expect } from 'vitest'
import { analyzeWalkways, regionRects } from './pathfinding'

const room = { W: 350, L: 400, wall: 'bottom', off: 40 }
const item = (o = {}) => ({ id: 1, name: 't', w: 100, d: 50, clr: 60, ht: 80, h: 0, x: 175, y: 100, rot: 0, ...o })

describe('analyzeWalkways', () => {
  it('marks the middle of an empty room as walkable', () => {
    const a = analyzeWalkways(room, [])
    expect(a.region[40 * a.cols + 35]).toBe(1)
    expect(regionRects(a).length).toBeGreaterThan(0)
  })

  it('reaches an item with a free front', () => {
    const r = analyzeWalkways(room, [item({ x: 250 })]).results[0]
    expect(r.ok).toBe(true)
    expect(r.width).toBe(60)
  })

  it('finds no route when furniture cuts the room in two', () => {
    const divider = item({ id: 2, w: 350, d: 60, clr: 0, x: 175, y: 200 })
    const r = analyzeWalkways(room, [item(), divider]).results[0]
    expect(r.ok).toBe(false)
    expect(r.width).toBe(0)
  })

  it('reports the width of a narrow gap', () => {
    // two blockers leave a 40 cm gap between x=140 and x=180
    const a = item({ id: 2, w: 140, d: 40, clr: 0, x: 70, y: 200 })
    const b = item({ id: 3, w: 170, d: 40, clr: 0, x: 265, y: 200 })
    const r = analyzeWalkways(room, [item(), a, b]).results[0]
    expect(r.ok).toBe(false)
    expect(r.width).toBe(40)
  })
})