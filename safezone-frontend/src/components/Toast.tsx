import { useEffect } from 'react'

type Props = { message: string; onClose: () => void; timeout?: number }

export default function Toast({ message, onClose, timeout = 3000 }: Props) {
  useEffect(() => {
    const id = setTimeout(onClose, timeout)
    return () => clearTimeout(id)
  }, [onClose, timeout])
  if (!message) return null
  return <div className="toast">{message}</div>
}
