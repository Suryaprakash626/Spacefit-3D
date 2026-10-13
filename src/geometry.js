export const DOOR = 90

export const effSize = (i) => (i.rot % 180 ? [i.d, i.w] : [i.w, i.d])

export const getBox = (i) => {
  const [w, h] = effSize(i)
  return [i.x - w / 2, i.y - h / 2, i.x + w / 2, i.y + h / 2]
}

// Zone in front of the item that must stay free (front = bottom edge at rot 0)
export const getFront = (i) => {
  const b = getBox(i)
  const c = i.clr
  return [
    [b[0], b[3], b[2], b[3] + c],
    [b[0] - c, b[1], b[0], b[3]],
    [b[0], b[1] - c, b[2], b[1]],
    [b[2], b[1], b[2] + c, b[3]],
  ][i.rot / 90]
}

export const overlaps = (a, b) =>
  a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]

export const isInside = (b, { W, L }) =>
  b[0] >= 0 && b[1] >= 0 && b[2] <= W && b[3] <= L

export function getDoor({ W, L, wall, off }) {
  const [H, a, b] = {
    top: [[off, 0], [1, 0], [0, 1]],
    bottom: [[off, L], [1, 0], [0, -1]],
    left: [[0, off], [0, 1], [1, 0]],
    right: [[W, off], [0, 1], [-1, 0]],
  }[wall]
  const closed = [H[0] + a[0] * DOOR, H[1] + a[1] * DOOR]
  const open = [H[0] + b[0] * DOOR, H[1] + b[1] * DOOR]
  return {
    hinge: H,
    closed,
    open,
    sweep: a[0] * b[1] - a[1] * b[0] > 0 ? 1 : 0,
    box: [
      Math.min(H[0], closed[0], open[0]),
      Math.min(H[1], closed[1], open[1]),
      Math.max(H[0], closed[0], open[0]),
      Math.max(H[1], closed[1], open[1]),
    ],
  }
}

// 'ok' | 'warn' (front access blocked) | 'bad' (collision / outside / blocks door)
export function getStatus(item, items, room) {
  const b = getBox(item)
  const others = items.filter((o) => o.id !== item.id)
  const door = getDoor(room)
  if (!isInside(b, room) || others.some((o) => overlaps(b, getBox(o))) || overlaps(b, door.box))
    return 'bad'
  if (item.clr > 0) {
    const f = getFront(item)
    if (!isInside(f, room) || others.some((o) => overlaps(f, getBox(o)))) return 'warn'
  }
  return 'ok'
}

export function gapBetween(a, b) {
  const dx = Math.max(a[0] - b[2], b[0] - a[2], 0)
  const dy = Math.max(a[1] - b[3], b[1] - a[3], 0)
  return Math.round(Math.hypot(dx, dy))
}

export function snapToWalls(item, { W, L }, tol = 10) {
  const [w, h] = effSize(item)
  let { x, y } = item
  if (Math.abs(x - w / 2) < tol) x = w / 2
  if (Math.abs(W - (x + w / 2)) < tol) x = W - w / 2
  if (Math.abs(y - h / 2) < tol) y = h / 2
  if (Math.abs(L - (y + h / 2)) < tol) y = L - h / 2
  return { x, y }
}