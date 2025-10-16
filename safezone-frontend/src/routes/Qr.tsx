import { useEffect, useMemo, useState } from 'react'

export default function Qr() {
  const search = new URLSearchParams(window.location.search)
  const initial = search.get('u') || window.location.origin
  const [appUrl, setAppUrl] = useState(initial)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const qrSrc = useMemo(() => {
    const data = encodeURIComponent(appUrl)
    // Using a simple public QR API to avoid extra deps in MVP
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${data}`
  }, [appUrl])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('u', appUrl)
    window.history.replaceState({}, '', url.toString())
  }, [appUrl])

  const copy = async () => { try { await navigator.clipboard.writeText(appUrl) } catch {} }

  // Fetch LAN IP suggestions from backend helper
  useEffect(() => {
    const backendBase = `${window.location.protocol}//${window.location.hostname}:4000`
    fetch(`${backendBase}/api/info`).then(r => r.json()).then(info => {
      const ips: string[] = Array.isArray(info.lanIps) ? info.lanIps : []
      const port = info.frontendPort || 5176
      const urls = ips.map((ip) => `${window.location.protocol}//${ip}:${port}`)
      setSuggestions(urls)
    }).catch(() => {})
  }, [])

  return (
    <div className="stack">
      <h2>Scan on Your Phone</h2>
      <div className="card" style={{ padding: 16, textAlign: 'center' }}>
        <img src={qrSrc} alt="QR code to open the app" width={280} height={280} />
      </div>
      <div className="stack" style={{ width:'100%' }}>
        <input value={appUrl} onChange={(e) => setAppUrl(e.target.value)} />
        <div className="card-sub">Share this URL or scan the QR</div>
        <button onClick={copy}>Copy URL</button>
      </div>
      {suggestions.length > 0 && (
        <div className="card" style={{ width:'100%' }}>
          <div className="card-title">Suggested LAN URLs</div>
          <div className="stack">
            {suggestions.map(u => (
              <button key={u} className="secondary" onClick={() => setAppUrl(u)}>{u}</button>
            ))}
          </div>
        </div>
      )}
      <div className="status">
        Tip: If your phone cannot reach localhost, use your computer's LAN IP.
        Example: http://192.168.x.x:5176
      </div>
    </div>
  )
}
