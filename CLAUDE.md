# SmartSettle — Claude Project Context

## What This Project Does
SmartSettle is an autonomous AI agent that negotiates and pays bills at the lowest possible price using Celo stablecoins. It reads invoices, negotiates discounts with providers, and executes on-chain payments — storing immutable receipts on Celo.

## Architecture Overview
```
User (Mobile/Web)
    │
    ▼
Frontend (React / Next.js)        ← src/components/
    │
    ▼
Backend API Layer                 ← src/backend/
    │
    ├───────────────────┐
    ▼                   ▼
AI Agent Layer      Provider Integration Layer
(src/agent/)            │
    │               Utility / SaaS APIs
    ▼
Decision Engine
    │
    ▼
Blockchain Agent Wallet
    │
    ▼
Smart Contracts on Celo           ← contracts/
    │
    ▼
Stablecoin Payment (cUSD) + On-chain Receipt
```

## Key Flows
1. User uploads invoice (PDF/image)
2. AI extracts: amount, due date, provider, penalties
3. Agent negotiates: early payment discount, late fee waiver, loyalty discount
4. Decision engine picks best offer
5. Agent pays via cUSD on Celo, stores receipt on-chain
6. User notified with savings summary

## Tech Stack
- **Blockchain**: Celo, Solidity, cUSD stablecoin
- **AI**: OCR (Tesseract/Vision API), LLM (Claude via Anthropic API), LangChain agents
- **Backend**: Node.js + Express
- **Frontend**: React + Next.js + WalletConnect
- **Testing**: Hardhat + Chai

## Smart Contracts (contracts/)
- `SmartSettle.sol`      — Core payment vault + negotiation registry
- `ReceiptStore.sol`     — On-chain receipt & invoice hash storage
- `AgentWallet.sol`      — Autonomous agent wallet with spend limits
- `MockProvider.sol`     — Mock provider for local testing

## Environment Variables
See `.env.example`. Never commit `.env` to git.

## Commands
- `npm run dev`           — Start Next.js frontend
- `npm run agent`         — Start AI agent server
- `npx hardhat test`      — Run smart contract tests
- `npx hardhat deploy`    — Deploy to Celo Sepolia testnet
- `/deploy`               — Claude slash command for guided deploy
- `/review`               — Claude code review on smart contracts

## Key Decisions
- Use cUSD (not CELO) for payments — price stability for bill amounts
- Agent wallet has a configurable max spend limit per transaction
- All invoice hashes stored on-chain for auditability
- Negotiation logic runs off-chain; only final payment is on-chain

## Network — Celo Sepolia Testnet
- Chain ID  : 11142220 (0xAA044C)
- RPC       : https://forno.celo-sepolia.celo-testnet.org
- Explorer  : https://celo-sepolia.blockscout.com
- Faucet    : https://faucet.celo.org/celo-sepolia
- cUSD (mainnet) : 0x765DE816845861e75A25fCA122bb6898B8B1282a

## Contacts / Resources
- Celo docs: https://docs.celo.org
- Celo Sepolia testnet: https://docs.celo.org/tooling/testnets/celo-sepolia
- Anthropic API: https://docs.anthropic.com
- Hardhat: https://hardhat.org/docs
