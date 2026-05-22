import React, { useState } from 'react'
import { useUGFModal } from '@tychilabs/react-ugf'
import { ethers } from 'ethers'
import { useWallet } from '../hooks/useWallet.jsx'
import { Link } from 'react-router-dom'
import api from '../utils/api'

/**
 * Badge / Certificate Minting — Minting track
 *
 * Mints an on-chain badge (ERC-721 via a simple mint call).
 * Gas is paid in TYI Mock USD via UGF — user never needs ETH.
 *
 * Contract: deploy BadgeMinter.sol to Base Sepolia (see /contracts/).
 * Set VITE_BADGE_CONTRACT in frontend .env after deploy.
 */

const BADGE_CONTRACT = import.meta.env.VITE_BADGE_CONTRACT || null

const BADGES = [
  { id: 'pioneer',     emoji: '🚀', name: 'GasFree Pioneer',    desc: 'First gasless tx on GasFree Pay',  color: '#7c6dfa' },
  { id: 'merchant',    emoji: '🛍️', name: 'Verified Merchant',  desc: 'Listed a product on the platform', color: '#2dd4bf' },
  { id: 'contributor', emoji: '⭐', name: 'Top Contributor',    desc: 'Completed 5+ transactions',        color: '#f59e0b' },
  { id: 'builder',     emoji: '🔧', name: 'Hackathon Builder',  desc: 'Built on UGF testnet',             color: '#22c55e' },
]

// Minimal ERC-721 mint ABI
const MINT_ABI = ['function mint(address to, string calldata badgeId) returns (uint256)']

export default function BadgeMint() {
  const { address, connect, signer } = useWallet()
  const { openUGF } = useUGFModal()
  const [selected, setSelected] = useState(null)
  const [tyi, setTyi] = useState(null)
  const [minting, setMinting] = useState(false)
  const [done, setDone] = useState(null) // { txHash, badge }
  const [error, setError] = useState(null)

  React.useEffect(() => {
    if (address) api.get('/faucet/balance').then(r => setTyi(parseFloat(r.data.tyi))).catch(() => {})
  }, [address])

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
        // Demo mode — no contract deployed yet, simulate with a TYI transfer of 0
        // In production: deploy BadgeMinter.sol and set VITE_BADGE_CONTRACT
        throw new Error('Badge contract not deployed. Set VITE_BADGE_CONTRACT in .env after deploying BadgeMinter.sol')
      }

      const iface = new ethers.Interface(MINT_ABI)
      const data = iface.encodeFunctionData('mint', [await activeSigner.getAddress(), badge.id])

      // react-ugf: one call handles quote → settle → sponsorAndExecute
      const result = await openUGF({
        signer: activeSigner,
        tx: { to: BADGE_CONTRACT, data, value: 0n },
        destChainId: '84532'
      })

      setDone({ txHash: result.userTxHash, badge })
    } catch (e) {
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
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="tag tag-purple" style={{ marginBottom: 12 }}>Minting Track · UGF Testnet</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Claim Your Badge
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 500 }}>
          Mint on-chain badges on Base Sepolia. Gas is paid in TYI Mock USD — you never need ETH.
          Powered by UGF's <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--border)', padding: '1px 6px', borderRadius: 4 }}>sponsorAndExecute</code>.
        </p>
      </div>

      {/* No funds warning */}
      {address && tyi === 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontSize: 13, color: 'var(--gold)' }}>⚠ You need TYI Mock USD to mint</span>
          <Link to="/onboard" className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px', whiteSpace: 'nowrap' }}>Get funds →</Link>
        </div>
      )}

      {/* Success */}
      {done && (
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 12, padding: '24px', marginBottom: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{done.badge.emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{done.badge.name} minted!</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>On-chain badge confirmed on Base Sepolia</div>
          <a href={`https://sepolia.basescan.org/tx/${done.txHash}`} target="_blank" rel="noopener"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent2)' }}>
            View tx on BaseScan ↗
          </a>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => setDone(null)}>Mint another</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {/* Badge grid */}
      {!done && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
          {BADGES.map(badge => (
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
                  ERC-721
                </span>
                <span>Base Sepolia</span>
                <span style={{ marginLeft: 'auto', color: 'var(--success)' }}>⚡ Gas-free</span>
              </div>

              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', background: badge.color, opacity: (tyi === 0 || minting) ? 0.5 : 1 }}
                onClick={() => handleMint(badge)}
                disabled={!address || tyi === 0 || !!minting}
              >
                {minting === badge.id ? 'Minting…' : !address ? 'Connect wallet first' : tyi === 0 ? 'Need TYI funds' : 'Mint Badge'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="card" style={{ marginTop: 32, fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>How minting works</div>
        <div>1. Click Mint → <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>react-ugf</code> opens payment modal</div>
        <div>2. Modal quotes TYI cost → you approve</div>
        <div>3. UGF settles TYI, sponsors Base Sepolia ETH for gas</div>
        <div>4. <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>sponsorAndExecute</code> calls <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>mint()</code> on-chain</div>
        <div>5. Badge NFT lands in your wallet — no ETH ever needed</div>
      </div>

      {/* Contract note */}
      {!BADGE_CONTRACT && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(124,109,250,0.06)', border: '1px solid rgba(124,109,250,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          Deploy <code>BadgeMinter.sol</code> to Base Sepolia → set <code>VITE_BADGE_CONTRACT=0x...</code> in frontend .env
        </div>
      )}
    </div>
  )
}
