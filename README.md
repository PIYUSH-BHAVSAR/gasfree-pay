# GasFree Pay

GasFree Pay is a beginner-friendly Base Sepolia dApp that uses Universal Gas Framework (UGF) so users can pay or mint onchain without manually handling ETH gas.

Users pay with `TYI_MOCK_USD`; UGF handles quote, settlement, execution, and confirmation.

Built for the UGF Hackathon - Payments and Minting tracks.

## Demo Flows

- Product checkout with TYI Mock USD.
- ERC-721 badge minting through UGF `sponsorAndExecute`.
- Wallet profile showing Base Sepolia ETH, TYI balance, and demo readiness.
- Merchant/product dashboard with seeded demo products.

## Public Testnet Values

```text
Network: Base Sepolia
Chain ID: 84532
RPC URL: https://sepolia.base.org
Block Explorer: https://sepolia.basescan.org
TYI_MOCK_USD: 0x27DC1C167AeF232bb1e21073304B526726a8727e
BadgeMinter: 0x280E0Ac7D716602718CA6d4865B2Cc92f79F038f
```

## How It Works

```text
User has TYI_MOCK_USD
  -> pays product or mints badge
  -> React UGF modal opens
  -> UGF gets quote
  -> user approves TYI payment
  -> UGF settles payment
  -> UGF sponsors and executes Base Sepolia transaction
  -> app shows success / BaseScan proof
```

UGF lifecycle:

1. Wallet authentication/signature.
2. `quote.get` returns quote and digest.
3. `payment.x402.execute` settles the TYI payment.
4. `chains.evm.sponsorAndExecute` sponsors gas and executes the transaction.
5. App stores and displays the confirmed transaction.

## Tech Stack

Frontend:

- React
- Vite
- React Router
- Ethers.js
- `@tychilabs/react-ugf`

Backend:

- Node.js
- Express
- Supabase/PostgreSQL
- JWT wallet auth
- Ethers.js
- `@tychilabs/ugf-testnet-js`

Contracts:

- Solidity
- Hardhat
- OpenZeppelin ERC-721

## Project Structure

```text
frontend/
  src/
    App.jsx
    hooks/useWallet.jsx
    pages/
      Home.jsx
      Profile.jsx
      Onboard.jsx
      Pay.jsx
      BadgeMint.jsx
      MerchantDashboard.jsx
      MerchantNew.jsx
      History.jsx
      Widget.jsx

backend/
  src/
    index.js
    db/
      migrate.js
      seed.js
      pool.js
    routes/
      auth.js
      faucet.js
      merchants.js
      payment.js
      products.js
    services/
      ugf.js

contracts/
  contracts/
    BadgeMinter.sol
  deploy.js
  hardhat.config.js
```

## Environment Files

Do not commit real `.env` files. Use the examples:

```text
backend/.env.example
frontend/.env.example
```

Backend sensitive values:

```env
DATABASE_URL=postgresql://user:password@host:5432/postgres
JWT_SECRET=replace_with_random_64_char_secret
UGF_SPONSOR_PRIVATE_KEY=0xreplace_with_sponsor_wallet_private_key
```

Backend public values:

```env
UGF_TOKEN_ADDRESS=0x27DC1C167AeF232bb1e21073304B526726a8727e
UGF_CHAIN_ID=84532
RPC_URL=https://sepolia.base.org
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Frontend public values:

```env
VITE_BADGE_CONTRACT=0x280E0Ac7D716602718CA6d4865B2Cc92f79F038f
VITE_TYI_ADDRESS=0x27DC1C167AeF232bb1e21073304B526726a8727e
```

## Setup

Full setup instructions are in:

```text
SETUP.md
```

Quick local setup:

```powershell
# Backend
cd backend
npm.cmd install
npm.cmd run migrate
npm.cmd run seed
npm.cmd run dev
```

```powershell
# Frontend
cd frontend
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:3001/health
```

## Contracts

Compile:

```powershell
cd contracts
npm.cmd install
npm.cmd run compile
```

Deploy a new BadgeMinter only if needed:

```powershell
npm.cmd run deploy:base-sepolia
```

Current deployed contract:

```text
0x280E0Ac7D716602718CA6d4865B2Cc92f79F038f
```

## Demo Products

Run:

```powershell
cd backend
npm.cmd run seed
```

Seeded products:

```text
Hackathon Coffee - $0.01
Builder Badge Tip - $0.02
Creator Pass - $0.05
```

## Recommended Demo Script

1. Open the app.
2. Connect MetaMask on Base Sepolia.
3. Open Profile and show TYI balance.
4. Open Mint Badge.
5. Mint `Hackathon Builder`.
6. Show success and BaseScan link.
7. Explain that the user paid with TYI Mock USD and UGF handled the gas.

Optional payment demo:

1. Open Shop.
2. Choose `Hackathon Coffee - $0.01`.
3. Approve UGF payment.
4. Show transaction history.

## Submission Notes

Safe to submit:

- Source code
- `.env.example` files
- `README.md`
- `SETUP.md`
- `3_Project_Documentation.md`
- Demo video

Do not submit:

- Real `.env` files
- Private keys
- Supabase passwords
- `node_modules`
- `dist`
- Hardhat `artifacts` or `cache`

## Resources

- UGF Docs: https://universalgasframework.com/docs
- UGF Testnet Docs: https://universalgasframework.com/docs/testnet
- UGF Faucet: https://universalgasframework.com/faucets
- UGF SDK: https://www.npmjs.com/package/@tychilabs/ugf-testnet-js
- React UGF SDK: https://www.npmjs.com/package/@tychilabs/react-ugf
- BaseScan Sepolia: https://sepolia.basescan.org
