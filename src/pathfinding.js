import { getBox, getFront, getDoor } from './geometry'

export const MIN_WIDTH = 60 // cm a person needs to walk through
const CELL = 5 // grid resolution in cm, so widths are accurate to about 5 cm

function buildGrid(room, items) {
  const cols = Math.ceil(room.W / CELL)
  const rows = Math.ceil(room.L / CELL)
  const blocked = new Uint8Array(cols * rows)
  const boxes = items.map(getBox)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * CELL
      const y = (r + 0.5) * CELL
      const hit = boxes.some((b) => x > b[0] && x < b[2] && y > b[1] && y < b[3])
      if (x > room.W || y > room.L || hit) blocked[r * cols + c] = 1
    }
  }
  return { cols, rows, blocked }
}

// free space (cm) around every cell: distance to the nearest wall or furniture
function clearanceMap({ cols, rows, blocked }, room) {
  const d = new Float32Array(cols * rows)
  const A = CELL
  const B = CELL * Math.SQRT2
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const x = (c + 0.5) * CELL
      const y = (r + 0.5) * CELL
      d[i] = blocked[i] ? 0 : Math.min(x, room.W - x, y, room.L - y) + CELL / 2
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      let v = d[i]
      if (c > 0) v = Math.min(v, d[i - 1] + A)
      if (r > 0) {
        v = Math.min(v, d[i - cols] + A)
        if (c > 0) v = Math.min(v, d[i - cols - 1] + B)
        if (c < cols - 1) v = Math.min(v, d[i - cols + 1] + B)
      }
      d[i] = v
    }
  }
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 0; c--) {
      const i = r * cols + c
      let v = d[i]
      if (c < cols - 1) v = Math.min(v, d[i + 1] + A)
      if (r < rows - 1) {
        v = Math.min(v, d[i + cols] + A)
        if (c < cols - 1) v = Math.min(v, d[i + cols + 1] + B)
        if (c > 0) v = Math.min(v, d[i + cols - 1] + B)
      }
      d[i] = v
    }
  }
  for (let i = 0; i < d.length; i++) if (!blocked[i]) d[i] -= CELL / 2
  return d
}

// every cell reachable from the door area where a person w cm wide fits
function flood(g, clr, doorBox, w) {
  const { cols, rows } = g
  const need = w / 2 - CELL / 2
  const seen = new Uint8Array(cols * rows)
  const stack = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * CELL
      const y = (r + 0.5) * CELL
      const i = r * cols + c
      if (x > doorBox[0] && x < doorBox[2] && y > doorBox[1] && y < doorBox[3] && clr[i] >= need) {
        seen[i] = 1
        stack.push(i)
      }
    }
  }
  while (stack.length) {
    const i = stack.pop()
    const c = i % cols
    for (const j of [c > 0 ? i - 1 : -1, c < cols - 1 ? i + 1 : -1, i - cols, i + cols]) {
      if (j >= 0 && j < cols * rows && !seen[j] && clr[j] >= need) {
        seen[j] = 1
        stack.push(j)
      }
    }
  }
  return seen
}

// where a person stands to use the item: its front zone, widened a bit sideways
function accessZone(item) {
  const f = getFront(item)
  return item.rot % 180 === 0 ? [f[0] - 30, f[1], f[2] + 30, f[3]] : [f[0], f[1] - 30, f[2], f[3] + 30]
}

function touches(g, seen, z) {
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const x = (c + 0.5) * CELL
      const y = (r + 0.5) * CELL
      if (seen[r * g.cols + c] && x > z[0] && x < z[2] && y > z[1] && y < z[3]) return true
    }
  }
  return false
}

// result width: MIN_WIDTH or more = fine, 20-55 = narrowest point on the best route, 0 = no route
export function analyzeWalkways(room, items, minWidth = MIN_WIDTH) {
  const g = buildGrid(room, items)
  const clr = clearanceMap(g, room)
  const doorBox = getDoor(room).box
  const floods = {}
  const at = (w) => (floods[w] ??= flood(g, clr, doorBox, w))

  const results = items
    .filter((i) => i.clr > 0)
    .map((item) => {
      const zone = accessZone(item)
      let width = 0
      for (let w = minWidth; w >= 20; w -= 5) {
        if (touches(g, at(w), zone)) { width = w; break }
      }
      return { id: item.id, name: item.name, width, ok: width >= minWidth }
    })

  return { cols: g.cols, rows: g.rows, region: at(minWidth), results }
}

// merge walkable cells into horizontal strips (cm) so the SVG stays light
export function regionRects({ cols, rows, region }) {
  const out = []
  for (let r = 0; r < rows; r++) {
    let start = -1
    for (let c = 0; c <= cols; c++) {
      const on = c < cols && region[r * cols + c]
      if (on && start < 0) start = c
      if (!on && start >= 0) {
        out.push([start * CELL, r * CELL, (c - start) * CELL, CELL])
        start = -1
      }
    }
  }
  return out
}