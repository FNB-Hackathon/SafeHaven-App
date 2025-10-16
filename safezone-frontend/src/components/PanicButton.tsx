import { useEffect, useRef, useState } from 'react'

type Props = { onClick: () => void }

export default function PanicButton({ onClick }: Props) {
  const holdMs = 3000
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const startTsRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const fireRef = useRef<number | null>(null)

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (fireRef.current) window.clearTimeout(fireRef.current)
    rafRef.current = null
    fireRef.current = null
    startTsRef.current = null
    setHolding(false)
    setProgress(0)
  }

  const tick = () => {
    if (!startTsRef.current) return
    const p = Math.min(1, (Date.now() - startTsRef.current) / holdMs)
    setProgress(p)
    if (p < 1) rafRef.current = requestAnimationFrame(tick)
  }

  const start = () => {
    if (holding) return
    setHolding(true)
    setProgress(0)
    startTsRef.current = Date.now()
    try { navigator.vibrate && navigator.vibrate(10) } catch {}
    rafRef.current = requestAnimationFrame(tick)
    fireRef.current = window.setTimeout(() => {
      cleanup()
      onClick()
    }, holdMs)
  }

  const cancel = () => {
    if (!holding) return
    cleanup()
  }

  useEffect(() => () => cleanup(), [])

  return (
    <button
      className={`panic large ${holding ? 'holding' : ''}`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => { e.preventDefault() }}
      aria-label="Hold for 3 seconds to activate emergency"
    >
      <span className="panic-label">Activate Emergency</span>
      <span className="panic-sub">Hold for 3 seconds</span>
      <span className="panic-progress" style={{ width: `${progress * 100}%` }} />
    </button>
  )
}
