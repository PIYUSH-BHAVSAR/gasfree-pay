/**
 * In-app faucet — mirrors UGF faucet exactly
 * Docs: https://universalgasframework.com/faucets
 *
 * UGF faucet flow (3 steps):
 *   1. MetaMask signs gateway login (wallet auth)
 *   2. Backend quotes TYI per ETH using live pricing
 *   3. User sends ETH to receiver → UGF verifies → mints TYI to user
 *
 * Our in-app replication:
 *   GET  /api/faucet/balance  — read on-chain TYI + ETH balance
 *   GET  /api/faucet/quote    — quote TYI per ETH amount
 *   POST /api/faucet/confirm  — verify ETH tx on-chain → transfer TYI to user
 */

const router = require('express').Router()
const { ethers } = require('ethers')
const authMiddleware = require('../middleware/auth')

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org'
const TYI_ADDRESS = process.env.UGF_TOKEN_ADDRESS || '0x27DC1C167AeF232bb1e21073304B526726a8727e'
const provider = new ethers.JsonRpcProvider(RPC_URL)

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)'
]

// Fixed testnet rate — UGF faucet uses live pricing; we use 3000 for testnet
const ETH_TO_TYI_RATE = 3000

// GET /api/faucet/balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const address = req.query.address || req.user.address
    const token = new ethers.Contract(TYI_ADDRESS, ERC20_ABI, provider)
    const [tyiBal, ethBal] = await Promise.all([
      token.balanceOf(address),
      provider.getBalance(address)
    ])
    res.json({
      tyi: (Number(tyiBal) / 1e6).toFixed(2),
      eth: (Number(ethBal) / 1e18).toFixed(6),
      address
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/faucet/quote?amount=0.001
// Matches UGF faucet step 2: backend quotes TYI per ETH
router.get('/quote', authMiddleware, async (req, res) => {
  try {
    if (!process.env.UGF_SPONSOR_PRIVATE_KEY)
      return res.status(500).json({ error: 'Sponsor wallet not configured' })

    const ethAmount = parseFloat(req.query.amount || '0.001')
    if (isNaN(ethAmount) || ethAmount <= 0)
      return res.status(400).json({ error: 'Invalid amount' })

    const tyiOut = (ethAmount * ETH_TO_TYI_RATE).toFixed(2)
    const receiverAddress = new ethers.Wallet(process.env.UGF_SPONSOR_PRIVATE_KEY).address

    res.json({
      eth_in: ethAmount.toFixed(6),
      tyi_out: tyiOut,
      rate: ETH_TO_TYI_RATE,
      receiver: receiverAddress  // user sends ETH here (matches UGF faucet "receiver")
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/faucet/confirm
// Matches UGF faucet step 3: verify ETH tx → mint TYI to user
// Body: { txHash, payer }
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { txHash, payer } = req.body
    if (!txHash || !payer)
      return res.status(400).json({ error: 'txHash and payer required' })

    if (!process.env.UGF_SPONSOR_PRIVATE_KEY)
      return res.status(500).json({ error: 'Sponsor wallet not configured' })

    const sponsorWallet = new ethers.Wallet(process.env.UGF_SPONSOR_PRIVATE_KEY, provider)
    const token = new ethers.Contract(TYI_ADDRESS, ERC20_ABI, sponsorWallet)

    // Verify ETH tx on-chain
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt)
      return res.status(400).json({ error: 'Transaction not found. Wait for confirmation and retry.' })
    if (receipt.status === 0)
      return res.status(400).json({ error: 'Transaction failed on-chain.' })

    const tx = await provider.getTransaction(txHash)
    if (!tx)
      return res.status(400).json({ error: 'Transaction not found.' })

    // Verify ETH was sent to sponsor (receiver) address
    if (tx.to?.toLowerCase() !== sponsorWallet.address.toLowerCase())
      return res.status(400).json({ error: 'ETH not sent to the correct receiver address.' })

    // Calculate TYI to mint based on ETH received
    const ethReceived = parseFloat(ethers.formatEther(tx.value))
    const tyiAmount = BigInt(Math.floor(ethReceived * ETH_TO_TYI_RATE * 1e6))

    // Check sponsor has enough TYI
    const sponsorBal = await token.balanceOf(sponsorWallet.address)
    if (sponsorBal < tyiAmount)
      return res.status(400).json({ error: 'Faucet is low on TYI. Contact organizers to refill.' })

    // Transfer TYI to user (mirrors UGF: "wallet mints TYI on Base Sepolia")
    const mintTx = await token.transfer(payer, tyiAmount)
    await mintTx.wait()

    res.json({
      success: true,
      tyi_received: (Number(tyiAmount) / 1e6).toFixed(2),
      eth_locked: ethReceived.toString(),
      txHash: mintTx.hash
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
