const router = require('express').Router()
const pool = require('../db/pool')
const authMiddleware = require('../middleware/auth')

// Register merchant
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { business_name, webhook_url } = req.body
    const wallet = req.user.address
    const { rows: [m] } = await pool.query(
      `INSERT INTO merchants (wallet, business_name, webhook_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (wallet) DO UPDATE SET business_name = COALESCE($2, merchants.business_name), webhook_url = COALESCE($3, merchants.webhook_url)
       RETURNING *`,
      [wallet, business_name, webhook_url]
    )
    res.json(m)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get current merchant
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows: [m] } = await pool.query('SELECT * FROM merchants WHERE wallet = $1', [req.user.address])
    if (!m) return res.status(404).json({ error: 'Not a merchant' })
    res.json(m)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// List merchant's products
router.get('/me/products', authMiddleware, async (req, res) => {
  try {
    const { rows: [m] } = await pool.query('SELECT id FROM merchants WHERE wallet = $1', [req.user.address])
    if (!m) return res.json([])
    const { rows } = await pool.query('SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC', [m.id])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Create product
router.post('/me/products', authMiddleware, async (req, res) => {
  try {
    let { rows: [m] } = await pool.query('SELECT id FROM merchants WHERE wallet = $1', [req.user.address])
    if (!m) {
      const r = await pool.query('INSERT INTO merchants (wallet, business_name) VALUES ($1,$1) RETURNING *', [req.user.address])
      m = r.rows[0]
    }
    const { name, description, price_usd, type, webhook_url } = req.body
    if (!name || !price_usd) return res.status(400).json({ error: 'name and price_usd required' })
    const { rows: [p] } = await pool.query(
      `INSERT INTO products (merchant_id, name, description, price_usd, type)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [m.id, name, description, price_usd, type || 'one-time']
    )
    if (webhook_url) await pool.query('UPDATE merchants SET webhook_url = $1 WHERE id = $2', [webhook_url, m.id])
    res.json(p)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Analytics
router.get('/me/analytics', authMiddleware, async (req, res) => {
  try {
    const { rows: [m] } = await pool.query('SELECT id FROM merchants WHERE wallet = $1', [req.user.address])
    if (!m) return res.json({ total_revenue: '0.00', tx_count: 0, pending_payout: '0.00', daily: [] })

    const [rev, daily] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount_usd),0) as total_revenue, COUNT(*) as tx_count
         FROM transactions WHERE merchant_id = $1 AND status = 'confirmed'`, [m.id]
      ),
      pool.query(
        `SELECT DATE(created_at) as date, COALESCE(SUM(amount_usd),0) as revenue
         FROM transactions WHERE merchant_id = $1 AND status = 'confirmed'
         AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at) ORDER BY date ASC`, [m.id]
      )
    ])

    res.json({
      total_revenue: parseFloat(rev.rows[0].total_revenue).toFixed(2),
      tx_count: parseInt(rev.rows[0].tx_count),
      pending_payout: '0.00',
      daily: daily.rows.map(r => ({ date: r.date, revenue: parseFloat(r.revenue) }))
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
