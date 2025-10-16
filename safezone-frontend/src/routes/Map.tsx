import { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api'

const defaultCenter: [number, number] = [-29.8587, 31.0218] // Durban fallback

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function useGeolocation() {
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [speed, setSpeed] = useState<number | null>(null)
  const [permission, setPerm] = useState<'granted'|'denied'|'prompt'|'unknown'>('unknown')
  const [source, setSource] = useState<'GPS'|'IP'|'Manual'|'Unknown'>('Unknown')
  const watchRef = useRef<number | null>(null)
  const approxRef = useRef<[number, number] | null>(null)
  const lastGoodRef = useRef<[number, number] | null>(null)
  const lastSetRef = useRef<number>(0)
  const hasFixRef = useRef<boolean>(false)
  const [ready, setReady] = useState(false)

  const requestLocation = (opts?: PositionOptions) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      setLoading(false)
      return
    }
    if (!ready) setLoading(true)
    // watchPosition for continuous updates
    try { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) } catch {}
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc, speed: spd } = pos.coords
        const next: [number, number] = [latitude, longitude]
        const accNum = typeof acc === 'number' ? acc : null
        setAccuracy(accNum)
        setSpeed(typeof spd === 'number' ? spd : null)
        // Filter: require either good accuracy or meaningful movement
        const last = lastGoodRef.current
        const moved = last ? haversine(last[0], last[1], next[0], next[1]) : Infinity
        const good = accNum == null || accNum <= 50 || moved >= 25
        if (good) {
          const nowTs = Date.now()
          if (nowTs - lastSetRef.current > 1500) {
            lastSetRef.current = nowTs
            lastGoodRef.current = next
            setCoords(next)
            setSource('GPS')
            if (!hasFixRef.current) { hasFixRef.current = true; if (!ready) setReady(true) }
          } else {
            // keep lastGood updated but avoid state churn
            lastGoodRef.current = next
          }
        }
        if (!ready) setError('')
        if (!ready) setLoading(false)
      },
      (err) => {
        const code = (err && 'code' in err) ? (err as GeolocationPositionError).code : undefined
        if (!hasFixRef.current) {
          if (code === 1) setError('Location permission denied. Allow location in site settings and retry.')
          else if (code === 2) setError('Position unavailable. Moving to open sky may help.')
          else if (code === 3) setError('Location request timed out. Retrying may help.')
          else setError('Unable to fetch location')
          setLoading(false)
        }
      },
      opts || { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    )
  }

  useEffect(() => { requestLocation() }, [])

  useEffect(() => {
    // Permissions API (best effort)
    let active = true
    // @ts-ignore
    if (navigator.permissions && navigator.permissions.query) {
      // @ts-ignore
      navigator.permissions.query({ name: 'geolocation' as any }).then((p: any) => {
        if (!active) return
        setPerm(p.state || 'unknown')
        p.onchange = () => setPerm(p.state || 'unknown')
      }).catch(() => setPerm('unknown'))
    }
    return () => { active = false }
  }, [])

  useEffect(() => {
    const fetchAddress = async (lat: number, lon: number) => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
        if (res.ok) {
          const data = await res.json()
          setAddress(data.display_name || '')
        }
      } catch {}
    }
    if (coords) fetchAddress(coords[0], coords[1])
  }, [coords])

  // (removed) approx handling moved to MapRoute

  const retry = () => requestLocation({ enableHighAccuracy: true, timeout: 25000, maximumAge: 0 })

  const warmupGPS = async () => {
    if (!navigator.geolocation) return
    setLoading(true)
    const attempt = () => new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy: acc, speed: spd } = pos.coords
          setCoords([latitude, longitude])
          setAccuracy(typeof acc === 'number' ? acc : null)
          setSpeed(typeof spd === 'number' ? spd : null)
          resolve()
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    })
    // Try a few quick fixes, then restart watch
    await attempt(); await new Promise(r => setTimeout(r, 1500))
    await attempt(); await new Promise(r => setTimeout(r, 1500))
    await attempt()
    setLoading(false)
    // restart watch to continue updates
    requestLocation({ enableHighAccuracy: true, timeout: 25000, maximumAge: 0 })
  }

  const ipFallback = async () => {
    try {
      if (!ready) setLoading(true)
      // Try multiple providers
      const tryProviders = async (): Promise<[number, number] | null> => {
        try {
          const r1 = await fetch('https://ipapi.co/json/')
          if (r1.ok) { const j = await r1.json(); if (typeof j.latitude === 'number' && typeof j.longitude === 'number') return [j.latitude, j.longitude] }
        } catch {}
        try {
          const r2 = await fetch('https://ipwho.is/')
          if (r2.ok) { const j = await r2.json(); if (j && j.success && j.latitude && j.longitude) return [j.latitude, j.longitude] as [number, number] }
        } catch {}
        try {
          const token = (import.meta as any).env?.VITE_IPINFO_TOKEN
          const url = token ? `https://ipinfo.io/json?token=${token}` : 'https://ipinfo.io/json'
          const r3 = await fetch(url)
          if (r3.ok) { const j = await r3.json(); if (j && typeof j.loc === 'string') { const [la, lo] = j.loc.split(',').map(parseFloat); if (!isNaN(la) && !isNaN(lo)) return [la, lo] as [number, number] } }
        } catch {}
        return null
      }
      const pos = await tryProviders()
      if (pos) {
        approxRef.current = pos
        setSource('IP')
        if (!ready) setError('')
        if (!hasFixRef.current) { hasFixRef.current = true; if (!ready) setReady(true) }
      } else {
        setError('IP-based location unavailable')
      }
    } catch {
      setError('IP-based location failed')
    } finally {
      if (!ready) setLoading(false)
    }
  }

  useEffect(() => () => { try { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) } catch {} }, [])

  return { coords, address, loading, error, accuracy, speed, permission, retry, ipFallback, warmupGPS, approx: approxRef, ready, source }
}

export default function MapRoute() {
  const rawApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
  const googleMapsApiKey = typeof rawApiKey === 'string' ? rawApiKey.trim() : ''
  const hasApiKey = googleMapsApiKey.length > 0
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey
  })
  const { coords, address, loading, error, accuracy, speed, permission, retry, ipFallback, warmupGPS, approx, ready, source } = useGeolocation()
  // Stabilize the map: keep initial center constant to avoid flicker
  const initialCenterRef = useRef<[number, number]>(defaultCenter)
  const center = initialCenterRef.current
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  const [follow, setFollow] = useState<boolean>(isMobile)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const lastPanAtRef = useRef<number>(0)
  const interactingRef = useRef<boolean>(false)
  const approxKey = (approx.current ? `${approx.current[0]},${approx.current[1]}` : '')
  const [manualText, setManualText] = useState('')
  const [manualPos, setManualPos] = useState<[number, number] | null>(null)
  const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), [])

  // Persist manual position so alerts can use it
  useEffect(() => {
    if (manualPos) {
      localStorage.setItem('sz_manual_pos', `${manualPos[0]},${manualPos[1]}`)
    } else {
      localStorage.removeItem('sz_manual_pos')
    }
  }, [manualPos])

  // Once we have first GPS fix, lock initial center to it
  useEffect(() => {
    if (coords && initialCenterRef.current === defaultCenter) {
      initialCenterRef.current = coords
    }
  }, [coords])

  // If only approximate is available, use it to set initial center once
  useEffect(() => {
    if (!coords && approx.current && initialCenterRef.current === defaultCenter) {
      initialCenterRef.current = approx.current
      if (mapRef.current) mapRef.current.panTo({ lat: approx.current[0], lng: approx.current[1] })
    }
  }, [approxKey, coords])

  // No explicit invalidate needed for Google Maps

  // No special resize handler required for Google Maps container

  // If GPS hasn’t arrived shortly after mount, auto-fallback to approximate IP
  useEffect(() => {
    if (coords) return
    const t = window.setTimeout(() => {
      if (!coords && !approx.current) {
        ipFallback()
      }
    }, 3000)
    return () => window.clearTimeout(t)
  }, [coords])

  // Marker appearance uses default Google marker
  const gmCenter = useMemo(() => ({ lat: center[0], lng: center[1] }), [center])
  const currentTarget = manualPos || coords || approx.current || center
  const gmTarget = useMemo(() => ({ lat: currentTarget[0], lng: currentTarget[1] }), [currentTarget])

  async function copyLink() {
    const cur = (coords || approx.current || center) as [number, number]
    const mapsLink = `https://maps.google.com/?q=${cur[0]},${cur[1]}`
    try {
      await navigator.clipboard.writeText(mapsLink)
      alert('Location link copied to clipboard')
    } catch {
      alert('Failed to copy link')
    }
  }

  async function shareLink() {
    const cur = (coords || approx.current || center) as [number, number]
    const mapsLink = `https://maps.google.com/?q=${cur[0]},${cur[1]}`
    const text = `My location: ${mapsLink}${address ? `\n${address}` : ''}`
    // @ts-ignore
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      await copyLink()
      window.open(mapsLink, '_blank')
    }
  }

  // Track manual interaction is handled via onDrag events if needed

  useEffect(() => {
    const map = mapRef.current
    const target = manualPos || coords || approx.current
    if (!follow || !map || !target) return
    if (interactingRef.current) return
    const now = Date.now()
    const cur = map.getCenter()
    if (!cur) return
    const dist = haversine(cur.lat(), cur.lng(), target[0], target[1])
    if (dist > 50 && now - lastPanAtRef.current > 3000) {
      lastPanAtRef.current = now
      map.panTo({ lat: target[0], lng: target[1] })
    }
  }, [manualPos, coords, approxKey, follow])

  // Marker updates via props in Google Maps

  // Compute current shareable link
  const currentPos = (manualPos || coords || approx.current || center) as [number, number]
  const mapsLink = `https://maps.google.com/?q=${currentPos[0]},${currentPos[1]}`

  return (
    <div className="stack">
      <div style={{ height: 400, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        {!hasApiKey ? (
          <div className="status" style={{ height: '100%', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding: 16 }}>
            Google Maps API key not configured. Set `VITE_GOOGLE_MAPS_API_KEY` in `.env`, restart the dev server, and reload the page.
          </div>
        ) : loadError ? (
          <div className="status" style={{ height: '100%', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding: 16 }}>
            Failed to load Google Maps. Check the API key restrictions or try again shortly.
          </div>
        ) : (ready || manualPos) ? (
          isLoaded ? (
            <GoogleMap
              onLoad={(m) => { mapRef.current = m }}
              center={gmCenter}
              zoom={16}
              options={{ disableDefaultUI: false, clickableIcons: false }}
              mapContainerStyle={containerStyle}
              onDragStart={() => { interactingRef.current = true }}
              onDragEnd={() => { interactingRef.current = false }}
            >
              <MarkerF position={gmTarget} onLoad={(mk) => { markerRef.current = mk }} />
            </GoogleMap>
          ) : (
            <div className="status" style={{ height: '100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              Loading map…
            </div>
          )
        ) : (
          <div className="status" style={{ height: '100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            Getting your position…
          </div>
        )}
      </div>
      <div>
        {loading && <div>Detecting location…</div>}
        {error && (
          <div className="status">
            {error}
            <div className="stack" style={{ marginTop: 8 }}>
              <button onClick={retry}>Retry GPS</button>
              <button className="secondary" onClick={ipFallback}>Approximate (IP) location</button>
              <button className="secondary" onClick={warmupGPS}>Warm up GPS</button>
            </div>
            <div className="muted">Permission: {permission}</div>
          </div>
        )}
        {!loading && (
          <div className="stack">
            <div><strong>Coords:</strong> {currentPos[0].toFixed(6)}, {currentPos[1].toFixed(6)}</div>
            {accuracy != null && <div><strong>Accuracy:</strong> ±{Math.round(accuracy)} m</div>}
            <div className="muted">Source: {source}</div>
            {speed != null && !isNaN(speed) && <div><strong>Speed:</strong> {Math.round(speed)} m/s</div>}
            <div className="stack" style={{ flexDirection:'row', gap:8 }}>
              <label>
                Follow
                <input type="checkbox" checked={follow} onChange={(e)=>setFollow(e.target.checked)} />
              </label>
              <button className="secondary" onClick={() => {
                const map = mapRef.current
                const target = manualPos || coords || approx.current
                if (map && target) map.panTo({ lat: target[0], lng: target[1] })
              }}>Center on me</button>
            </div>
            <div className="stack" style={{ width:'100%' }}>
              <input
                placeholder="Paste Google Maps link or lat,lng"
                value={manualText}
                onChange={(e)=>setManualText(e.target.value)}
              />
              <button onClick={() => {
                const txt = manualText.trim()
                const parse = (): [number, number] | null => {
                  // patterns: q=lat,lng or @lat,lng or !3dLAT!4dLNG or plain "lat,lng"
                  let m = txt.match(/[?&]q=([-0-9.]+),([-0-9.]+)/)
                  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
                  m = txt.match(/@([-0-9.]+),([-0-9.]+)/)
                  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
                  m = txt.match(/!3d([-0-9.]+)!4d([-0-9.]+)/)
                  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
                  const parts = txt.split(',').map(s=>parseFloat(s))
                  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return [parts[0], parts[1]]
                  return null
                }
                if (!txt) {
                  // Clear manual override and revert to live
                  setManualPos(null)
                  const map = mapRef.current
                  const fallback = coords || approx.current || center
                  if (map && fallback) map.panTo({ lat: fallback[0], lng: fallback[1] })
                  return
                }
                const pos = parse()
                if (pos) {
                  setManualPos(pos)
                  const map = mapRef.current
                  if (map) map.panTo({ lat: pos[0], lng: pos[1] })
                }
              }}>Set location</button>
              {manualPos && <div className="muted">Manual location set. Clear input and press Set to revert to live.</div>}
            </div>
            {!coords && approx.current && (
              <div className="muted">Using approximate location (IP). Will switch to GPS when available.</div>
            )}
            {address && <div><strong>Address:</strong> {address}</div>}
            <div className="stack">
              <a className="secondary" href={mapsLink} target="_blank" rel="noreferrer">Open in Google Maps</a>
              <button onClick={copyLink}>Copy link</button>
              <button onClick={shareLink}>Share</button>
            </div>
            <div className="stack" style={{ flexDirection:'row', gap:8 }}>
              <button onClick={retry}>Retry GPS</button>
              <button className="secondary" onClick={ipFallback}>Approximate (IP) location</button>
              <button className="secondary" onClick={warmupGPS}>Warm up GPS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
