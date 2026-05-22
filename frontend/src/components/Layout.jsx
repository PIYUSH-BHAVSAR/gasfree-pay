import React, { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet.jsx'
import api, { authApi } from '../utils/api'

export default function Layout() {
  const { address, connect, disconnect } = useWallet()
  const [credits, setCredits] = useState(null)

  useEffect(() => {
    if (address) {
      api.get('/faucet/balance').then(r => setCredits(parseFloat(r.data.tyi).toFixed(2))).catch(() => {})
    } else {
      setCredits(null)
    }
  }, [address])

  const handleConnect = async () => {
    try {
      const { address: addr, signer } = await connect()
      const { data: { nonce } } = await authApi.post('/nonce', { address: addr })
      const sig = await signer.signMessage(`Sign in to GasFree Pay\nNonce: ${nonce}`)
      const { data: { token } } = await authApi.post('/login', { address: addr, signature: sig })
      localStorage.setItem('jwt', token)
    } catch (e) { console.error(e) }
  }

  const handleDisconnect = () => {
    localStorage.removeItem('jwt')
    disconnect()
  }

  const short = a => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : ''

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff'
          }}>G</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>GasFree Pay</span>
        </NavLink>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[['/', 'Claim'], ['/profile', 'Account'], ['/history', 'Receipts'], ['/merchant/dashboard', 'Creator']].map(([to, label]) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              background: isActive ? 'rgba(124,109,250,0.1)' : 'transparent',
              transition: 'all 0.15s'
            })}>{label}</NavLink>
          ))}

          {address ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {credits !== null && (
                <NavLink to={parseFloat(credits) === 0 ? '/onboard' : '/profile'} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: parseFloat(credits) === 0 ? 'rgba(245,158,11,0.12)' : 'rgba(45,212,191,0.1)',
                  border: `1px solid ${parseFloat(credits) === 0 ? 'rgba(245,158,11,0.3)' : 'rgba(45,212,191,0.25)'}`,
                  borderRadius: 99, padding: '4px 12px', fontSize: 12,
                  fontFamily: 'var(--font-mono)', fontWeight: 500,
                  color: parseFloat(credits) === 0 ? 'var(--gold)' : 'var(--accent2)'
                }}>
                  {parseFloat(credits) === 0 ? 'Add test credits' : `$${credits} credits`}
                </NavLink>
              )}
              <NavLink to="/profile" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{short(address)}</NavLink>
              <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }} onClick={handleDisconnect}>Sign out</button>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={handleConnect}>
              Sign in
            </button>
          )}
        </div>
      </nav>

      <main style={{ flex: 1, padding: '32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  )
}
