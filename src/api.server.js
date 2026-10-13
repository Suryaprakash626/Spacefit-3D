const BASE = import.meta.env.VITE_API_URL ?? ''

async function req(path, opts = {}) {
  let res
  try {
    res = await fetch(`${BASE}/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts })
  } catch {
    throw new Error('Cannot reach the server. Is it running on port 4000?')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}

export const listLayouts = () => req('/layouts')
export const createLayout = (body) => req('/layouts', { method: 'POST', body: JSON.stringify(body) })
export const updateLayout = (id, body) => req(`/layouts/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const deleteLayout = (id) => req(`/layouts/${id}`, { method: 'DELETE' })