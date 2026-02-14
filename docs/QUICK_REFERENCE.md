# ERC-8004 Quick Reference

## Commands Cheat Sheet

### Setup
```bash
npm install
cp .env.example .env
# Edit .env with your private key
```

### Deploy Contracts
```bash
# Local network
npx hardhat run scripts/deploy.js --network hardhat

# Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### Register Agent
```bash
npx hardhat run scripts/register-agent.js --network sepolia
```

### Give Feedback
```bash
npx hardhat run scripts/give-feedback.js --network sepolia
```

### Validate Work
```bash
npx hardhat run scripts/validate.js --network sepolia
```

### Run Tests
```bash
npx hardhat test
```

### Start Agent Server
```bash
npm run agent
```

---

## Key Concepts

### Global Agent Identifier
```
eip155:{chainId}:{registryAddress}#{agentId}
```

### Feedback Value Encoding
```javascript
// 5 stars
{ value: 5, valueDecimals: 0 }

// 99.8%
{ value: 998, valueDecimals: 1 }

// $123.45
{ value: 12345, valueDecimals: 2 }
```

### Tag Conventions
**tag1 Options:**
- `quality` - Overall quality rating
- `uptime` - Service availability
- `responseTime` - Performance metric
- `accuracy` - Output correctness
- `security` - Security assessment

**tag2 Options:**
- `service` - General service quality
- `reliability` - Dependability
- `performance` - Speed/efficiency
- `support` - Customer support
- Task-specific tags

---

## Smart Contract ABIs

### IdentityRegistry

**Register Agent:**
```javascript
register(string agentURI) → uint256 agentId
register(string agentURI, MetadataEntry[] metadata) → uint256 agentId
```

**Update Agent:**
```javascript
setAgentURI(uint256 agentId, string newURI)
setMetadata(uint256 agentId, string key, bytes value)
setAgentWallet(uint256 agentId, address wallet, uint256 deadline, bytes signature)
```

**Query:**
```javascript
ownerOf(uint256 agentId) → address
tokenURI(uint256 agentId) → string
getMetadata(uint256 agentId, string key) → bytes
getAgentWallet(uint256 agentId) → address
```

### ReputationRegistry

**Give Feedback:**
```javascript
giveFeedback(
  uint256 agentId,
  int128 value,
  uint8 valueDecimals,
  string tag1,
  string tag2,
  string endpoint,
  string feedbackURI,
  bytes32 feedbackHash
)
```

**Query:**
```javascript
readFeedback(uint256 agentId, address client, uint64 index) 
  → (int128 value, uint8 decimals, string tag1, string tag2, bool revoked)

getSummary(uint256 agentId, address[] clients, string tag1, string tag2)
  → (uint64 count, int128 sum, uint8 decimals)

getClients(uint256 agentId) → address[]
```

### ValidationRegistry

**Request/Response:**
```javascript
validationRequest(
  address validator,
  uint256 agentId,
  string requestURI,
  bytes32 requestHash
)

validationResponse(
  bytes32 requestHash,
  uint8 response,      // 0-100
  string responseURI,
  bytes32 responseHash,
  string tag
)
```

**Query:**
```javascript
getValidationStatus(bytes32 requestHash)
  → (address validator, uint256 agentId, uint8 response, 
     bytes32 responseHash, string tag, uint256 lastUpdate)

getSummary(uint256 agentId, address[] validators, string tag)
  → (uint64 count, uint8 average)
```

---

## Off-Chain File Structures

### Agent Registration File
```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Agent Name",
  "description": "What this agent does",
  "image": "https://...",
  "services": [
    {
      "name": "A2A",
      "endpoint": "https://.../.well-known/agent-card.json",
      "version": "0.3.0"
    }
  ],
  "supportedTrust": ["reputation", "crypto-economic"]
}
```

### Feedback File
```json
{
  "agentRegistry": "eip155:1:0x...",
  "agentId": 22,
  "clientAddress": "eip155:1:0x...",
  "createdAt": "2025-02-14T12:00:00Z",
  "value": 5,
  "valueDecimals": 0,
  "tag1": "quality",
  "tag2": "service",
  "comment": "Detailed feedback...",
  "proofOfPayment": {
    "txHash": "0x..."
  }
}
```

### Validation Request File
```json
{
  "taskId": "task-123",
  "input": {
    "dataset": "ipfs://...",
    "parameters": {}
  },
  "output": {
    "results": "ipfs://...",
    "summary": {}
  },
  "timestamp": "2025-02-14T12:00:00Z"
}
```

---

## Common Workflows

### 1. Deploy Full System
```bash
npx hardhat run scripts/deploy.js --network sepolia
# Saves to deployment-info.json
```

### 2. Register New Agent
```bash
npx hardhat run scripts/register-agent.js --network sepolia
# Saves to agent-info.json
```

### 3. Client Gives Feedback
```javascript
const tx = await reputationRegistry.giveFeedback(
  agentId,
  5,              // 5 stars
  0,              // no decimals
  "quality",      // tag1
  "service",      // tag2
  "https://...",  // endpoint
  "ipfs://...",   // feedback file
  ethers.ZeroHash // hash (not needed for IPFS)
);
```

### 4. Request Validation
```javascript
const requestData = { /* task details */ };
const requestHash = ethers.keccak256(
  ethers.toUtf8Bytes(JSON.stringify(requestData))
);

await validationRegistry.validationRequest(
  validatorAddress,
  agentId,
  "ipfs://...",  // request file
  requestHash
);
```

### 5. Validator Responds
```javascript
await validationRegistry.connect(validator).validationResponse(
  requestHash,
  95,            // 95/100 score
  "ipfs://...",  // response file
  responseHash,
  "zkml"         // tag
);
```

---

## Network Information

### Sepolia Testnet
- Chain ID: 11155111
- RPC: https://rpc.sepolia.org
- Faucet: https://sepoliafaucet.com
- Explorer: https://sepolia.etherscan.io

### Arbitrum Sepolia
- Chain ID: 421614
- RPC: https://sepolia-rollup.arbitrum.io/rpc
- Faucet: https://faucet.quicknode.com/arbitrum/sepolia
- Explorer: https://sepolia.arbiscan.io

### Base Sepolia
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Faucet: https://faucet.quicknode.com/base/sepolia
- Explorer: https://sepolia.basescan.org

---

## Troubleshooting

### Contract Deployment Fails
- Check you have testnet ETH
- Verify RPC URL in .env
- Ensure private key is correct

### Agent Registration Fails
- Ensure contracts are deployed
- Check deployment-info.json exists
- Verify you have ETH for gas

### Cannot Give Feedback
- Ensure agent is registered
- Check you're not the agent owner
- Verify reputation registry is initialized

### Validation Request Fails
- Ensure you're the agent owner
- Check validator address is valid
- Verify validation registry is initialized

---

## Security Best Practices

1. **Never commit .env file**
2. **Use testnet for learning**
3. **Keep private keys secure**
4. **Verify contract addresses**
5. **Test thoroughly before mainnet**
6. **Use hardware wallet for mainnet**
7. **Audit contracts before production**

---

## Resources

- [ERC-8004 Spec](https://eips.ethereum.org/EIPS/eip-8004)
- [Hardhat Docs](https://hardhat.org/docs)
- [Ethers.js Docs](https://docs.ethers.org)
- [OpenZeppelin](https://docs.openzeppelin.com)
