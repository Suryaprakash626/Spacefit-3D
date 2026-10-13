// Temporary: saves layouts in this browser only.
// When MongoDB is ready, delete this file and rename api.server.js back to api.js.
const KEY = 'spacefit.layouts'
const read = () => JSON.parse(localStorage.getItem(KEY) || '[]')
const write = (list) => localStorage.setItem(KEY, JSON.stringify(list))

export const listLayouts = async () =>
  read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

export const createLayout = async ({ name, room, items }) => {
  const now = new Date().toISOString()
  const doc = { id: crypto.randomUUID(), name, room, items, createdAt: now, updatedAt: now }
  write([...read(), doc])
  return doc
}

export const updateLayout = async (id, { name, room, items }) => {
  const now = new Date().toISOString()
  let out
  write(read().map((l) => (l.id === id ? (out = { ...l, name, room, items, updatedAt: now }) : l)))
  return out
}

export const deleteLayout = async (id) => {
  write(read().filter((l) => l.id !== id))
  return null
}