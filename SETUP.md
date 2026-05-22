# GasFree Pay Setup Guide

This guide sets up GasFree Pay locally from a fresh clone.

GasFree Pay is a Base Sepolia dApp that uses UGF so users can pay for products or mint badges with `TYI_MOCK_USD` instead of needing ETH for normal app actions.

## 1. Prerequisites

Install these first:

- Node.js 18 or newer
- npm
- MetaMask
- Supabase account
- Base Sepolia test wallet

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by execution policy.

```powershell
node -v
npm -v
```

## 2. Project Structure

```text
gasfree-pay/
  backend/      Express API, Supabase/Postgres, UGF server calls
  frontend/     React + Vite app
  contracts/    Hardhat + BadgeMinter ERC-721 contract
```

## 3. Create Supabase Database

1. Go to `https://supabase.com`.
2. Create a new project.
3. Save your database password.
4. Open `Project Settings -> Database`.
5. Copy the Postgres connection string.
6. Prefer the Session Pooler connection string if available.

If your password contains `@`, replace it with `%40` inside the URL.

Example:

```text
password: mypass@
encoded:  mypass%40
```

## 4. Set Up MetaMask And Base Sepolia

Add Base Sepolia Testnet to MetaMask:

```text
Network name: Base Sepolia Testnet
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency symbol: ETH
Block explorer: https://sepolia.basescan.org
```

Get a small amount of Base Sepolia ETH from a faucet.

Then use the UGF faucet to mint `TYI_MOCK_USD`:

```text
https://universalgasframework.com/faucets
```

If Base Sepolia ETH is limited, lock a small amount such as `0.00005 ETH`.

## 5. Backend Environment

Create the backend env file:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\backend
Copy-Item .env.example .env
```

Edit `backend/.env`.

Use your real private values for:

```env
DATABASE_URL=postgresql://user:password@host:5432/postgres
JWT_SECRET=replace_with_random_64_char_secret
UGF_SPONSOR_PRIVATE_KEY=0xreplace_with_sponsor_wallet_private_key
```

Keep these public values:

```env
UGF_TOKEN_ADDRESS=0x27DC1C167AeF232bb1e21073304B526726a8727e
UGF_CHAIN_ID=84532
RPC_URL=https://sepolia.base.org
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Never commit `backend/.env`.

## 6. Frontend Environment

Create the frontend env file:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\frontend
Copy-Item .env.example .env
```

Current deployed public values:

```env
VITE_BADGE_CONTRACT=0x280E0Ac7D716602718CA6d4865B2Cc92f79F038f
VITE_TYI_ADDRESS=0x27DC1C167AeF232bb1e21073304B526726a8727e
```

Never commit `frontend/.env`.

## 7. Install Dependencies

Backend:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\backend
npm.cmd install
```

Frontend:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\frontend
npm.cmd install
```

Contracts:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\contracts
npm.cmd install
```

Do not run `npm audit fix --force` during setup. It can upgrade packages and break compatibility.

## 8. Database Migration And Demo Products

Run migration:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\backend
npm.cmd run migrate
```

Seed demo products:

```powershell
npm.cmd run seed
```

Seeded products:

```text
Hackathon Coffee - $0.01
Builder Badge Tip - $0.02
Creator Pass - $0.05
```

Creating products only writes to the database. It does not spend ETH or TYI.

## 9. Compile Contract

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\contracts
npm.cmd run compile
```

Expected:

```text
Compiled Solidity files successfully
```

## 10. Deploy Contract If Needed

The current deployed BadgeMinter is:

```text
0x280E0Ac7D716602718CA6d4865B2Cc92f79F038f
```

If you need to deploy a new contract:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\contracts
npm.cmd run deploy:base-sepolia
```

Copy the printed address into `frontend/.env`:

```env
VITE_BADGE_CONTRACT=0xYourNewContractAddress
```

Deploying spends Base Sepolia ETH from the sponsor wallet.

## 11. Run Backend

Open a terminal:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\backend
npm.cmd run dev
```

Backend should run at:

```text
http://localhost:3001
```

Health check:

```text
http://localhost:3001/health
```

Expected:

```json
{"status":"ok"}
```

Keep this terminal open.

## 12. Run Frontend

Open a second terminal:

```powershell
cd D:\projects\hackwithmumbai\gasfree-pay\frontend
npm.cmd run dev
```

Frontend should run at:

```text
http://localhost:5173
```

## 13. Verify App

Open:

```text
http://localhost:5173
```

Recommended verification order:

1. Click `Connect Wallet`.
2. Open `/profile`.
3. Confirm wallet address, Base Sepolia ETH, and TYI balance appear.
4. Open `/`.
5. Confirm demo products appear.
6. Open `/mint`.
7. Confirm badge cards show `Mint Badge`.

## 14. Safe Demo Flow

Because test ETH and TYI can be limited, do one live UGF action during demo.

Recommended minting demo:

1. Open `http://localhost:5173/profile`.
2. Show `Ready for demo` and TYI balance.
3. Open `http://localhost:5173/mint`.
4. Mint `Hackathon Builder`.
5. Approve the UGF modal/signatures.
6. Show success and BaseScan link.

Recommended payment demo:

1. Open Shop.
2. Select `Hackathon Coffee - $0.01`.
3. Approve UGF payment.
4. Show transaction success/history.

Do not repeatedly mint/pay unless you have enough TYI.

## 15. Submission Safety

Do not upload real env files:

```text
backend/.env
frontend/.env
contracts/.env
```

Safe to upload:

```text
backend/.env.example
frontend/.env.example
SETUP.md
README.md
source code
```

Also avoid uploading:

```text
node_modules/
dist/
artifacts/
cache/
```

The repo-level `.gitignore` already excludes these.

## 16. Public Testnet Values

```text
Network: Base Sepolia
Chain ID: 84532
RPC: https://sepolia.base.org
TYI_MOCK_USD: 0x27DC1C167AeF232bb1e21073304B526726a8727e
BadgeMinter: 0x280E0Ac7D716602718CA6d4865B2Cc92f79F038f
```
