const router = require('express').Router()
const jwt = require('jsonwebtoken')
const { ethers } = require('ethers')
const pool = require('../db/pool')
const { v4: uuid } = require('uuid')

// GET or create nonce for address
router.post('/nonce', async (req, res) => {
  try {
    const { address } = req.body
    if (!address) return res.status(400).json({ error: 'address required' })
    const addr = address.toLowerCase()
    const nonce = uuid()
    await pool.query(
      `INSERT INTO users (address, nonce) VALUES ($1, $2)
       ON CONFLICT (address) DO UPDATE SET nonce = $2`,
      [addr, nonce]
    )
    res.json({ nonce })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Verify signature and issue JWT
router.post('/login', async (req, res) => {
  try {
    const { address, signature } = req.body
    if (!address || !signature) return res.status(400).json({ error: 'address and signature required' })
    const addr = address.toLowerCase()

    const { rows } = await pool.query('SELECT nonce FROM users WHERE address = $1', [addr])
    if (!rows.length) return res.status(404).json({ error: 'User not found. Get nonce first.' })

    const { nonce } = rows[0]
    const message = `Sign in to GasFree Pay\nNonce: ${nonce}`
    const recovered = ethers.verifyMessage(message, signature).toLowerCase()

    if (recovered !== addr) return res.status(401).json({ error: 'Invalid signature' })

    // Rotate nonce
    await pool.query('UPDATE users SET nonce = $1 WHERE address = $2', [uuid(), addr])

    const token = jwt.sign({ address: addr }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
