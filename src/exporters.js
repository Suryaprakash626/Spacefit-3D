import { getBox, getFront, getDoor, getStatus } from './geometry'
import { layoutMetrics, pathLabel } from './metrics'

const WALLS = ['top', 'bottom', 'left', 'right']
const ROTS = [0, 90, 180, 270]
const STATUS_TEXT = { ok: 'OK', warn: 'Front access blocked', bad: 'Collision / outside / blocks door' }

// ---------- CSV ----------
const cell = (v) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
// stop spreadsheet apps from running a name like =SUM(...) as a formula
const txt = (s) => (/^[=+\-@\t\r]/.test(s) ? "'" + s : s)

export function toCsv(room, items) {
  const head = [
    'Item', 'Width (cm)', 'Depth (cm)', 'Height (cm)', 'Front gap (cm)', 'Centre X (cm)',
    'Centre Y (cm)', 'Rotation (deg)', 'Left wall (cm)', 'Right wall (cm)', 'Top wall (cm)',
    'Bottom wall (cm)', 'Status',
  ]
  const rows = items.map((i) => {
    const b = getBox(i)
    return [
      txt(String(i.name)), i.w, i.d, i.ht ?? 80, i.clr, i.x, i.y, i.rot,
      Math.round(b[0]), Math.round(room.W - b[2]), Math.round(b[1]), Math.round(room.L - b[3]),
      STATUS_TEXT[getStatus(i, items, room)],
    ].map(cell).join(',')
  })
  return [head.join(','), ...rows].join('\n')
}

function downloadFile(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const downloadCsv = (room, items) =>
  downloadFile('spacefit-layout.csv', '\uFEFF' + toCsv(room, items), 'text/csv;charset=utf-8')

// ---------- share link (the layout lives in the URL hash) ----------
const toB64 = (s) => {
  let bin = ''
  new TextEncoder().encode(s).forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const fromB64 = (b) => {
  const bin = atob(b.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}
const clamp = (v, min, max) => {
  const n = Number(v)
  if (!Number.isFinite(n)) throw new Error('bad number')
  return Math.min(max, Math.max(min, n))
}

export const encodeLayout = (room, items) =>
  toB64(JSON.stringify({
    v: 1,
    r: [room.W, room.L, room.wall, room.off],
    i: items.map((i) => [i.name, i.w, i.d, i.clr, i.ht ?? 80, i.h, i.x, i.y, i.rot]),
  }))

// links come from outside, so every value is checked and clamped
export function decodeLayout(b64) {
  try {
    const d = JSON.parse(fromB64(b64))
    if (d.v !== 1 || !Array.isArray(d.r) || !Array.isArray(d.i) || d.i.length > 100) return null
    const wall = WALLS.includes(d.r[2]) ? d.r[2] : 'bottom'
    const W = clamp(d.r[0], 150, 1500)
    const L = clamp(d.r[1], 150, 1500)
    const max = (wall === 'top' || wall === 'bottom' ? W : L) - 90
    const room = { W, L, wall, off: clamp(d.r[3], 0, max) }
    const items = d.i.map((a, n) => {
      if (!Array.isArray(a)) throw new Error('bad item')
      const rot = Number(a[8])
      if (!ROTS.includes(rot)) throw new Error('bad rotation')
      return {
        id: n + 1, name: String(a[0]).slice(0, 40),
        w: clamp(a[1], 10, 1500), d: clamp(a[2], 10, 1500), clr: clamp(a[3], 0, 500),
        ht: clamp(a[4], 1, 400), h: clamp(a[5], 0, 360),
        x: clamp(a[6], -2000, 3000), y: clamp(a[7], -2000, 3000), rot,
      }
    })
    return { room, items }
  } catch {
    return null
  }
}

export const buildShareUrl = (room, items) =>
  `${location.origin}${location.pathname}#layout=${encodeLayout(room, items)}`

export function readShareFromHash(hash = location.hash) {
  const m = /^#layout=([A-Za-z0-9_-]+)$/.exec(hash)
  return m ? decodeLayout(m[1]) : null
}

// ---------- PDF ----------
const hsl2rgb = (h, s, l) => {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255))
}
const lighten = (c, t = 0.45) => c.map((v) => Math.round(v + (255 - v) * t))
const COL = { warn: [230, 119, 0], bad: [214, 51, 108] }
const INK = [20, 33, 61]
const ACC = [15, 126, 168]

export async function exportPdf(room, items) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const m = layoutMetrics(room, items)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('SpaceFit 3D layout', 12, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Room ${room.W} x ${room.L} cm (${((room.W * room.L) / 1e4).toFixed(1)} m2)   |   ${new Date().toLocaleDateString()}`, 12, 23)
  const verdict = !items.length ? 'No furniture yet'
    : m.bad ? `${m.bad} item(s) do not fit`
    : m.warn ? `Fits, but ${m.warn} with blocked access`
    : m.hard ? `Fits, but ${m.hard} hard to reach`
    : 'Everything fits'
  doc.text(`Result: ${verdict}   |   Narrowest walkway: ${pathLabel(m.narrowest)}   |   Free floor: ${m.freePct}%`, 12, 29)

  // floor plan, drawn to scale
  const px = 12, py = 36, pw = 140, ph = 158
  const s = Math.min(pw / room.W, ph / room.L) // mm on paper per cm in the room
  const X = (v) => px + v * s
  const Y = (v) => py + v * s

  doc.setDrawColor(225, 232, 240)
  doc.setLineWidth(0.15)
  for (let x = 50; x < room.W; x += 50) doc.line(X(x), Y(0), X(x), Y(room.L))
  for (let y = 50; y < room.L; y += 50) doc.line(X(0), Y(y), X(room.W), Y(y))

  const door = getDoor(room)
  doc.setDrawColor(...ACC)
  doc.setLineWidth(0.2)
  doc.setLineDashPattern([1, 1], 0)
  doc.rect(X(door.box[0]), Y(door.box[1]), (door.box[2] - door.box[0]) * s, (door.box[3] - door.box[1]) * s)
  doc.setLineDashPattern([], 0)

  const status = items.map((i) => getStatus(i, items, room))
  items.forEach((i, n) => {
    if (i.clr <= 0) return
    const f = getFront(i)
    doc.setDrawColor(...(status[n] === 'warn' ? COL.warn : ACC))
    doc.setLineWidth(0.2)
    doc.setLineDashPattern([1, 1], 0)
    doc.rect(X(f[0]), Y(f[1]), (f[2] - f[0]) * s, (f[3] - f[1]) * s)
    doc.setLineDashPattern([], 0)
  })
  items.forEach((i, n) => {
    const [x0, y0, x1, y1] = getBox(i)
    const base = status[n] === 'ok' ? hsl2rgb(i.h, 55, 55) : COL[status[n]]
    doc.setFillColor(...lighten(base))
    doc.setDrawColor(...base)
    doc.setLineWidth(0.4)
    doc.rect(X(x0), Y(y0), (x1 - x0) * s, (y1 - y0) * s, 'FD')
    doc.setTextColor(...INK)
    doc.setFontSize(7)
    doc.text(String(i.name).slice(0, 20), X((x0 + x1) / 2), Y((y0 + y1) / 2), { align: 'center' })
    doc.setFontSize(6)
    doc.text(`${i.w} x ${i.d}`, X((x0 + x1) / 2), Y((y0 + y1) / 2) + 3, { align: 'center' })
  })

  doc.setDrawColor(...INK)
  doc.setLineWidth(0.8)
  doc.rect(X(0), Y(0), room.W * s, room.L * s)
  doc.setFontSize(8)
  doc.setTextColor(90, 100, 120)
  doc.text(`Scale about 1:${Math.round(10 / s)}  (grid = 50 cm)`, px, py + ph + 6)

  // furniture table
  let tx = 160
  let y = 38
  const head = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text('Item', tx, y)
    doc.text('W x D x H (cm)', tx + 38, y)
    doc.text('Status', tx + 82, y)
    doc.setDrawColor(150)
    doc.setLineWidth(0.2)
    doc.line(tx, y + 1.5, tx + 125, y + 1.5)
    doc.setFont('helvetica', 'normal')
    y += 6
  }
  head()
  const label = { ok: 'OK', warn: 'Access blocked', bad: 'Collision' }
  items.forEach((i, n) => {
    if (y > 200) { doc.addPage(); tx = 12; y = 16; head() }
    doc.setFontSize(8.5)
    doc.setTextColor(...INK)
    doc.text(String(i.name).slice(0, 22), tx, y)
    doc.text(`${i.w} x ${i.d} x ${i.ht ?? 80}`, tx + 38, y)
    doc.setTextColor(...(status[n] === 'ok' ? [18, 128, 92] : COL[status[n]]))
    doc.text(label[status[n]], tx + 82, y)
    y += 6
  })

  doc.save('spacefit-layout.pdf')
}