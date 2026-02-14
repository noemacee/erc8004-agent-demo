# ERC-8004 Agent Reputation Demo

A hands-on project to understand how ERC-8004 works for AI agents by deploying your own agent and using the reputation system.

## What You'll Learn

1. **ERC-8004 Architecture**: Understanding the three core registries (Identity, Reputation, Validation)
2. **Agent Registration**: How to register an agent as an NFT with metadata
3. **Reputation System**: How to give and receive feedback on-chain
4. **Validation Registry**: How to request and provide validation proofs
5. **Off-chain Integration**: How agents connect registration files to MCP/A2A endpoints

## Project Structure

```
erc8004-agent-demo/
├── contracts/          # ERC-8004 smart contracts
│   ├── IdentityRegistry.sol
│   ├── ReputationRegistry.sol
│   └── ValidationRegistry.sol
├── frontend/           # React + TypeScript + Vite dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contracts/      # Contract ABIs and factories
│   │   ├── context/        # Web3 context provider
│   │   ├── hooks/          # Custom React hooks
│   │   ├── styles/         # CSS styles
│   │   └── types/          # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── scripts/            # Deployment and interaction scripts
│   ├── deploy.js
│   ├── register-agent.js
│   ├── give-feedback.js
│   └── validate.js
├── agent/              # Sample AI agent implementation
│   ├── agent-server.js
│   └── registration.json
├── test/               # Contract tests
└── hardhat.config.js
```

## Prerequisites

- Node.js v18+
- Basic understanding of Ethereum/Solidity
- MetaMask or similar Web3 wallet
- Some testnet ETH (we'll use Sepolia)

## Quick Start

1. Install dependencies:
```bash
npm install
cd frontend && npm install && cd ..
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your private key and RPC URL
```

3. Deploy the registries:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

4. Register your agent:
```bash
npx hardhat run scripts/register-agent.js --network sepolia
```

5. Interact with the reputation system:
```bash
npx hardhat run scripts/give-feedback.js --network sepolia
```

## Frontend Dashboard

The project includes a React + TypeScript web-based dashboard to interact with all three registries.

### Starting the Frontend

```bash
npm run frontend
```

This will start the Vite development server at http://localhost:5173

### Building for Production

```bash
npm run frontend:build
```

Build output will be in `frontend/dist/`.

### Previewing Production Build

```bash
npm run frontend:preview
```

### Features

The dashboard provides three main tabs:

#### 1. Identities Tab
- View all registered agents on the Identity Registry
- See agent owner addresses
- View agent wallet addresses
- Display agent URIs (pointing to registration files)

#### 2. Feedback Tab
- Select any registered agent to view their feedback history
- See all feedback entries with values, tags, and client addresses
- Positive feedback shown in green, negative in red
- Revoked feedback is visually dimmed

#### 3. Give Feedback Tab
- Submit feedback to any agent
- Set feedback value (-100 to +100)
- Add optional tags for categorization
- Include endpoint being rated
- Link to off-chain feedback URI (IPFS or HTTP)

### How to Use

1. **Connect Wallet**: Click "Connect Wallet" and approve in MetaMask
2. **Enter Contract Addresses**: Copy addresses from `deployment-info.json` after deploying
   - The addresses are saved in localStorage for convenience
3. **Browse & Interact**: Use the tabs to view agents and submit feedback

### Contract Address Configuration

After deploying contracts with `npm run deploy`, find the addresses in `deployment-info.json`:

```json
{
  "contracts": {
    "identityRegistry": "0x...",
    "reputationRegistry": "0x...",
    "validationRegistry": "0x..."
  }
}
```

Copy these into the corresponding fields in the frontend's configuration section.

## Key Concepts

### Identity Registry
- Based on ERC-721 (NFT standard)
- Each agent is a unique NFT with metadata
- Contains agent registration file URI
- Transferable ownership

### Reputation Registry
- Stores feedback from clients to agents
- Fixed-point value system with decimals
- Optional tags for categorization
- Off-chain enrichment via IPFS

### Validation Registry
- Request/response pattern for validation
- Supports zkML, TEE, staking mechanisms
- Cryptographic commitments via hashes
- Progressive validation states

## Tutorial Steps

See `docs/TUTORIAL.md` for a detailed walkthrough of:
1. Understanding the contracts
2. Deploying your first agent
3. Building a reputation
4. Implementing validation
5. Creating a full agent service

## Resources

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Agent-to-Agent Protocol](https://github.com/google/A2A)
- [Model Context Protocol](https://modelcontextprotocol.io)
