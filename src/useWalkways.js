import { useMemo } from 'react'
import { useStore } from './store'
import { analyzeWalkways } from './pathfinding'

// shared cache so the plan and the panel don't compute the same thing twice
let last = { room: null, items: null, out: null }
function get(room, items) {
  if (last.room !== room || last.items !== items) last = { room, items, out: analyzeWalkways(room, items) }
  return last.out
}

export function useWalkways() {
  const room = useStore((s) => s.room)
  const items = useStore((s) => s.items)
  return useMemo(() => get(room, items), [room, items])
}