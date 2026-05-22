import React, { createContext, useContext, useState, useCallback } from 'react'
import { BrowserProvider } from 'ethers'

const WalletCtx = createContext(null)

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error('No wallet found. Install MetaMask.')
    const p = new BrowserProvider(window.ethereum)
    await p.send('eth_requestAccounts', [])
    // Switch to Base Sepolia
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }] // Base Sepolia = 84532
      })
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x14a34',
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
          }]
        })
      }
    }
    const s = await p.getSigner()
    const addr = await s.getAddress()
    setProvider(p)
    setSigner(s)
    setAddress(addr)
    return { address: addr, signer: s }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setProvider(null)
    setSigner(null)
  }, [])

  const signTypedData = useCallback(async (domain, types, value) => {
    if (!signer) throw new Error('Wallet not connected')
    return signer.signTypedData(domain, types, value)
  }, [signer])

  return (
    <WalletCtx.Provider value={{ address, provider, signer, connect, disconnect, signTypedData }}>
      {children}
    </WalletCtx.Provider>
  )
}

export function useWallet() {
  return useContext(WalletCtx)
}
