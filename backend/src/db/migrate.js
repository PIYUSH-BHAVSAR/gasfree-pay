const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      address TEXT UNIQUE NOT NULL,
      nonce TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id SERIAL PRIMARY KEY,
      wallet TEXT UNIQUE NOT NULL,
      business_name TEXT,
      webhook_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      merchant_id INT REFERENCES merchants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price_usd NUMERIC(12,2) NOT NULL,
      type TEXT CHECK (type IN ('one-time','subscription')) DEFAULT 'one-time',
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      payer TEXT NOT NULL,
      merchant_id INT REFERENCES merchants(id),
      product_id INT REFERENCES products(id),
      product_name TEXT,
      amount_usd NUMERIC(12,2),
      tx_hash TEXT,
      digest TEXT UNIQUE,
      status TEXT CHECK (status IN ('pending','confirmed','failed')) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quotes_cache (
      digest TEXT PRIMARY KEY,
      product_id INT,
      payer TEXT,
      ugf_quote JSONB,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Migration complete')
  await pool.end()
}

migrate().catch(e => { console.error(e); process.exit(1) })
