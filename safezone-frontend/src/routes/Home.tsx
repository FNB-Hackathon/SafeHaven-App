import { useEffect, useRef, useState } from 'react'
import PanicButton from '../components/PanicButton'
import { sendAlert, getContacts, liveStart, liveUpdate, liveStop } from '../api/client'

export default function Home() {
  const [status, setStatus] = useState<string>('')
  const [manualLocation, setManualLocation] = useState<string>('')
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; phone: string; relation: string }>>([])
  const [waLinks, setWaLinks] = useState<Array<{ name: string; phone: string; url: string }>>([])
  const [shakeEnabled, setShakeEnabled] = useState<boolean>(false)
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false)
  const recognitionRef = useRef<any>(null)
  const [liveToken, setLiveToken] = useState<string | null>(null)
  const liveTimerRef = useRef<number | null>(null)
  const [destInput, setDestInput] = useState<string>('')
  const [arrivalOn, setArrivalOn] = useState<boolean>(false)
  const arrivalTimerRef = useRef<number | null>(null)
  const [arrivalStatus, setArrivalStatus] = useState<string>('')
  const [shakeSensitivity, setShakeSensitivity] = useState<'low'|'medium'|'high'|'ultra'>('high')
  const [shakeDebug, setShakeDebug] = useState<{mag:number; jerk:number; events:number}>({ mag: 0, jerk: 0, events: 0 })
  // Live location cache for alerts
  const latestLinkRef = useRef<string | undefined>(undefined)
  const geoWatchRef = useRef<number | null>(null)
  const [shareBase, setShareBase] = useState<string>(window.location.origin)

  useEffect(() => {
    getContacts().then(setContacts).catch(() => {})
  }, [])

  // Discover LAN share base (backend reports lanIps and frontendPort)
  useEffect(() => {
    const probe = async () => {
      try {
        const res = await fetch(`${window.location.protocol}//${window.location.hostname}:4000/api/info`)
        if (!res.ok) return
        const info = await res.json()
        const ip = Array.isArray(info.lanIps) && info.lanIps[0]
        const port = Number(info.frontendPort) || 5173
        if (ip) setShareBase(`http://${ip}:${port}`)
      } catch {}
    }
    probe()
  }, [])

  // Maintain a continuous location watch to keep alerts accurate
  useEffect(() => {
    if (!navigator.geolocation) return
    try { if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current) } catch {}
    geoWatchRef.current = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude } = pos.coords
      latestLinkRef.current = `https://maps.google.com/?q=${latitude},${longitude}`
    }, () => {}, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 })
    return () => { try { if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current) } catch {} }
  }, [])

  const getLocation = (): Promise<string | undefined> => {
    return new Promise((resolve) => {
      // 1) Manual override from Map page (highest priority)
      try {
        const stored = localStorage.getItem('sz_manual_pos')
        if (stored) {
          const parts = stored.split(',').map(parseFloat)
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return resolve(`https://maps.google.com/?q=${parts[0]},${parts[1]}`)
          }
        }
      } catch {}
      // 2) Fast fallback to last watched link to avoid delays
      if (latestLinkRef.current) return resolve(latestLinkRef.current)
      if (!navigator.geolocation) return resolve(manualLocation || undefined)
      let settled = false
      const fastTimer = window.setTimeout(() => {
        if (!settled) {
          settled = true
          resolve(manualLocation || latestLinkRef.current)
        }
      }, 1500)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (settled) return
          settled = true
          window.clearTimeout(fastTimer)
          const { latitude, longitude } = pos.coords
          const link = `https://maps.google.com/?q=${latitude},${longitude}`
          resolve(link)
        },
        () => {
          if (settled) return
          settled = true
          window.clearTimeout(fastTimer)
          resolve(manualLocation || latestLinkRef.current)
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      )
    })
  }

  // Share guardian link via WhatsApp
  const shareGuardianWhatsApp = () => {
    if (!liveToken) return
    const url = `${shareBase}/live/${liveToken}`
    const text = `SafeZone Live Share: Track my route here ${url}`
    const links = createWaLinks(text)
    setWaLinks(links)
    // open first chat automatically
    if (links[0]) {
      try { window.open(links[0].url, '_blank') } catch {}
    }
  }

  // --- Safe Arrival helpers ---
  const haversine = (lat1:number, lon1:number, lat2:number, lon2:number) => {
    const R = 6371000
    const toRad = (d:number) => d * Math.PI / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const geocode = async (q: string): Promise<{lat:number; lng:number} | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}`)
      if (!res.ok) return null
      const data = await res.json()
      if (Array.isArray(data) && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch {}
    return null
  }

  const startArrivalMonitor = async () => {
    setArrivalStatus('Starting safe arrival…')
    let target: {lat:number; lng:number} | null = null
    const match = destInput.match(/q=([-0-9.]+),([-0-9.]+)/)
    if (match) target = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
    if (!target) target = await geocode(destInput)
    if (!target) { setArrivalStatus('Unable to locate destination'); return }
    setArrivalOn(true)
    setArrivalStatus('Monitoring…')
    const tick = () => {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords
        const d = haversine(latitude, longitude, target!.lat, target!.lng)
        setArrivalStatus(`Distance to destination: ${Math.round(d)} m`)
        if (d <= 50) {
          const ts = new Date().toLocaleString()
          const maps = `https://maps.google.com/?q=${latitude},${longitude}`
          const msg = `SafeZone: Arrived safely at ${ts}.\nLocation: ${maps}`
          triggerWhatsAppCustom(msg)
          stopArrivalMonitor()
        }
      }, () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 })
    }
    tick()
    arrivalTimerRef.current = window.setInterval(tick, 5000)
  }

  const stopArrivalMonitor = () => {
    if (arrivalTimerRef.current) window.clearInterval(arrivalTimerRef.current)
    arrivalTimerRef.current = null
    setArrivalOn(false)
    setArrivalStatus('Stopped')
  }

  // helpers to reuse wa message building
  const normalize = (p: string) => (p || '').replace(/[^0-9]/g, '')
  const createWaLinks = (message: string) => contacts.map(c => ({
    name: c.name,
    phone: c.phone,
    url: `https://wa.me/${normalize(c.phone)}?text=${encodeURIComponent(message)}`
  }))

  const triggerWhatsAppCustom = (message: string) => {
    const links = createWaLinks(message)
    setWaLinks(links)
    links.forEach((l, i) => setTimeout(() => { try { window.open(l.url, '_blank') } catch {} }, i * 250))
  }

  // Live location: start session and send periodic updates
  const startFollowedMode = async () => {
    try {
      const { token } = await liveStart()
      setLiveToken(token)
      setStatus('Live sharing started')

      const pickManual = (): { lat:number; lng:number } | null => {
        try {
          const stored = localStorage.getItem('sz_manual_pos')
          if (stored) {
            const parts = stored.split(',').map(parseFloat)
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              return { lat: parts[0], lng: parts[1] }
            }
          }
        } catch {}
        return null
      }

      const quickGeo = (): Promise<{lat:number; lng:number} | null> => new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null)
        let done = false
        const t = window.setTimeout(() => { if (!done) { done = true; resolve(null) } }, 2000)
        navigator.geolocation.getCurrentPosition((pos) => {
          if (done) return
          done = true
          window.clearTimeout(t)
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        }, () => { if (!done) { done = true; window.clearTimeout(t); resolve(null) } }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 2000 })
      })

      const parseLatest = (): { lat:number; lng:number } | null => {
        const s = latestLinkRef.current || ''
        const m = s.match(/q=([-0-9.]+),([-0-9.]+)/)
        if (m) {
          const la = parseFloat(m[1]); const lo = parseFloat(m[2])
          if (!isNaN(la) && !isNaN(lo)) return { lat: la, lng: lo }
        }
        return null
      }

      const ipApprox = async (): Promise<{ lat:number; lng:number } | null> => {
        try {
          const r1 = await fetch('https://ipapi.co/json/')
          if (r1.ok) { const j = await r1.json(); if (typeof j.latitude === 'number' && typeof j.longitude === 'number') return { lat: j.latitude, lng: j.longitude } }
        } catch {}
        try {
          const r2 = await fetch('https://ipwho.is/')
          if (r2.ok) { const j = await r2.json(); if (j && j.success && j.latitude && j.longitude) return { lat: j.latitude, lng: j.longitude } }
        } catch {}
        try {
          const token = (import.meta as any).env?.VITE_IPINFO_TOKEN
          const url = token ? `https://ipinfo.io/json?token=${token}` : 'https://ipinfo.io/json'
          const r3 = await fetch(url)
          if (r3.ok) { const j = await r3.json(); if (j && typeof j.loc === 'string') { const [la, lo] = j.loc.split(',').map(parseFloat); if (!isNaN(la) && !isNaN(lo)) return { lat: la, lng: lo } } }
        } catch {}
        return null
      }

      const sendNow = async () => {
        if (!token) return
        const manual = pickManual()
        const best = manual || await quickGeo() || parseLatest() || await ipApprox()
        if (best) {
          await liveUpdate({ token, lat: best.lat, lng: best.lng, ts: Date.now() }).catch(() => {})
          setStatus('Live: location sent')
        } else {
          setStatus('Live: waiting for location…')
        }
      }

      await sendNow()

      // Immediately notify contacts via backend SMS with the live link
      try {
        const loc = await getLocation()
        const liveUrl = `${shareBase}/live/${token}`
        const composed = loc ? `${loc}\nLive: ${liveUrl}` : `Live: ${liveUrl}`
        await sendAlert({ method: 'detection', location: composed })
        setStatus('Live link sent to contacts')
      } catch {
        // Non-fatal; WhatsApp sharing still available
      }

      // Continuous updates via watchPosition
      try { if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current) } catch {}
      if (navigator.geolocation) {
        geoWatchRef.current = navigator.geolocation.watchPosition((pos) => {
          if (!token) return
          const { latitude, longitude } = pos.coords
          liveUpdate({ token, lat: latitude, lng: longitude, ts: Date.now() }).catch(() => {})
        }, () => {}, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 })
      }

      // Backup timer every 10s using last known or manual
      if (liveTimerRef.current) window.clearInterval(liveTimerRef.current)
      liveTimerRef.current = window.setInterval(async () => {
        if (!token) return
        const manual = pickManual()
        if (manual) {
          liveUpdate({ token, lat: manual.lat, lng: manual.lng, ts: Date.now() }).catch(() => {})
        }
      }, 10000)
    } catch {
      setStatus('Failed to start live sharing')
    }
  }

  const stopFollowedMode = async () => {
    try {
      if (liveTimerRef.current) window.clearInterval(liveTimerRef.current)
      liveTimerRef.current = null
      if (liveToken) await liveStop(liveToken)
      setLiveToken(null)
      setStatus('Live sharing stopped')
    } catch {
      setStatus('Failed to stop live sharing')
    }
  }

  // Shake-to-activate (DeviceMotion)
  useEffect(() => {
    if (!shakeEnabled) return
    let lastMagnitude = 0
    let triggeredAt = 0
    let lastPeakAt = 0
    let peakCount = 0
    let events = 0
    const onMotion = (e: DeviceMotionEvent) => {
      events++
      // Prefer acceleration without gravity if available; fallback to includingGravity
      const axRaw = (e.acceleration && e.acceleration.x != null) ? e.acceleration.x! : (e.accelerationIncludingGravity?.x || 0)
      const ayRaw = (e.acceleration && e.acceleration.y != null) ? e.acceleration.y! : (e.accelerationIncludingGravity?.y || 0)
      const azRaw = (e.acceleration && e.acceleration.z != null) ? e.acceleration.z! : (e.accelerationIncludingGravity?.z || 0)
      const mag = Math.sqrt(axRaw*axRaw + ayRaw*ayRaw + azRaw*azRaw)
      const jerk = Math.abs(mag - lastMagnitude)
      lastMagnitude = mag
      const now = Date.now()
      // Sensitivity thresholds
      const thresholds = {
        low:   { jerk: 6,   mag: 20 },
        medium:{ jerk: 4,   mag: 16 },
        high:  { jerk: 2.5, mag: 12 },
        ultra: { jerk: 1.5, mag: 9 }
      }[shakeSensitivity]
      setShakeDebug({ mag, jerk, events })
      // Peak counting: two peaks within window indicate a shake gesture
      const windowMs = 800
      if (jerk > thresholds.jerk || mag > thresholds.mag) {
        if (now - lastPeakAt < windowMs) {
          peakCount++
        } else {
          peakCount = 1
        }
        lastPeakAt = now
      }
      // Trigger if enough peaks and cooldown passed
      if (peakCount >= 2 && (now - triggeredAt > 2000)) {
        triggeredAt = now
        peakCount = 0
        triggerWhatsApp('panic')
        setStatus('Shake detected: triggering WhatsApp alert')
        try { navigator.vibrate && navigator.vibrate(50) } catch {}
      }
    }
    window.addEventListener('devicemotion', onMotion, { passive: true })
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [shakeEnabled, shakeSensitivity])

  const enableShake = async () => {
    try {
      // iOS requires explicit permission
      // @ts-ignore
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        // @ts-ignore
        const res = await DeviceMotionEvent.requestPermission()
        if (res !== 'granted') { setStatus('Motion permission denied. In iOS Settings > Safari, enable Motion & Orientation Access.'); return }
      }
      setShakeEnabled(true)
      setStatus('Shake-to-activate enabled. Try a firm double-shake. Adjust sensitivity if needed.')
    } catch {
      setStatus('Unable to enable motion sensors')
    }
  }

  // Voice activation using Web Speech API (experimental)
  const initRecognition = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return null
    const rec = new SpeechRecognition()
    rec.lang = 'en-ZA'
    rec.continuous = true
    rec.interimResults = true
    // Faster detection with minimal alternatives
    // @ts-ignore
    rec.maxAlternatives = 1
    const cooldownMs = 2500
    let lastFire = 0
    rec.onresult = (evt: any) => {
      const now = Date.now()
      if (now - lastFire < cooldownMs) return
      const parts: string[] = []
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const res = evt.results[i]
        if (!res || !res[0]) continue
        parts.push(String(res[0].transcript || ''))
      }
      const t = parts.join(' ').toLowerCase()
      if (!t) return
      if (t.includes('help') || t.includes('panic') || t.includes('sos')) {
        lastFire = now
        triggerWhatsApp('panic')
        setStatus('Voice keyword detected: triggering WhatsApp alert')
      }
    }
    rec.onerror = () => { /* ignore transient errors */ }
    rec.onend = () => { if (voiceEnabled) rec.start() }
    return rec
  }

  const toggleVoice = () => {
    if (voiceEnabled) {
      try { recognitionRef.current && recognitionRef.current.stop() } catch {}
      setVoiceEnabled(false)
      setStatus('Voice activation disabled')
    } else {
      const rec = initRecognition()
      if (!rec) { setStatus('Voice recognition not supported in this browser'); return }
      recognitionRef.current = rec
      try { rec.start(); setVoiceEnabled(true); setStatus('Voice activation enabled. Say "help" to trigger.') } catch { setStatus('Failed to start voice recognition') }
    }
  }

  const triggerAlert = async (source: 'panic' | 'detection') => {
    setStatus('Sending alert...')
    try {
      const location = await getLocation()
      const liveText = liveToken ? `\nLive: ${shareBase}/live/${liveToken}` : ''
      const composed = location ? `${location}${liveText}` : (liveText || undefined)
      const res = await sendAlert({ method: source, location: composed })
      setStatus(`Alert ${res.status} at ${new Date(res.timestamp).toLocaleTimeString()}`)
    } catch (e) {
      setStatus('Failed to send alert')
    }
  }

  const triggerWhatsApp = async (source: 'panic' | 'detection') => {
    setStatus('Preparing WhatsApp messages...')
    const ts = Date.now()
    const location = await getLocation()
    const locationText = location ? `\nLocation: ${location}` : ''
    const liveText = liveToken ? `\nLive: ${window.location.origin}/live/${liveToken}` : ''
    const message = `SafeZone Alert: ${source === 'panic' ? 'Panic button' : 'Smart detection'} triggered at ${new Date(ts).toLocaleString()}.${locationText}${liveText}`
    const normalize = (p: string) => (p || '').replace(/[^0-9]/g, '')
    const links = contacts.map(c => ({
      name: c.name,
      phone: c.phone,
      url: `https://wa.me/${normalize(c.phone)}?text=${encodeURIComponent(message)}`
    }))
    setWaLinks(links)
    // Attempt to open all chats automatically (browsers may block multiple popups)
    links.forEach((l, i) => {
      setTimeout(() => {
        try { window.open(l.url, '_blank') } catch {}
      }, i * 250)
    })
    setStatus('Opened WhatsApp chats (if popups allowed). Links are listed below as fallback.')
  }

  return (
    <div>
      <h2>Immediate Help</h2>
      <p>If you feel unsafe, use the panic button. You can also simulate smart detection.</p>
      <div className="stack">
        <PanicButton onClick={() => triggerWhatsApp('panic')} />
        <button className="secondary" onClick={() => triggerAlert('detection')}>Simulate Smart Detection</button>
      </div>
      <div className="stack" style={{ marginTop: 8 }}>
        {!shakeEnabled ? (
          <button onClick={enableShake}>Enable Shake-to-Activate</button>
        ) : (
          <>
            <div className="muted">Shake-to-activate is ON</div>
            <div className="stack" style={{ flexDirection:'row', gap:8 }}>
              <label>
                Sensitivity
                <select value={shakeSensitivity} onChange={(e)=>setShakeSensitivity(e.target.value as any)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="ultra">Ultra</option>
                </select>
              </label>
              <button className="secondary" onClick={()=>{ setShakeDebug({ mag:0, jerk:0, events:0 }); setStatus(`Simulated shake triggering WhatsApp`); triggerWhatsApp('panic') }}>Simulate Shake</button>
            </div>
            <div className="muted">events: {shakeDebug.events} • mag: {shakeDebug.mag.toFixed(1)} • jerk: {shakeDebug.jerk.toFixed(1)}</div>
          </>
        )}
        <button className="secondary" onClick={toggleVoice}>{voiceEnabled ? 'Disable Voice Activation' : 'Enable Voice Activation'}</button>
      </div>
      <div className="stack" style={{ marginTop: 8 }}>
        {!liveToken ? (
          <button onClick={startFollowedMode}>Start "I'm Being Followed" (Live Share)</button>
        ) : (
          <>
            <div className="status">Live sharing active</div>
            <a className="secondary" href={`${shareBase}/live/${liveToken}`} target="_blank" rel="noreferrer">Open Guardian View</a>
            <button onClick={async () => { try { await navigator.clipboard.writeText(`${shareBase}/live/${liveToken}`); setStatus('Guardian link copied') } catch {} }}>Copy Guardian Link</button>
            <button onClick={shareGuardianWhatsApp}>WhatsApp Guardian Link</button>
            <button onClick={stopFollowedMode}>Stop Live Share</button>
          </>
        )}
      </div>
      <div className="stack" style={{ marginTop: 8 }}>
        <button onClick={() => triggerWhatsApp('panic')}>Send via WhatsApp</button>
        <button className="secondary" onClick={() => triggerWhatsApp('detection')}>WhatsApp: Smart Detection</button>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        <input
          placeholder="Optional location link or address (used if GPS unavailable)"
          value={manualLocation}
          onChange={(e) => setManualLocation(e.target.value)}
        />
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        <h3>Safe Arrival</h3>
        <input
          placeholder="Destination address or Google Maps link"
          value={destInput}
          onChange={(e) => setDestInput(e.target.value)}
        />
        {!arrivalOn ? (
          <button onClick={startArrivalMonitor}>Start Safe Arrival Monitor</button>
        ) : (
          <button className="secondary" onClick={stopArrivalMonitor}>Stop Safe Arrival Monitor</button>
        )}
        {arrivalStatus && <div className="status">{arrivalStatus}</div>}
      </div>
      {waLinks.length > 0 && (
        <div className="stack" style={{ marginTop: 8 }}>
          {waLinks.map(l => (
            <a key={l.phone} href={l.url} target="_blank" rel="noreferrer">Open WhatsApp chat: {l.name} ({l.phone})</a>
          ))}
        </div>
      )}
      {status && <div className="status">{status}</div>}
    </div>
  )
}
