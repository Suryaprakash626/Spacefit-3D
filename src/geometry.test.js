import { describe, it, expect } from 'vitest'
import {
  effSize, getBox, getFront, overlaps, isInside,
  getDoor, getStatus, gapBetween, snapToWalls,
} from './geometry'

const room = { W: 350, L: 400, wall: 'bottom', off: 40 }
// default item: 100 x 50, centred at (175, 100), no front gap
const item = (o = {}) => ({ id: 1, name: 't', w: 100, d: 50, clr: 0, h: 0, x: 175, y: 100, rot: 0, ...o })

describe('effSize / getBox', () => {
  it('keeps width and depth at 0 degrees', () => {
    expect(effSize(item())).toEqual([100, 50])
  })
  it('swaps width and depth at 90 degrees', () => {
    expect(effSize(item({ rot: 90 }))).toEqual([50, 100])
  })
  it('builds the bounding box around the centre', () => {
    expect(getBox(item({ x: 100, y: 100 }))).toEqual([50, 75, 150, 125])
  })
  it('builds a rotated bounding box', () => {
    expect(getBox(item({ x: 100, y: 100, rot: 90 }))).toEqual([75, 50, 125, 150])
  })
})

describe('overlaps / isInside', () => {
  it('detects overlapping boxes', () => {
    expect(overlaps([0, 0, 10, 10], [5, 5, 15, 15])).toBe(true)
  })
  it('treats touching edges as not overlapping', () => {
    expect(overlaps([0, 0, 10, 10], [10, 0, 20, 10])).toBe(false)
  })
  it('returns false for separate boxes', () => {
    expect(overlaps([0, 0, 10, 10], [50, 50, 60, 60])).toBe(false)
  })
  it('accepts a box that fills the room exactly', () => {
    expect(isInside([0, 0, 350, 400], room)).toBe(true)
  })
  it('rejects a box that sticks out of the room', () => {
    expect(isInside([-1, 0, 100, 100], room)).toBe(false)
  })
})

describe('getFront (clearance zone)', () => {
  const base = { x: 100, y: 100, clr: 60 }
  it('is below the item at 0 degrees', () => {
    expect(getFront(item({ ...base, rot: 0 }))).toEqual([50, 125, 150, 185])
  })
  it('is left of the item at 90 degrees', () => {
    expect(getFront(item({ ...base, rot: 90 }))).toEqual([15, 50, 75, 150])
  })
  it('is above the item at 180 degrees', () => {
    expect(getFront(item({ ...base, rot: 180 }))).toEqual([50, 15, 150, 75])
  })
  it('is right of the item at 270 degrees', () => {
    expect(getFront(item({ ...base, rot: 270 }))).toEqual([125, 50, 185, 150])
  })
})

describe('getDoor', () => {
  it('puts the swing area inside the room for a bottom door', () => {
    expect(getDoor(room).box).toEqual([40, 310, 130, 400])
  })
  it('puts the swing area inside the room for a top door', () => {
    expect(getDoor({ ...room, wall: 'top' }).box).toEqual([40, 0, 130, 90])
  })
  it('puts the swing area inside the room for a right door', () => {
    expect(getDoor({ ...room, wall: 'right', off: 100 }).box).toEqual([260, 100, 350, 190])
  })
})

describe('getStatus', () => {
  it('is ok for an item in a free spot', () => {
    const a = item()
    expect(getStatus(a, [a], room)).toBe('ok')
  })
  it('is bad when the item sticks out of the room', () => {
    const a = item({ x: 20 })
    expect(getStatus(a, [a], room)).toBe('bad')
  })
  it('is bad when two items collide', () => {
    const a = item({ id: 1 })
    const b = item({ id: 2, x: 200, y: 110 })
    expect(getStatus(a, [a, b], room)).toBe('bad')
  })
  it('is bad when the item blocks the door swing', () => {
    const a = item({ x: 80, y: 360 })
    expect(getStatus(a, [a], room)).toBe('bad')
  })
  it('warns when the front clearance runs into a wall', () => {
    const a = item({ x: 250, y: 370, clr: 80 })
    expect(getStatus(a, [a], room)).toBe('warn')
  })
  it('warns when another item blocks the front, and the blocker stays ok', () => {
    const a = item({ id: 1, x: 200, y: 100, clr: 60 })
    const b = item({ id: 2, x: 200, y: 150 })
    expect(getStatus(a, [a, b], room)).toBe('warn')
    expect(getStatus(b, [a, b], room)).toBe('ok')
  })
  it('is ok when the front is clear', () => {
    const a = item({ x: 200, y: 100, clr: 60 })
    expect(getStatus(a, [a], room)).toBe('ok')
  })
})

describe('gapBetween', () => {
  it('measures a straight gap', () => {
    expect(gapBetween([0, 0, 10, 10], [20, 0, 30, 10])).toBe(10)
  })
  it('measures a diagonal gap', () => {
    expect(gapBetween([0, 0, 10, 10], [13, 14, 20, 20])).toBe(5)
  })
  it('is 0 for overlapping boxes', () => {
    expect(gapBetween([0, 0, 10, 10], [5, 5, 15, 15])).toBe(0)
  })
})

describe('snapToWalls', () => {
  it('snaps to the left wall when within 10 cm', () => {
    expect(snapToWalls(item({ x: 55, y: 100 }), room)).toEqual({ x: 50, y: 100 })
  })
  it('snaps to the right wall when within 10 cm', () => {
    expect(snapToWalls(item({ x: 297, y: 100 }), room)).toEqual({ x: 300, y: 100 })
  })
  it('leaves items alone when far from walls', () => {
    expect(snapToWalls(item({ x: 175, y: 200 }), room)).toEqual({ x: 175, y: 200 })
  })
  it('does not snap at 15 cm', () => {
    expect(snapToWalls(item({ x: 65, y: 200 }), room)).toEqual({ x: 65, y: 200 })
  })
})