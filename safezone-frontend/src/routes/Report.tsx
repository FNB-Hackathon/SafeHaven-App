import { useState } from 'react'
import { sendReport } from '../api/client'

export default function Report() {
  const [type, setType] = useState('Incident')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('Submitting...')
    try {
      await sendReport({ type, description, location })
      setStatus('Report submitted')
      setDescription('')
      setLocation('')
    } catch (e) {
      setStatus('Failed to submit')
    }
  }

  return (
    <div>
      <h2>Report</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Type
          <select value={type} onChange={e => setType(e.target.value)}>
            <option>Incident</option>
            <option>Follow-up</option>
            <option>Feedback</option>
          </select>
        </label>
        <label>
          Description
          <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} />
        </label>
        <label>
          Location (optional)
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Mall parking lot" />
        </label>
        <button type="submit">Submit</button>
      </form>
      {status && <div className="status">{status}</div>}
    </div>
  )
}
