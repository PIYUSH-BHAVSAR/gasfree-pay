import React, { useState } from 'react'
import { useUGFModal } from '@tychilabs/react-ugf'
import { ethers } from 'ethers'
import { useWallet } from '../hooks/useWallet.jsx'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { BADGE_CONTRACT, BADGES, getClaimedBadges } from '../utils/badges'

const MINT_ABI = ['function mint(address to, string calldata badgeId) returns (uint256)']

export default function BadgeMint() {
  const { address, connect, signer, provider } = useWallet()
  const { openUGF, result } = useUGFModal()
  const [selected, setSelected] = useState(null)
  const [tyi, setTyi] = useState(null)
  const [minting, setMinting] = useState(false)
  const [pendingBadge, setPendingBadge] = useState(null)
  const [claimedBadges, setClaimedBadges] = useState([])
  const [done, setDone] = useState(null)
  const [error, setError] = useState(null)

  React.useEffect(() => {
    if (address) api.get('/faucet/balance').then(r => setTyi(parseFloat(r.data.tyi))).catch(() => {})
  }, [address])

  React.useEffect(() => {
    if (!address || !provider) {
      setClaimedBadges([])
      return
    }
    getClaimedBadges(address, provider).then(setClaimedBadges).catch(() => setClaimedBadges([]))
  }, [address, provider, done])

  React.useEffect(() => {
    if (!pendingBadge || !result?.txHash) return
    setDone({ txHash: result.txHash, badge: pendingBadge })
    setClaimedBadges(prev => prev.some(b => b.id === pendingBadge.id) ? prev : [...prev, pendingBadge])
    setPendingBadge(null)
    setMinting(null)
  }, [result, pendingBadge])

  const handleMint = async (badge) => {
    try {
      setError(null)
      setMinting(badge.id)

      let activeSigner = signer
      if (!address) {
        const r = await connect()
        activeSigner = r.signer
      }

      if (!BADGE_CONTRACT) {
        throw new Error('Badge contract not deployed. Set VITE_BADGE_CONTRACT in .env after deploying BadgeMinter.sol')
      }

      const iface = new ethers.Interface(MINT_ABI)
      const data = iface.encodeFunctionData('mint', [await activeSigner.getAddress(), badge.id])

      setPendingBadge(badge)
      await openUGF({
        signer: activeSigner,
        tx: { to: BADGE_CONTRACT, data, value: 0n },
        destChainId: '84532'
      })
    } catch (e) {
      setPendingBadge(null)
      if (e?.code === 'USER_REJECTED' || e?.message?.includes('rejected')) {
        setError('Cancelled.')
      } else {
        setError(e.message)
      }
    } finally {
      setMinting(null)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="tag tag-purple" style={{ marginBottom: 12 }}>No ETH needed</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Claim Your Badge
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 500 }}>
          Claim an achievement badge with test credits. UGF handles the onchain part behind the scenes.
        </p>
      </div>

      {address && tyi === 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontSize: 13, color: 'var(--gold)' }}>Add test credits to claim</span>
          <Link to="/onboard" className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px', whiteSpace: 'nowrap' }}>Get funds</Link>
        </div>
      )}

      {claimedBadges.length > 0 && !done && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(34,197,94,0.35)' }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Already claimed</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {claimedBadges.map(badge => (
              <span key={badge.id} className="tag tag-green">{badge.emoji} {badge.name}</span>
            ))}
          </div>
        </div>
      )}

      {done && (
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 12, padding: '24px', marginBottom: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{done.badge.emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{done.badge.name} claimed!</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>Paid with test credits. UGF handled the gas.</div>
          {done.txHash && (
            <a href={`https://sepolia.basescan.org/tx/${done.txHash}`} target="_blank" rel="noopener"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent2)' }}>
              View receipt proof
            </a>
          )}
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => setDone(null)}>Claim another</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {!done && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
          {BADGES.map(badge => {
            const claimed = claimedBadges.some(b => b.id === badge.id)
            return (
              <div key={badge.id} className="card" style={{
                display: 'flex', flexDirection: 'column', gap: 16,
                transition: 'border-color 0.2s',
                borderColor: selected === badge.id ? badge.color : 'var(--border)'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = badge.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = selected === badge.id ? badge.color : 'var(--border)'}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: `${badge.color}18`, border: `1px solid ${badge.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                  }}>{badge.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{badge.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{badge.desc}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ background: 'rgba(45,212,191,0.1)', color: 'var(--accent2)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                    Badge
                  </span>
                  <span>No ETH needed</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--success)' }}>Credit paid</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ justifyContent: 'center', background: claimed ? 'var(--border)' : badge.color, opacity: (tyi === 0 || minting || claimed) ? 0.55 : 1 }}
                  onClick={() => handleMint(badge)}
                  disabled={!address || tyi === 0 || !!minting || claimed}
                >
                  {claimed ? 'Already Claimed' : minting === badge.id ? 'Claiming...' : !address ? 'Sign in first' : tyi === 0 ? 'Add credits' : 'Claim Badge'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="card" style={{ marginTop: 32, fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Behind the scenes</div>
        <div>1. You click Claim Badge.</div>
        <div>2. Your wallet asks for approval so you stay in control.</div>
        <div>3. UGF uses test credits, handles gas, and completes the claim.</div>
        <div>4. The badge is recorded on Base Sepolia.</div>
        <div>5. You get a receipt/proof link after completion.</div>
      </div>

      {!BADGE_CONTRACT && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(124,109,250,0.06)', border: '1px solid rgba(124,109,250,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          Deploy <code>BadgeMinter.sol</code> to Base Sepolia, then set <code>VITE_BADGE_CONTRACT</code> in frontend .env
        </div>
      )}
    </div>
  )
}
