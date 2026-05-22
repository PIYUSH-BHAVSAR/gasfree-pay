import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useWallet } from '../hooks/useWallet.jsx'

export default function Home() {
  const { address } = useWallet()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(null)

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => setProducts([])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (address) api.get('/faucet/balance').then(r => setCredits(parseFloat(r.data.tyi))).catch(() => {})
  }, [address])

  return (
    <div>
      {address && credits === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(124,109,250,0.12))',
          border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Add test credits to continue</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Credits let you claim badges and pay without managing ETH gas.</div>
          </div>
          <Link to="/onboard" className="btn btn-primary" style={{ whiteSpace: 'nowrap', fontSize: 13, padding: '8px 18px' }}>
            Add credits
          </Link>
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: 24,
        alignItems: 'center', marginBottom: 34
      }}>
        <div>
          <div className="tag tag-purple" style={{ marginBottom: 16 }}>No ETH needed</div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,62px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Claim your badge like a normal app.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 560, lineHeight: 1.65, marginBottom: 24 }}>
            GasFree Pay turns an onchain badge claim into a simple checkout-style action. You use test credits, and UGF handles the blockchain execution behind the scenes.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/mint" className="btn btn-primary" style={{ fontSize: 15, padding: '12px 24px' }}>Claim Badge</Link>
            <Link to="/profile" className="btn btn-outline" style={{ fontSize: 15, padding: '12px 24px' }}>Check Account</Link>
          </div>
        </div>

        <div className="card" style={{ display: 'grid', gap: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>What changed?</div>
          <CompareRow label="Old Web3" text="User needs ETH first, estimates gas, and gets stuck when the wallet is empty." tone="red" />
          <CompareRow label="GasFree Pay" text="User signs in, uses test credits, clicks Claim, and UGF completes the action." tone="green" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Simple Checkout Items</h2>
          {address && credits !== null && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Account credits: <span style={{ color: 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>${credits.toFixed(2)}</span>
            </div>
          )}
        </div>
        <Link to="/merchant/products/new" className="btn btn-outline" style={{ fontSize: 13, padding: '6px 14px' }}>Create item</Link>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
          <p>No items yet. <Link to="/merchant/products/new" style={{ color: 'var(--accent)' }}>Create one</Link></p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {products.map(p => <ProductCard key={p.id} product={p} credits={credits} />)}
        </div>
      )}
    </div>
  )
}

function CompareRow({ label, text, tone }) {
  const color = tone === 'green' ? 'var(--success)' : 'var(--error)'
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, background: 'rgba(255,255,255,0.015)' }}>
      <div style={{ color, fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>{text}</div>
    </div>
  )
}

function ProductCard({ product, credits }) {
  const price = Number(product.price_usd)
  const hasFunds = credits === null || credits >= price

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className={`tag ${product.type === 'subscription' ? 'tag-yellow' : 'tag-green'}`}>{product.type}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: 'var(--accent2)' }}>${product.price_usd}</span>
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{product.name}</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>{product.description}</p>
      </div>
      {hasFunds === false ? (
        <Link to="/onboard" className="btn btn-outline" style={{ marginTop: 'auto', justifyContent: 'center', fontSize: 13 }}>
          Add credits
        </Link>
      ) : (
        <Link to={`/pay/${product.id}`} className="btn btn-primary" style={{ marginTop: 'auto', justifyContent: 'center' }}>
          Pay ${product.price_usd}
        </Link>
      )}
    </div>
  )
}
