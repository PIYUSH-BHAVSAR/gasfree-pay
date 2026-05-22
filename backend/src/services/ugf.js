/**
 * UGF Testnet Service
 * SDK: @tychilabs/ugf-testnet-js
 * Docs: https://universalgasframework.com/docs/testnet
 * GitHub: https://github.com/TychiWallet/ugf-testnet-js
 *
 * Base Sepolia only. TYI_MOCK_USD settlement only.
 * No API key — auth is EIP-191 wallet signature.
 */

const { ethers } = require('ethers')
const { UGFClient } = require('@tychilabs/ugf-testnet-js')

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org'
const TYI_ADDRESS = process.env.UGF_TOKEN_ADDRESS || '0x27DC1C167AeF232bb1e21073304B526726a8727e'

const provider = new ethers.JsonRpcProvider(RPC_URL)

let _client = null
let _wallet = null
let _authenticated = false

async function getClient() {
  if (_client && _authenticated) return { client: _client, wallet: _wallet }

  if (!process.env.UGF_SPONSOR_PRIVATE_KEY)
    throw new Error('UGF_SPONSOR_PRIVATE_KEY not set in .env')

  // Sponsor wallet authenticates with UGF gateway
  _wallet = new ethers.Wallet(process.env.UGF_SPONSOR_PRIVATE_KEY, provider)
  _client = new UGFClient()

  // auth.login signs EIP-191 message → JWT returned by gateway
  await _client.auth.login(_wallet)
  _authenticated = true
  console.log('[UGF] Authenticated:', _wallet.address)

  return { client: _client, wallet: _wallet }
}

/**
 * Get quote for a TYI transfer to merchant.
 * quote.get() defaults to Base Sepolia + TYI_MOCK_USD — no chain fields needed.
 */
async function getQuote({ payer, recipient, amountUSD }) {
  const { client } = await getClient()

  const iface = new ethers.Interface(['function transfer(address,uint256) returns (bool)'])
  const amount = BigInt(Math.round(parseFloat(amountUSD) * 1e6)) // TYI has 6 decimals
  const data = iface.encodeFunctionData('transfer', [recipient, amount])

  // tx_object describes the destination action UGF will execute
  const quote = await client.quote.get({
    payer_address: payer,
    tx_object: JSON.stringify({
      from: payer,
      to: TYI_ADDRESS,
      data,
      value: '0'
    })
    // payment_chain, payment_chain_type, payment_coin all default correctly
  })

  return {
    digest: quote.digest,
    domain: quote.domain,
    types: quote.types,
    value: quote.value,
    expiresAt: quote.expires_at || (Math.floor(Date.now() / 1000) + 300),
    _raw: quote
  }
}

/**
 * Execute payment — exact lifecycle from SDK docs:
 * 1. payment.x402.execute  → ERC-3009 sig → gateway pulls TYI
 * 2. chains.evm.sponsorAndExecute → UGF sponsors ETH → confirms tx
 */
async function executePayment({ digest, signature, payer, recipient, amountUSD, quote: cachedQuote }) {
  const { client, wallet } = await getClient()

  const rawQuote = cachedQuote?._raw || cachedQuote

  const iface = new ethers.Interface(['function transfer(address,uint256) returns (bool)'])
  const amount = BigInt(Math.round(parseFloat(amountUSD) * 1e6))
  const data = iface.encodeFunctionData('transfer', [recipient, amount])

  // Step 3 — Settle: ERC-3009 typed-data sig, gateway pulls TYI_MOCK_USD
  await client.payment.x402.execute({
    quote: rawQuote,
    signer: wallet,
    userSignature: signature,
    userAddress: payer
  })

  // Step 4 — Execute: sponsorAndExecute polls /status, sponsors ETH, sends tx
  // DO NOT set gasLimit, gasPrice, or type — SDK caps gas automatically
  const { userTxHash } = await client.chains.evm.sponsorAndExecute(
    digest,
    wallet,
    async () => ({
      to: TYI_ADDRESS,
      data,
      value: 0n
    })
  )

  return { txHash: userTxHash }
}

module.exports = { getQuote, executePayment }
