import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet.jsx'
import { ethers } from 'ethers'
import api from '../utils/api'

export default function Onboard() {
  const { address, connect, signer, provider } = useWallet()
  const navigate = useNavigate()

  const [step, setStep] = useState('connect')
  const [ethAmount, setEthAmount] = useState('0.00005')
  const [quote, setQuote] = useState(null)
  const [ethBalance, setEthBalance] = useState(null)
  const [creditsReceived, setCreditsReceived] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [finalTxHash, setFinalTxHash] = useState(null)

  useEffect(() => {
    if (address && provider) {
      provider.getBalance(address).then(b => setEthBalance(parseFloat(ethers.formatEther(b))))
      setStep('quote')
    }
  }, [address, provider])

  useEffect(() => {
    if (step === 'quote' && address) fetchQuote()
  }, [step, ethAmount, address])

  const fetchQuote = async () => {
    try {
      const { data } = await api.get(`/faucet/quote?amount=${ethAmount}`)
      setQuote(data)
    } catch (e) { setError(e.response?.data?.error || e.message) }
  }

  const handleConnect = async () => {
    try { setError(null); await connect() }
    catch (e) { setError(e.message) }
  }

  const handleSend = async () => {
    try {
      setError(null)
      setLoading(true)
      setStep('send')

      const tx = await signer.sendTransaction({
        to: quote.receiver || quote.send_eth_to,
        value: ethers.parseEther(ethAmount)
      })

      setStep('confirm')

      const { data } = await api.post('/faucet/confirm', {
        txHash: tx.hash,
        amount: ethAmount,
        payer: address
      })

      setCreditsReceived(data.tyi_received)
      setFinalTxHash(data.txHash)
      setStep('done')
    } catch (e) {
      setError(e.response?.data?.error || e.message)
      setStep('quote')
    } finally { setLoading(false) }
  }

  const Step = ({ n, label, active, done }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--border)',
        color: done || active ? '#fff' : 'var(--muted)'
      }}>{done ? '✓' : n}</div>
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
    </div>
  )

  const isDone = step === 'done'
  const isSending = step === 'send' || step === 'confirm'

  return (
    <div style={{ maxWidth: 460, margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>💳</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Add Test Credits</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Credits let you claim and pay without managing ETH gas.</p>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Step n="1" label="Sign in" active={step === 'connect'} done={!!address} />
        <Step n="2" label="Choose credit amount" active={step === 'quote'} done={['send','confirm','done'].includes(step)} />
        <Step n="3" label="Add credits" active={isSending} done={isDone} />
      </div>

      {step === 'connect' && (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Sign in with your wallet. This keeps your account under your control.
          </p>
          {error && <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }} onClick={handleConnect}>
            Sign in
          </button>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
            New here? <a href="https://metamask.io" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Install a wallet</a>
          </p>
        </div>
      )}

      {step === 'quote' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>{address?.slice(0,8)}...{address?.slice(-4)}</span>
            <span style={{ color: ethBalance < parseFloat(ethAmount) ? 'var(--error)' : 'var(--accent2)' }}>
              advanced: {ethBalance?.toFixed(5)} ETH
            </span>
          </div>

          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            Test credit source amount
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {['0.00005', '0.00008', '0.0001'].map(v => (
              <button key={v} onClick={() => setEthAmount(v)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: ethAmount === v ? 'var(--accent)' : 'var(--border)',
                color: ethAmount === v ? '#fff' : 'var(--muted)', border: 'none', transition: 'all 0.15s'
              }}>{v}</button>
            ))}
          </div>
          <input type="number" step="0.00001" min="0.00001" value={ethAmount}
            onChange={e => setEthAmount(e.target.value)}
            style={{ marginBottom: 16 }} />

          {quote && (
            <div style={{
              background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.2)',
              borderRadius: 8, padding: 14, marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 2 }}>Test value</div>
                <div style={{ fontWeight: 600 }}>{ethAmount}</div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 18 }}>→</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right' }}>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 2 }}>Credits added</div>
                <div style={{ fontWeight: 600, color: 'var(--accent2)' }}>${quote.tyi_out}</div>
              </div>
            </div>
          )}

          {error && <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          {ethBalance !== null && ethBalance < parseFloat(ethAmount) ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 10 }}>
                Not enough test value for this amount.
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                Use the official UGF faucet if this in-app credit helper is not funded.
              </p>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }}
              onClick={handleSend} disabled={!quote || loading}>
              Add ${quote?.tyi_out} credits
            </button>
          )}
        </div>
      )}

      {isSending && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <Spinner />
          <div style={{ marginTop: 16, fontWeight: 700, fontSize: 15 }}>
            {step === 'send' ? 'Confirm in wallet' : 'Adding credits...'}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
            {step === 'send' ? 'No app gas setup required' : 'Verifying testnet credit transfer'}
          </div>
        </div>
      )}

      {isDone && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Credits added</h3>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--accent2)', margin: '12px 0' }}>
            ${creditsReceived}
          </div>
          {finalTxHash && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
              <a href={`https://sepolia.basescan.org/tx/${finalTxHash}`} target="_blank" rel="noopener" style={{ color: 'var(--accent2)' }}>
                Advanced proof
              </a>
            </div>
          )}
          <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px 32px' }} onClick={() => navigate('/')}>
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 32, height: 32, border: '3px solid rgba(124,109,250,0.2)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      margin: '0 auto', animation: 'spin 0.7s linear infinite'
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
