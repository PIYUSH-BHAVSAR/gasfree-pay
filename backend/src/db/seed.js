require('dotenv').config()
const pool = require('./pool')

const DEMO_MERCHANT_WALLET = '0xa73588a17d65a265f2fba8a90441f31f54ab6e16'

const products = [
  {
    name: 'Hackathon Coffee',
    description: 'A tiny UGF checkout demo product. Use this for the final live payment test.',
    price_usd: '0.01',
    type: 'one-time'
  },
  {
    name: 'Builder Badge Tip',
    description: 'A small donation-style payment for testing the gasless checkout flow.',
    price_usd: '0.02',
    type: 'one-time'
  },
  {
    name: 'Creator Pass',
    description: 'Demo subscription item for the merchant dashboard and product listing.',
    price_usd: '0.05',
    type: 'subscription'
  }
]

async function seed() {
  const { rows: [merchant] } = await pool.query(
    `INSERT INTO merchants (wallet, business_name)
     VALUES ($1, $2)
     ON CONFLICT (wallet) DO UPDATE SET business_name = EXCLUDED.business_name
     RETURNING id`,
    [DEMO_MERCHANT_WALLET, 'GasFree Demo Merchant']
  )

  for (const product of products) {
    await pool.query(
      `INSERT INTO products (merchant_id, name, description, price_usd, type)
       SELECT $1, $2, $3, $4, $5
       WHERE NOT EXISTS (
         SELECT 1 FROM products WHERE merchant_id = $1 AND name = $2
       )`,
      [merchant.id, product.name, product.description, product.price_usd, product.type]
    )
  }

  console.log(`Seeded ${products.length} demo products for GasFree Pay`)
  await pool.end()
}

seed().catch(e => {
  console.error(e)
  process.exit(1)
})
