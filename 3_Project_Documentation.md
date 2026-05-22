# GasFree Pay - Project Documentation

## 1. Project Overview

GasFree Pay is a beginner-friendly dApp on Base Sepolia that uses Universal Gas Framework (UGF) to let users complete onchain actions without needing ETH for gas. Users pay with `TYI_MOCK_USD`, and UGF handles quote, settlement, execution, and confirmation.

The app demonstrates two real user flows:

- Product payments through a simple checkout experience.
- ERC-721 badge minting through a gasless mint flow.

## 2. Problem Statement Alignment

Hackathon requirement:

> Build a beginner-friendly dApp on Base Sepolia that uses UGF to let users pay gas with Mock USD instead of needing ETH in their wallet.

GasFree Pay satisfies this by:

- Running on Base Sepolia, chain ID `84532`.
- Using `@tychilabs/ugf-testnet-js` in the backend.
- Using `@tychilabs/react-ugf` in the frontend.
- Letting users use `TYI_MOCK_USD` instead of native ETH for gas.
- Providing useful onchain actions: product checkout and badge minting.

## 3. Core Value Proposition

Most beginner users get blocked because they need ETH before they can do anything onchain. GasFree Pay removes that friction.

User experience:

1. Connect wallet.
2. Check TYI Mock USD balance.
3. Choose a product or badge.
4. Approve the UGF modal/signatures.
5. Transaction lands on Base Sepolia without the user manually managing ETH gas.

## 4. Tech Stack

Frontend:

- React
- Vite
- React Router
- Ethers.js
- `@tychilabs/react-ugf`

Backend:

- Node.js
- Express
- PostgreSQL via Supabase
- Ethers.js
- `@tychilabs/ugf-testnet-js`
- JWT wallet authentication

Smart Contracts:

- Solidity
- Hardhat
- OpenZeppelin ERC-721

Network:

- Base Sepolia Testnet

## 5. Public Testnet Values

```text
Network: Base Sepolia
Chain ID: 84532
RPC URL: https://sepolia.base.org
Block Explorer: https://sepolia.basescan.org
TYI_MOCK_USD: 0x27DC1C167AeF232bb1e21073304B526726a8727e
BadgeMinter: 0x280E0Ac7D716602718CA6d4865B2Cc92f79F038f
```

## 6. Architecture

```text
User Wallet
  |
  | connects/signs
  v
React Frontend
  |
  | API requests
  v
Express Backend
  |
  | stores products, users, transactions
  v
Supabase PostgreSQL

React Frontend / Backend
  |
  | quote, settle, sponsor, execute
  v
Universal Gas Framework
  |
  | sponsored transaction
  v
Base Sepolia
```

## 7. UGF Flow

UGF lifecycle used by the project:

1. Wallet signs login/auth message.
2. App requests a UGF quote.
3. User signs payment authorization in TYI Mock USD.
4. UGF settles the payment.
5. UGF sponsors and executes the target Base Sepolia transaction.
6. App records the confirmed transaction.

For payments, the target action is a TYI transfer to the merchant wallet.

For badge minting, the target action is a call to:

```solidity
mint(address to, string calldata badgeId)
```

on the deployed `BadgeMinter` contract.

## 8. Product Payment Flow

Demo products:

```text
Hackathon Coffee - $0.01
Builder Badge Tip - $0.02
Creator Pass - $0.05
```

Flow:

1. User connects MetaMask.
2. App checks TYI balance.
3. User selects a product.
4. UGF modal opens.
5. User approves the TYI-based payment.
6. UGF executes on Base Sepolia.
7. Backend stores the transaction.
8. User can view transaction history.

## 9. Badge Minting Flow

Available badges:

```text
GasFree Pioneer
Verified Merchant
Top Contributor
Hackathon Builder
```

Flow:

1. User opens the Mint Badge page.
2. User selects a badge.
3. Frontend encodes the ERC-721 `mint()` call.
4. React-UGF opens the gasless modal.
5. User approves the TYI quote/payment.
6. UGF sponsors the gas and executes the mint.
7. NFT badge is minted to the user's wallet.
8. User receives a BaseScan transaction link.

## 10. Smart Contract

Contract: `BadgeMinter.sol`

Purpose:

- Mint ERC-721 badges.
- Prevent duplicate badge type claims per wallet.
- Track badge type per token ID.

Main function:

```solidity
function mint(address to, string calldata badgeId) external returns (uint256)
```

Key properties:

- ERC-721 name: `GasFree Badge`
- ERC-721 symbol: `GFB`
- Deployed on Base Sepolia
- Contract address: `0x280E0Ac7D716602718CA6d4865B2Cc92f79F038f`

## 11. Database Schema

The backend migration creates:

- `users`: wallet auth and nonce storage.
- `merchants`: merchant wallet and business metadata.
- `products`: product catalog.
- `transactions`: payment history and status.
- `quotes_cache`: cached UGF quotes by digest.

Supabase is used as hosted PostgreSQL.

## 12. Security And Secret Handling

Real `.env` files are not included in the submission.

Sensitive values:

- Supabase `DATABASE_URL`
- `JWT_SECRET`
- `UGF_SPONSOR_PRIVATE_KEY`

Only `.env.example` files are included, with public values and placeholders for secrets.

Public values included:

- Base Sepolia RPC URL
- UGF chain ID
- TYI token address
- Badge contract address

## 13. Local Run Instructions

Install backend:

```powershell
cd backend
npm.cmd install
npm.cmd run migrate
npm.cmd run seed
npm.cmd run dev
```

Install frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Install contracts:

```powershell
cd contracts
npm.cmd install
npm.cmd run compile
```

Open:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:3001/health
```

## 14. Demo Script

Recommended final demo:

1. Open app.
2. Connect MetaMask on Base Sepolia.
3. Open Profile page.
4. Show TYI Mock USD balance and "Ready for demo".
5. Open Mint Badge page.
6. Mint `Hackathon Builder`.
7. Show success message and BaseScan link.
8. Explain that the user paid with TYI Mock USD and did not manually handle ETH gas.

Optional payment demo:

1. Open Shop.
2. Select `Hackathon Coffee - $0.01`.
3. Complete UGF payment.
4. Show transaction history.

## 15. Current Status

Completed:

- Supabase database connected.
- Backend migration works.
- Demo products seeded.
- Wallet profile page added.
- TYI balance detection fixed using official UGF registry token address.
- Badge contract compiled and deployed.
- Frontend configured with deployed BadgeMinter address.
- Frontend production build passes.

## 16. Future Improvements

- Deploy frontend and backend to public hosting.
- Add richer merchant dashboard analytics.
- Add webhook verification signatures.
- Add automatic token onboarding instructions for new users.
- Add NFT metadata and badge images.
- Add better transaction retry/status polling.

## 17. Conclusion

GasFree Pay demonstrates how UGF can make onchain actions feel simple for beginners. Users can pay or mint on Base Sepolia while UGF handles the gas side through TYI Mock USD. This directly addresses the hackathon goal of making Web3 UX closer to a normal app experience.
