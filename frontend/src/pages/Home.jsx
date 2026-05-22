import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useWallet } from '../hooks/useWallet.jsx'

export default function Home() {
  const { address } = useWallet()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tyi, setTyi] = useState(null)

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => setProducts([])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (address) api.get('/faucet/balance').then(r => setTyi(parseFloat(r.data.tyi))).catch(() => {})
  }, [address])

  return (
    <div>
      {/* Onboarding banner — shown when connected but no TYI */}
      {address && tyi === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(124,109,250,0.12))',
          border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>⚡ You need TYI Mock USD to pay</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Lock Base Sepolia ETH inside the app — takes 30 seconds.</div>
          </div>
          <Link to="/onboard" className="btn btn-primary" style={{ whiteSpace: 'nowrap', fontSize: 13, padding: '8px 18px' }}>
            Get test funds →
          </Link>
        </div>
      )}

      {/* Hero */}
      {!address && (
        <div style={{
          textAlign: 'center', padding: '60px 20px 48px',
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(124,109,250,0.12), transparent)'
        }}>
          <div className="tag tag-purple" style={{ marginBottom: 16 }}>Powered by UGF · Base Sepolia</div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 16 }}>
            Pay in stablecoins.<br />
            <span style={{ color: 'var(--accent2)' }}>No ETH. Ever.</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Connect your wallet and get test funds — then pay for anything in one click.
          </p>
          <Link to="/onboard" className="btn btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>Start here →</Link>
        </div>
      )}

      {/* Products */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Featured Products</h2>
          {address && tyi !== null && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Wallet balance: <span style={{ color: 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>{tyi.toFixed(2)} TYI</span>
            </div>
          )}
        </div>
        <Link to="/merchant/products/new" className="btn btn-outline" style={{ fontSize: 13, padding: '6px 14px' }}>+ List a product</Link>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛍️</div>
          <p>No products yet. <Link to="/merchant/products/new" style={{ color: 'var(--accent)' }}>Create one →</Link></p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {products.map(p => <ProductCard key={p.id} product={p} tyi={tyi} />)}
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, tyi }) {
  const price = Number(product.price_usd)
  const hasFunds = tyi === null || tyi >= price

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
          Need {price.toFixed(2)} TYI
        </Link>
      ) : (
        <Link to={`/pay/${product.id}`} className="btn btn-primary" style={{ marginTop: 'auto', justifyContent: 'center' }}>
          Pay ${product.price_usd} Mock USD
        </Link>
      )}
    </div>
  )
}
