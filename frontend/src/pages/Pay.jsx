import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUGFModal } from '@tychilabs/react-ugf'
import { ethers } from 'ethers'
import api from '../utils/api'
import { useWallet } from '../hooks/useWallet.jsx'

const TYI_ADDRESS = import.meta.env.VITE_TYI_ADDRESS || '0x27DC1C167AeF232bb1e21073304B526726a8727e'

export default function Pay() {
  const { productId } = useParams()
  const { address, connect, signer } = useWallet()
  const navigate = useNavigate()
  const { openUGF, result } = useUGFModal()

  const [product, setProduct] = useState(null)
  const [credits, setCredits] = useState(null)
  const [step, setStep] = useState('idle')
  const [txHash, setTxHash] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pendingRecord, setPendingRecord] = useState(false)

  useEffect(() => {
    api.get(`/products/${productId}`).then(r => setProduct(r.data)).catch(() => setError('Item not found'))
  }, [productId])

  useEffect(() => {
    if (address) api.get('/faucet/balance').then(r => setCredits(parseFloat(r.data.tyi))).catch(() => {})
  }, [address])

  useEffect(() => {
    if (!pendingRecord || !result?.txHash || !address) return
    api.post('/payment/record', {
      productId,
      payer: address,
      txHash: result.txHash
    }).catch(() => {})

    setTxHash(result.txHash)
    setStep('done')
    setPendingRecord(false)
    setLoading(false)
  }, [result, pendingRecord, address, productId])

  const handlePay = async () => {
    try {
      setError(null)
      let activeSigner = signer
      let payer = address
      if (!address) {
        const r = await connect()
        activeSigner = r.signer
        payer = r.address
      }

      setLoading(true)

      const amount = BigInt(Math.round(parseFloat(product.price_usd) * 1e6))
      const iface = new ethers.Interface(['function transfer(address,uint256) returns (bool)'])
      const data = iface.encodeFunctionData('transfer', [product.merchant_wallet, amount])

      setPendingRecord(true)
      await openUGF({
        signer: activeSigner,
        tx: {
          to: TYI_ADDRESS,
          data,
          value: 0n
        },
        destChainId: '84532'
      })
    } catch (e) {
      setPendingRecord(false)
      if (e?.code === 'USER_REJECTED' || e?.message?.includes('rejected')) {
        setError('Payment cancelled.')
      } else {
        setError(e.message)
      }
      setStep('idle')
      setLoading(false)
    }
  }

  if (!product) return <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <button className="btn btn-ghost" style={{ marginBottom: 24, fontSize: 13 }} onClick={() => navigate(-1)}>Back</button>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <span className={`tag ${product.type === 'subscription' ? 'tag-yellow' : 'tag-green'}`} style={{ marginBottom: 8 }}>
              {product.type}
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{product.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{product.description}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--accent2)' }}>
              ${product.price_usd}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>test credits</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.2)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'center', fontSize: 13
        }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>No ETH needed.</span>
            <span style={{ color: 'var(--muted)', marginLeft: 6 }}>UGF completes the onchain part behind the scenes.</span>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--error)' }}>
            {error}
          </div>
        )}

        {step === 'done' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Payment complete</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
              <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener" style={{ color: 'var(--accent2)' }}>
                View receipt proof
              </a>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/')}>Back to Claim</button>
          </div>
        ) : credits === 0 ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>Add test credits to continue.</p>
            <Link to="/onboard" className="btn btn-primary" style={{ justifyContent: 'center' }}>Add credits</Link>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? 'Opening payment...' : `Pay $${product.price_usd}`}
          </button>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        Wallet approval keeps you in control. UGF handles the gas.
      </div>
    </div>
  )
}
