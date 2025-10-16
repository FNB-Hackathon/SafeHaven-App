import { useEffect, useMemo, useState } from 'react'
import { getContacts } from '../api/client'

type Contact = { id: string; name: string; phone: string; relation: string }
const LS_KEY = 'sz_contacts'

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Contact | null>(null)

  const saveLocal = (list: Contact[]) => localStorage.setItem(LS_KEY, JSON.stringify(list))
  const loadLocal = (): Contact[] => {
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
  }

  useEffect(() => {
    (async () => {
      try {
        const local = loadLocal()
        if (local.length) {
          setContacts(local)
        } else {
          const seed = await getContacts()
          setContacts(seed)
          saveLocal(seed)
        }
      } catch (e) {
        setError('Failed to load contacts')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const upsert = (c: Contact) => {
    const list = [...contacts]
    const i = list.findIndex(x => x.id === c.id)
    if (i >= 0) list[i] = c
    else list.push(c)
    setContacts(list)
    saveLocal(list)
  }
  const remove = (id: string) => {
    const list = contacts.filter(c => c.id !== id)
    setContacts(list)
    saveLocal(list)
  }

  const newId = useMemo(() => Math.random().toString(36).slice(2), [editing])

  return (
    <div>
      <h2>Emergency Contacts</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <>
          <ul className="list" style={{ width: '100%' }}>
            {contacts.map(c => (
              <li key={c.id} className="card" style={{ width: '100%' }}>
                <div className="card-title">{c.name}</div>
                <div className="card-sub">{c.relation} • {c.phone}</div>
                <div className="stack" style={{ flexDirection:'row', gap:8, justifyContent:'flex-start' }}>
                  <button className="secondary" onClick={() => setEditing(c)}>Edit</button>
                  <button onClick={() => remove(c.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="card" style={{ width: '100%' }}>
            <strong>Add Contact</strong>
            <ContactForm
              key={editing ? editing.id : 'new'}
              initial={editing || { id: newId, name:'', phone:'', relation:'Emergency Contact' }}
              onCancel={() => setEditing(null)}
              onSave={(c) => { upsert(c); setEditing(null) }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function ContactForm({ initial, onSave, onCancel }: { initial: Contact; onSave:(c:Contact)=>void; onCancel:()=>void }) {
  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone)
  const [relation, setRelation] = useState(initial.relation)
  return (
    <div className="form">
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Phone (E.164)
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label>
        Relation
        <input value={relation} onChange={(e) => setRelation(e.target.value)} />
      </label>
      <div className="stack" style={{ flexDirection:'row', gap:8, justifyContent:'flex-start' }}>
        <button onClick={() => onSave({ id: initial.id, name, phone, relation })}>Save</button>
        <button className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
