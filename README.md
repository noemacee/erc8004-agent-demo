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
├── scripts/           # Deployment and interaction scripts
│   ├── deploy.js
│   ├── register-agent.js
│   ├── give-feedback.js
│   └── validate.js
├── agent/            # Sample AI agent implementation
│   ├── agent-server.js
│   └── registration.json
├── test/             # Contract tests
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
