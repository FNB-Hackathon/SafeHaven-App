import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { liveGet } from '../api/client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function LiveView() {
  const { token } = useParams()
  const [pos, setPos] = useState<{ lat: number; lng: number; ts: number } | null>(null)
  const [error, setError] = useState('')
  const timerRef = useRef<number | null>(null)

  const markerIcon = useMemo(() =>
    L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
  [] )

  useEffect(() => {
    if (!token) return
    const fetchLatest = async () => {
      try {
        const latest = await liveGet(token)
        setPos(latest)
        setError('')
      } catch {
        setError('Waiting for live location…')
      }
    }
    fetchLatest()
    timerRef.current = window.setInterval(fetchLatest, 5000)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [token])

  const center: [number, number] = pos ? [pos.lat, pos.lng] as [number, number] : [-29.8587, 31.0218]
  const mapsLink = `https://maps.google.com/?q=${center[0]},${center[1]}`

  return (
    <div className="stack">
      <h2>Live Location</h2>
      <div style={{ height: 420, borderRadius: 8, overflow: 'hidden', border: '1px solid #1f2a37', width: '100%' }}>
        <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={center} icon={markerIcon}>
            <Popup>
              {pos ? new Date(pos.ts).toLocaleTimeString() : 'Awaiting updates'}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      {error && <div className="status">{error}</div>}
      <div className="stack">
        <a className="secondary" href={mapsLink} target="_blank" rel="noreferrer">Open in Google Maps</a>
      </div>
    </div>
  )
}
