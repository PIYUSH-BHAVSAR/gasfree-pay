import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { useWallet } from '../hooks/useWallet.jsx'

// Standalone embeddable widget — loaded via <iframe src="/widget?productId=X">
export default function Widget() {
  const [params] = useSearchParams()
  const productId = params.get('productId')
  const { address, connect, signTypedData } = useWallet()
  const [product, setProduct] = useState(null)
  const [step, setStep] = useState('idle')
  const [txHash, setTxHash] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (productId) api.get(`/products/${productId}`).then(r => setProduct(r.data)).catch(() => setError('Product not found'))
  }, [productId])

  const handlePay = async () => {
    try {
      setError(null)
      let addr = address
      if (!addr) { const r = await connect(); addr = r.address }
      setStep('quote')
      const { data: q } = await api.get(`/payment/quote?productId=${productId}&payer=${addr}`)
      setStep('sign')
      const sig = await signTypedData(q.domain, q.types, q.value)
      setStep('settle')
      const { data: result } = await api.post('/payment/settle', { digest: q.digest, signature: sig, payer: addr })
      setTxHash(result.txHash)
      setStep('done')
      window.parent?.postMessage({ type: 'gasfree_payment_success', txHash: result.txHash }, '*')
    } catch (e) {
      setError(e.response?.data?.error || e.message)
      setStep('idle')
    }
  }

  const stepMsg = { idle: null, quote: 'Getting quote…', sign: 'Sign in wallet…', settle: 'Confirming…' }

  return (
    <div style={{ fontFamily: 'var(--font-display)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, maxWidth: 320, color: 'var(--text)' }}>
      <style>{`:root{--bg:#0a0a0f;--surface:#111118;--border:#1e1e2e;--accent:#7c6dfa;--accent2:#2dd4bf;--text:#e8e8f0;--muted:#6b6b80;--success:#22c55e;--error:#ef4444;--font-display:'Syne',sans-serif;--font-mono:'DM Mono',monospace}`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono&display=swap" rel="stylesheet" />

      {!product ? <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{error || 'Loading…'}</div> : step === 'done' ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 8 }}>Payment Confirmed!</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{txHash?.slice(0,20)}…</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{product.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent2)', fontWeight: 500 }}>${product.price_usd}</span>
          </div>
          {stepMsg[step] && <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>{stepMsg[step]}</div>}
          {error && <div style={{ fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{error}</div>}
          <button onClick={handlePay} disabled={step !== 'idle'} style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, cursor: step === 'idle' ? 'pointer' : 'not-allowed', opacity: step !== 'idle' ? 0.7 : 1 }}>
            {step === 'idle' ? `Pay $${product.price_usd} Mock USD` : 'Processing…'}
          </button>
          <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 8, fontFamily: 'var(--font-mono)' }}>No ETH required · Gas sponsored</div>
        </>
      )}
    </div>
  )
}
