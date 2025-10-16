import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import twilio from 'twilio'
import africastalking from 'africastalking'
import crypto from 'crypto'
import os from 'os'

const app = express()
const PORT = process.env.PORT || 4000

// Load env
dotenv.config()

// Allow all origins in development to support IDE previews and localhost variations
app.use(cors())
app.use(express.json())

const mockContacts = [
  { id: '4', name: 'Andy', phone: '+27614861915', relation: 'Emergency Contact' },
  { id: '5', name: 'Rose', phone: '+27843147448', relation: 'Emergency Contact' },
  { id: '6', name: 'Njabulo', phone: '+27726810755', relation: 'Emergency Contact' },
  { id: '7', name: 'Nku', phone: '+27838829990', relation: 'Emergency Contact' }
]

// Provider selection (trim and normalize)
const envProvider = (process.env.SMS_PROVIDER || '').trim().toLowerCase()

// Africa's Talking config
const atApiKey = (process.env.AFRICASTALKING_API_KEY || '').trim()
const atUsername = (process.env.AFRICASTALKING_USERNAME || '').trim()
const atSenderId = process.env.AFRICASTALKING_SENDER_ID // optional, requires approval
const atCreds = !!(atApiKey && atUsername)
const atEnabled = (envProvider === 'africastalking' || (!envProvider && atCreds)) && atCreds
const atClient = atEnabled ? africastalking({ apiKey: atApiKey, username: atUsername }) : null

// Twilio config
const twilioAccountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim()
const twilioAuthToken = (process.env.TWILIO_AUTH_TOKEN || '').trim()
const twilioFrom = (process.env.TWILIO_FROM || '').trim()
const twilioMessagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim()
const twilioCreds = !!(twilioAccountSid && twilioAuthToken && (twilioFrom || twilioMessagingServiceSid))
const twilioEnabled = (envProvider === 'twilio' || (!envProvider && !atCreds && twilioCreds)) && twilioCreds
const twilioClient = twilioEnabled ? twilio(twilioAccountSid, twilioAuthToken) : null

// Twilio WhatsApp config
const twilioWhatsAppFrom = (process.env.TWILIO_WHATSAPP_FROM || '').trim()
const waCreds = !!(twilioAccountSid && twilioAuthToken && twilioWhatsAppFrom)
const whatsappEnabled = envProvider === 'whatsapp' && waCreds

// BulkSMS config
const bulkUsername = (process.env.BULKSMS_USERNAME || '').trim()
const bulkPassword = (process.env.BULKSMS_PASSWORD || '').trim()
const bulkCreds = !!(bulkUsername && bulkPassword)
const bulkEnabled = (envProvider === 'bulksms') && bulkCreds

// Safe startup log (no secrets)
console.log('[CONFIG]', { provider: envProvider || (atEnabled ? 'africastalking' : (twilioEnabled ? 'twilio' : (bulkEnabled ? 'bulksms' : (whatsappEnabled ? 'whatsapp' : 'none')))), atEnabled, twilioEnabled, bulkEnabled, whatsappEnabled })

app.get('/api/contacts', (req, res) => {
  res.json(mockContacts)
})

app.post('/api/alert', async (req, res) => {
  const { method, location } = req.body || {}
  const timestamp = Date.now()
  const locationText = location ? `\nLocation: ${location}` : ''
  const message = `SafeZone Alert: ${method === 'panic' ? 'Panic button' : 'Smart detection'} triggered at ${new Date(timestamp).toLocaleString()}.${locationText}`

  const activeProvider = atEnabled ? 'africastalking' : twilioEnabled ? 'twilio' : 'none'
  console.log('[ALERT]', { method, location, contacts: mockContacts.map(c => c.phone), provider: activeProvider })

  try {
    if (atEnabled && atClient) {
      const sms = atClient.SMS
      await sms.send({
        to: mockContacts.map(c => c.phone),
        message,
        ...(atSenderId ? { from: atSenderId } : {})
      })
      return res.json({ status: 'sms_sent', provider: 'africastalking', timestamp })
    }
    if (bulkEnabled) {
      const to = mockContacts.map(c => c.phone)
      const auth = Buffer.from(`${bulkUsername}:${bulkPassword}`).toString('base64')
      const resp = await fetch('https://api.bulksms.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({ to, body: message })
      })
      if (!resp.ok) {
        const errText = await resp.text()
        throw new Error(`BulkSMS failed: ${resp.status} ${errText}`)
      }
      const data = await resp.json().catch(() => [])
      try {
        const mapped = Array.isArray(data) ? data.map(m => ({ to: m.to, id: m.id, status: m.status })) : data
        console.log('[BULKSMS_IDS]', mapped)
      } catch {}
      return res.json({ status: 'sms_sent', provider: 'bulksms', delivered: Array.isArray(data) ? data.length : undefined, timestamp })
    }
    if (whatsappEnabled) {
      if (!twilioClient) throw new Error('Twilio client not initialized for WhatsApp')
      const results = await Promise.all(
        mockContacts.map(async c => {
          const msg = await twilioClient.messages.create({
            from: `whatsapp:${twilioWhatsAppFrom}`,
            to: `whatsapp:${c.phone}`,
            body: message
          })
          return { to: c.phone, sid: msg.sid }
        })
      )
      try { console.log('[WHATSAPP_MAP]', results) } catch {}
      return res.json({ status: 'sms_sent', provider: 'whatsapp', delivered: results.length, timestamp })
    }
    if (twilioEnabled && twilioClient) {
      const useMessagingService = !!twilioMessagingServiceSid
      const recipients = useMessagingService ? mockContacts : mockContacts.filter(c => c.phone !== twilioFrom)
      const skipped = useMessagingService ? [] : mockContacts.filter(c => c.phone === twilioFrom).map(c => c.phone)
      if (!useMessagingService && skipped.length) console.warn('[TWILIO] Skipping recipients equal to FROM:', skipped)
      if (recipients.length === 0) {
        return res.json({ status: 'sms_sent', provider: 'twilio', delivered: 0, skipped, timestamp })
      }
      const results = await Promise.all(
        recipients.map(async c => {
          const msg = await twilioClient.messages.create({
            to: c.phone,
            ...(useMessagingService ? { messagingServiceSid: twilioMessagingServiceSid } : { from: twilioFrom }),
            body: message
          })
          return { to: c.phone, sid: msg.sid }
        })
      )
      try { console.log('[TWILIO_MAP]', results) } catch {}
      return res.json({ status: 'sms_sent', provider: 'twilio', delivered: recipients.length, skipped, timestamp })
    }
    res.json({ status: 'simulated', provider: 'none', timestamp })
  } catch (err) {
    const msg = err && (err.message || err.toString())
    // Some SDKs provide nested response data; avoid logging secrets
    const details = err && (err.code || err.status || err.response?.data || undefined)
    console.error('Failed to send SMS', msg, details || '')
    res.status(500).json({ status: 'error', error: 'sms_failed', message: msg, details })
  }
})

// --- Live location sessions (in-memory) ---
const liveSessions = new Map() // token -> { last: { lat, lng, ts } }

function newToken() {
  return crypto.randomBytes(12).toString('hex')
}

app.post('/api/live/start', (req, res) => {
  const token = newToken()
  liveSessions.set(token, { last: null })
  res.json({ token })
})

app.post('/api/live/update', (req, res) => {
  const { token, lat, lng, ts } = req.body || {}
  if (!token || typeof lat !== 'number' || typeof lng !== 'number') return res.status(400).json({ error: 'bad_request' })
  const s = liveSessions.get(token)
  if (!s) return res.status(404).json({ error: 'not_found' })
  s.last = { lat, lng, ts: ts || Date.now() }
  liveSessions.set(token, s)
  res.json({ ok: true })
})

app.post('/api/live/stop', (req, res) => {
  const { token } = req.body || {}
  if (!token) return res.status(400).json({ error: 'bad_request' })
  liveSessions.delete(token)
  res.json({ ok: true })
})

app.get('/api/live/:token', (req, res) => {
  const { token } = req.params
  const s = liveSessions.get(token)
  if (!s || !s.last) return res.status(404).json({ error: 'not_found' })
  res.json(s.last)
})

app.post('/api/report', (req, res) => {
  const report = req.body || {}
  console.log('[REPORT]', report)
  res.json({ ok: true, id: Math.random().toString(36).slice(2), receivedAt: Date.now() })
})

// Info endpoint to assist QR code page with LAN IPs
app.get('/api/info', (req, res) => {
  const ifaces = os.networkInterfaces()
  const lanIps = []
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] || []) {
      if (info.family === 'IPv4' && !info.internal) lanIps.push(info.address)
    }
  }
  res.json({
    backendPort: Number(PORT),
    frontendPort: 5173,
    hostHeader: req.headers.host,
    lanIps
  })
})

app.listen(PORT, () => {
  console.log(`SafeZone backend running on http://localhost:${PORT}`)
})
