const BASE = (import.meta.env.VITE_API_BASE as string) || `${window.location.protocol}//${window.location.hostname}:4000`

export async function sendAlert(payload: { method: 'panic' | 'detection'; location?: string }) {
  const res = await fetch(`${BASE}/api/alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed')
  return res.json() as Promise<{ status: string; timestamp: number }>
}

export async function getContacts() {
  const res = await fetch(`${BASE}/api/contacts`)
  if (!res.ok) throw new Error('Failed')
  return res.json() as Promise<Array<{ id: string; name: string; phone: string; relation: string }>>
}

export async function sendReport(payload: { type: string; description: string; location?: string }) {
  const res = await fetch(`${BASE}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export async function liveStart() {
  const res = await fetch(`${BASE}/api/live/start`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed')
  return res.json() as Promise<{ token: string }>
}

export async function liveUpdate(payload: { token: string; lat: number; lng: number; ts?: number }) {
  const res = await fetch(`${BASE}/api/live/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed')
  return res.json() as Promise<{ ok: true }>
}

export async function liveStop(token: string) {
  const res = await fetch(`${BASE}/api/live/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  if (!res.ok) throw new Error('Failed')
  return res.json() as Promise<{ ok: true }>
}

export async function liveGet(token: string) {
  const res = await fetch(`${BASE}/api/live/${token}`)
  if (!res.ok) throw new Error('Failed')
  return res.json() as Promise<{ lat: number; lng: number; ts: number }>
}
