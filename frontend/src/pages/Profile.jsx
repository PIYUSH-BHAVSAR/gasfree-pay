import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useWallet } from '../hooks/useWallet.jsx'

const TYI_ADDRESS = import.meta.env.VITE_TYI_ADDRESS || '0x27DC1C167AeF232bb1e21073304B526726a8727e'

export default function Profile() {
  const { address, connect } = useWallet()
  const [balance, setBalance] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/faucet/balance'),
      api.get('/payment/history').catch(() => ({ data: [] }))
    ])
      .then(([bal, txs]) => {
        setBalance(bal.data)
        setHistory(txs.data)
      })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [address])

  const short = value => value ? `${value.slice(0, 8)}...${value.slice(-6)}` : ''
  const credits = balance ? Number(balance.tyi) : 0
  const ready = credits >= 0.01

  if (!address) {
    return (
      <div style={{ maxWidth: 560, margin: '36px auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Account</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Sign in to see your test credits and claim readiness.
          </p>
          <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={connect}>Sign in</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Account</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{short(address)}</p>
        </div>
        <span className={`tag ${ready ? 'tag-green' : 'tag-yellow'}`}>
          {ready ? 'Ready to claim' : 'Add credits'}
        </span>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.35)', color: 'var(--error)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Metric label="Account Credits" value={loading ? 'Loading...' : `$${balance?.tyi ?? '0.00'}`} tone="green" />
        <Metric label="Receipts" value={`${history.length}`} tone="gold" />
        <Metric label="Advanced ETH Balance" value={loading ? 'Loading...' : `${balance?.eth ?? '0.000000'} ETH`} tone="purple" />
      </div>

      <div className="card" style={{ display: 'grid', gap: 14 }}>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>How to demo safely</div>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
            Use one claim or the $0.01 checkout item for the live demo. Browsing pages and creating checkout items do not spend credits.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/mint">Claim Badge</Link>
          <Link className="btn btn-outline" to="/history">View Receipts</Link>
          <a className="btn btn-outline" href={`https://sepolia.basescan.org/address/${address}`} target="_blank" rel="noopener">Advanced proof</a>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Advanced details</div>
        <Row label="Account" value={address} />
        <Row label="Credit token" value={TYI_ADDRESS} />
        <Row label="Test network" value="Base Sepolia, chain 84532" />
      </div>
    </div>
  )
}

function Metric({ label, value, tone }) {
  const colors = {
    green: 'var(--accent2)',
    purple: 'var(--accent)',
    gold: 'var(--gold)'
  }

  return (
    <div className="card">
      <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ color: colors[tone], fontFamily: 'var(--font-mono)', fontSize: 22 }}>{value}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}
