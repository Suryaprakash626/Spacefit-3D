import { describe, it, expect } from 'vitest'
import { layoutMetrics, pathLabel } from './metrics'

const room = { W: 350, L: 400, wall: 'bottom', off: 40 }
const item = (o = {}) => ({ id: 1, name: 't', w: 100, d: 50, clr: 0, ht: 80, h: 0, x: 175, y: 100, rot: 0, ...o })

describe('layoutMetrics', () => {
  it('handles an empty room', () => {
    const m = layoutMetrics(room, [])
    expect(m.count).toBe(0)
    expect(m.bad).toBe(0)
    expect(m.freePct).toBe(100)
    expect(m.narrowest).toBeNull()
  })
  it('counts both items in a collision', () => {
    const m = layoutMetrics(room, [item({ id: 1 }), item({ id: 2, x: 200 })])
    expect(m.bad).toBe(2)
  })
  it('ranks a clean layout better than a colliding one', () => {
    const clean = layoutMetrics(room, [item({ id: 1 }), item({ id: 2, x: 175, y: 300 })])
    const messy = layoutMetrics(room, [item({ id: 1 }), item({ id: 2, x: 200 })])
    expect(clean.rank).toBeLessThan(messy.rank)
  })
})

describe('pathLabel', () => {
  it('formats the three cases', () => {
    expect(pathLabel(null)).toBe('–')
    expect(pathLabel(60)).toBe('60+ cm')
    expect(pathLabel(0)).toBe('No route')
    expect(pathLabel(40)).toBe('40 cm')
  })
})