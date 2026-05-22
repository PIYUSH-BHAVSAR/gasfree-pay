import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import { useWallet } from '../hooks/useWallet.jsx'

export default function MerchantDashboard() {
  const { address } = useWallet()
  const [data, setData] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) { setLoading(false); return }
    Promise.all([
      api.get('/merchants/me/analytics'),
      api.get('/merchants/me/products')
    ]).then(([a, p]) => {
      setData(a.data)
      setProducts(p.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [address])

  if (!address) return (
    <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
      Sign in to access the creator dashboard.
    </div>
  )

  if (loading) return <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>

  const stats = [
    { label: 'Total Revenue', value: `$${data?.total_revenue || '0.00'}`, color: 'var(--accent2)' },
    { label: 'Receipts', value: data?.tx_count || 0, color: 'var(--accent)' },
    { label: 'Checkout Items', value: products.length, color: 'var(--gold)' },
    { label: 'Pending Payout', value: `$${data?.pending_payout || '0.00'}`, color: 'var(--success)' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Creator Dashboard</h2>
        <Link to="/merchant/products/new" className="btn btn-primary">+ New Item</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {data?.daily && data.daily.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue (Last 30 days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.daily}>
              <XAxis dataKey="date" tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checkout Items</h3>
        {products.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No items yet. <Link to="/merchant/products/new" style={{ color: 'var(--accent)' }}>Create your first</Link></p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <span className={`tag ${p.type === 'subscription' ? 'tag-yellow' : 'tag-green'}`} style={{ marginTop: 4 }}>{p.type}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent2)' }}>${p.price_usd}</span>
                  <Link to={`/pay/${p.id}`} className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 12 }}>Checkout link</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
