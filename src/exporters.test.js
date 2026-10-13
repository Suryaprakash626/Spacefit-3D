import { describe, it, expect } from 'vitest'
import { toCsv, encodeLayout, decodeLayout, readShareFromHash } from './exporters'

const room = { W: 350, L: 400, wall: 'bottom', off: 40 }
const item = (o = {}) => ({ id: 1, name: 'Desk', w: 120, d: 60, clr: 80, ht: 75, h: 200, x: 100, y: 100, rot: 0, ...o })

describe('share link', () => {
  it('round-trips a layout', () => {
    const items = [item({ id: 1 }), item({ id: 2, name: 'Sofa', x: 250, y: 300, rot: 90 })]
    const out = decodeLayout(encodeLayout(room, items))
    expect(out.room).toEqual(room)
    expect(out.items).toEqual(items)
  })
  it('rejects garbage', () => {
    expect(decodeLayout('%%%')).toBeNull()
    expect(decodeLayout('abc123')).toBeNull()
  })
  it('clamps absurd room sizes', () => {
    expect(decodeLayout(encodeLayout({ ...room, W: 99999 }, [])).room.W).toBe(1500)
  })
  it('rejects a rotation that is not a multiple of 90', () => {
    expect(decodeLayout(encodeLayout(room, [item({ rot: 45 })]))).toBeNull()
  })
  it('reads the layout from a URL hash', () => {
    const hash = '#layout=' + encodeLayout(room, [item()])
    expect(readShareFromHash(hash).items).toHaveLength(1)
    expect(readShareFromHash('#other')).toBeNull()
  })
})

describe('toCsv', () => {
  it('writes a header and one measured row per item', () => {
    const lines = toCsv(room, [item()]).split('\n')
    expect(lines[0].startsWith('Item,Width (cm)')).toBe(true)
    expect(lines[1]).toBe('Desk,120,60,75,80,100,100,0,40,190,70,270,OK')
  })
  it('keeps spreadsheet apps from running a name as a formula', () => {
    expect(toCsv(room, [item({ name: '=SUM(1)' })]).split('\n')[1].startsWith("'=SUM(1)")).toBe(true)
  })
  it('quotes names that contain commas', () => {
    expect(toCsv(room, [item({ name: 'Desk, big' })]).split('\n')[1].startsWith('"Desk, big"')).toBe(true)
  })
})