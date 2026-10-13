import { create } from 'zustand'
import { DOOR, snapToWalls } from './geometry'

export const useStore = create((set) => ({
  room: { W: 350, L: 400, wall: 'bottom', off: 40 },
    items: [
    { id: 1, name: 'Single bed', w: 100, d: 200, clr: 60, ht: 50, h: 210, x: 255, y: 110, rot: 0 },
    { id: 2, name: 'Desk', w: 120, d: 60, clr: 80, ht: 75, h: 200, x: 30, y: 150, rot: 270 },
    { id: 3, name: 'Wardrobe', w: 120, d: 55, clr: 80, ht: 200, h: 0, x: 250, y: 372.5, rot: 180 },
  ],
  nextId: 4,
  selectedId: null,
  showClearance: true,
    view: '2d',
      showWalkway: true,

  setRoom: (patch) =>
    set((s) => {
      const room = { ...s.room, ...patch }
      const max = (room.wall === 'top' || room.wall === 'bottom' ? room.W : room.L) - DOOR
      room.off = Math.max(0, Math.min(room.off, max))
      return { room }
    }),

  addItem: (spec) =>
    set((s) => {
      const item = { ...spec, id: s.nextId, x: s.room.W / 2, y: s.room.L / 2, rot: 0 }
      return { items: [...s.items, item], nextId: s.nextId + 1, selectedId: item.id }
    }),

  moveItem: (id, x, y) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== id) return i
        const moved = { ...i, x: Math.round(x / 5) * 5, y: Math.round(y / 5) * 5 }
        return { ...moved, ...snapToWalls(moved, s.room) }
      }),
    })),

  nudgeSelected: (dx, dy) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === s.selectedId ? { ...i, x: i.x + dx, y: i.y + dy } : i)),
    })),

  rotateSelected: () =>
    set((s) => ({
      items: s.items.map((i) => (i.id === s.selectedId ? { ...i, rot: (i.rot + 90) % 360 } : i)),
    })),

  deleteSelected: () =>
    set((s) => ({ items: s.items.filter((i) => i.id !== s.selectedId), selectedId: null })),

  select: (id) => set({ selectedId: id }),
  toggleClearance: () => set((s) => ({ showClearance: !s.showClearance })),
    setView: (view) => set({ view }),
      toggleWalkway: () => set((s) => ({ showWalkway: !s.showWalkway })),
}))