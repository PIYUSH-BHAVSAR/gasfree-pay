require('dotenv').config({ path: '../backend/.env' })
require('@nomicfoundation/hardhat-toolbox')

const privateKey = process.env.UGF_SPONSOR_PRIVATE_KEY || ''
const account = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`

module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    'base-sepolia': {
      url: process.env.RPC_URL || 'https://sepolia.base.org',
      accounts: privateKey ? [account] : []
    }
  }
}
