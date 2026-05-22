const router = require('express').Router()
const pool = require('../db/pool')
const ugf = require('../services/ugf')
const authMiddleware = require('../middleware/auth')
const axios = require('axios')

// GET /api/payment/quote?productId=X&payer=0x...
router.get('/quote', async (req, res) => {
  try {
    const { productId, payer } = req.query
    if (!productId || !payer) return res.status(400).json({ error: 'productId and payer required' })

    const { rows: [product] } = await pool.query(
      `SELECT p.*, m.wallet as merchant_wallet FROM products p
       JOIN merchants m ON m.id = p.merchant_id
       WHERE p.id = $1 AND p.active = true`, [productId]
    )
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const quote = await ugf.getQuote({
      payer,
      recipient: product.merchant_wallet,
      amountUSD: product.price_usd
    })

    // Cache quote
    await pool.query(
      `INSERT INTO quotes_cache (digest, product_id, payer, ugf_quote, expires_at)
       VALUES ($1, $2, $3, $4, to_timestamp($5))
       ON CONFLICT (digest) DO NOTHING`,
      [quote.digest, productId, payer.toLowerCase(), JSON.stringify(quote), quote.expiresAt]
    )

    res.json(quote)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/payment/settle
router.post('/settle', async (req, res) => {
  try {
    const { digest, signature, payer } = req.body
    if (!digest || !signature || !payer) return res.status(400).json({ error: 'digest, signature, payer required' })

    const { rows: [cached] } = await pool.query('SELECT * FROM quotes_cache WHERE digest = $1', [digest])
    if (!cached) return res.status(404).json({ error: 'Quote not found or expired' })

    const { rows: [product] } = await pool.query(
      `SELECT p.*, m.wallet as merchant_wallet, m.webhook_url, m.id as merchant_id
       FROM products p JOIN merchants m ON m.id = p.merchant_id WHERE p.id = $1`,
      [cached.product_id]
    )

    // Create pending transaction
    const { rows: [tx] } = await pool.query(
      `INSERT INTO transactions (payer, merchant_id, product_id, product_name, amount_usd, digest, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
      [payer.toLowerCase(), product.merchant_id, product.id, product.name, product.price_usd, digest]
    )

    // Execute on-chain via UGF (async-friendly but kept sync here for simplicity)
    const { txHash } = await ugf.executePayment({
      digest, signature, payer,
      recipient: product.merchant_wallet,
      amountUSD: product.price_usd,
      quote: cached.ugf_quote
    })

    // Update transaction
    await pool.query(
      `UPDATE transactions SET status = 'confirmed', tx_hash = $1 WHERE id = $2`,
      [txHash, tx.id]
    )

    // Fire merchant webhook (non-blocking)
    if (product.webhook_url) {
      axios.post(product.webhook_url, {
        event: 'payment.confirmed',
        txHash,
        payer,
        product: { id: product.id, name: product.name },
        amount_usd: product.price_usd
      }).catch(e => console.error('Webhook failed:', e.message))
    }

    res.json({ txHash, status: 'confirmed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/payment/status/:digest
router.get('/status/:digest', async (req, res) => {
  try {
    const { rows: [tx] } = await pool.query(
      'SELECT status, tx_hash FROM transactions WHERE digest = $1', [req.params.digest]
    )
    if (!tx) return res.status(404).json({ error: 'Not found' })
    res.json(tx)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/payment/history — requires auth
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, p.name as product_name FROM transactions t
       LEFT JOIN products p ON p.id = t.product_id
       WHERE t.payer = $1 ORDER BY t.created_at DESC LIMIT 50`,
      [req.user.address]
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})


// POST /api/payment/record
// Called after react-ugf completes execution — just saves the confirmed tx
router.post('/record', authMiddleware, async (req, res) => {
  try {
    const { productId, payer, txHash } = req.body
    const { rows: [product] } = await pool.query(
      `SELECT p.*, m.id as merchant_id FROM products p
       JOIN merchants m ON m.id = p.merchant_id WHERE p.id = $1`, [productId]
    )
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const { rows: [tx] } = await pool.query(
      `INSERT INTO transactions (payer, merchant_id, product_id, product_name, amount_usd, tx_hash, status)
       VALUES ($1,$2,$3,$4,$5,$6,'confirmed') RETURNING *`,
      [payer.toLowerCase(), product.merchant_id, product.id, product.name, product.price_usd, txHash]
    )

    // Fire webhook if merchant has one
    const { rows: [merchant] } = await pool.query('SELECT webhook_url FROM merchants WHERE id=$1', [product.merchant_id])
    if (merchant?.webhook_url) {
      const axios = require('axios')
      axios.post(merchant.webhook_url, {
        event: 'payment.confirmed', txHash, payer,
        product: { id: product.id, name: product.name },
        amount_usd: product.price_usd
      }).catch(e => console.error('Webhook failed:', e.message))
    }

    res.json(tx)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
