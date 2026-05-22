import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useWallet } from '../hooks/useWallet.jsx'

export default function MerchantNew() {
  const navigate = useNavigate()
  const { address } = useWallet()
  const [form, setForm] = useState({ name: '', description: '', price_usd: '', type: 'one-time', webhook_url: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!address) { setError('Sign in first'); return }
    if (!form.name || !form.price_usd) { setError('Name and price are required'); return }
    try {
      setLoading(true)
      setError(null)
      await api.post('/merchants', { wallet: address, business_name: address })
      await api.post('/merchants/me/products', form)
      navigate('/merchant/dashboard')
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <button className="btn btn-ghost" style={{ marginBottom: 24, fontSize: 13 }} onClick={() => navigate(-1)}>Back</button>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>New Checkout Item</h2>
      <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
        This is a normal dashboard action. Creating an item does not spend credits.
      </p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Item Name</label>
          <input placeholder="Hackathon Coffee" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea rows={3} placeholder="What does the buyer get?" value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Price</label>
            <input type="number" min="0.01" step="0.01" placeholder="0.01" value={form.price_usd} onChange={e => set('price_usd', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="one-time">One-time</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Webhook URL (optional)</label>
          <input placeholder="https://your-site.com/webhook" value={form.webhook_url} onChange={e => set('webhook_url', e.target.value)} />
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--error)' }}>{error}</div>}

        <button className="btn btn-primary" style={{ justifyContent: 'center', padding: 14, fontSize: 15 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Item'}
        </button>
      </div>
    </div>
  )
}
