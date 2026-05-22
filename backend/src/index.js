require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

app.use('/auth', require('./routes/auth'))
app.use('/api/payment', require('./routes/payment'))
app.use('/api/merchants', require('./routes/merchants'))
app.use('/api/products', require('./routes/products'))
app.use('/api/faucet', require('./routes/faucet'))

app.get('/health', (_, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 GasFree backend :${PORT}`))
