import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import { useWallet } from '../hooks/useWallet.jsx'

export default function History() {
  const { address } = useWallet()
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) { setLoading(false); return }
    api.get('/payment/history').then(r => setTxns(r.data)).catch(() => setTxns([])).finally(() => setLoading(false))
  }, [address])

  if (!address) return (
    <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
      Connect your wallet to view transaction history.
    </div>
  )

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Transaction History</h2>
      {loading ? <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
        : txns.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>No transactions yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {txns.map(tx => (
              <div key={tx.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.product_name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                    {new Date(tx.created_at).toLocaleString()}
                    {tx.tx_hash && <> · <a href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`} target="_blank" rel="noopener" style={{ color: 'var(--accent2)' }}>View tx ↗</a></>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent2)', fontWeight: 500 }}>${tx.amount_usd}</span>
                  <span className={`tag ${tx.status === 'confirmed' ? 'tag-green' : tx.status === 'pending' ? 'tag-yellow' : 'tag-red'}`}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
