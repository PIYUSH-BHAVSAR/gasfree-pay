const router = require('express').Router()
const pool = require('../db/pool')

// Public: list all active products
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, m.business_name FROM products p
       JOIN merchants m ON m.id = p.merchant_id
       WHERE p.active = true ORDER BY p.created_at DESC LIMIT 50`
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Public: get single product
router.get('/:id', async (req, res) => {
  try {
    const { rows: [p] } = await pool.query(
      `SELECT p.*, m.business_name, m.wallet as merchant_wallet FROM products p
       JOIN merchants m ON m.id = p.merchant_id WHERE p.id = $1 AND p.active = true`,
      [req.params.id]
    )
    if (!p) return res.status(404).json({ error: 'Product not found' })
    res.json(p)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
